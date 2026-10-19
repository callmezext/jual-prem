import { prisma } from "@/lib/prisma";
import { ampro } from "@/lib/ampro";
import { tempmail } from "@/lib/tempmail";

export async function processPaidOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order || order.status !== "PENDING") {
    return order;
  }

  const now = new Date();

  // 1. KASUS: AKUN SIAP PAKAI (@enchant.id bawaan web)
  if (order.orderType === "INSTANT_ACCOUNT") {
    const email = order.targetEmail;
    if (!email) {
      return await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED", paidAt: now },
      });
    }

    // Tandai status sedang diproses
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "ACTIVATING", paidAt: now },
    });

    try {
      // Pastikan mailbox terdaftar
      await tempmail.createMailbox(email.split("@")[0]);

      // Kirim link verifikasi awal untuk mengaktifkan lisensi Alight Motion Pro
      await ampro.sendLink(email);

      // Polling pesan masuk untuk mendapatkan link aktivasi
      let loginLink: string | null = null;
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const inbox = await tempmail.getInbox(email);
        if (inbox.messages && inbox.messages.length > 0) {
          const matched = inbox.messages.find((m) => m.loginLink);
          if (matched && matched.loginLink) {
            loginLink = matched.loginLink;
            break;
          }
        }
      }

      if (loginLink) {
        // Verifikasi link dan jadikan akun Pro 1 Tahun
        const verifyRes = await ampro.verifyLink(
          email,
          loginLink,
          order.targetNickname || undefined
        );

        if (verifyRes.success && verifyRes.data) {
          // Simpan catatan aktivasi resmi di database
          await prisma.activation.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              source: "WEB_SINGLE",
              targetEmail: email,
              targetNickname: order.targetNickname,
              amUid: verifyRes.data.uid || null,
              amOrderId: verifyRes.data.orderId || null,
              membershipStatus: verifyRes.data.membershipStatus || "PREMIUM_ACTIVE",
              planName: verifyRes.data.planName || "Alight Motion Pro / Member",
              subscriptionType: verifyRes.data.subscriptionType || "Yearly VIP License",
              validUntil: verifyRes.data.validUntil || "1 Tahun",
              validUntilTimestamp: verifyRes.data.validUntilTimestamp
                ? String(verifyRes.data.validUntilTimestamp)
                : null,
              idToken: verifyRes.data.idToken || null,
              refreshToken: verifyRes.data.refreshToken || null,
              status: "SUCCESS",
            },
          });

          // Bersihkan email aktivasi awal agar saat user login Alight Motion, hanya pesan login baru yang muncul
          await tempmail.clearInbox(email);

          // Update status order menjadi selesai (COMPLETED)
          return await prisma.order.update({
            where: { id: order.id },
            data: { status: "COMPLETED", paidAt: now },
            include: {
              activations: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          });
        }
      }

      // Jika polling link belum selesai tepat waktu, alihkan ke WAITING_LINK
      return await prisma.order.update({
        where: { id: order.id },
        data: { status: "WAITING_LINK", paidAt: now },
      });
    } catch (err: any) {
      console.error("[OrderProcessor] Gagal aktivasi otomatis:", err.message);
      return await prisma.order.update({
        where: { id: order.id },
        data: { status: "WAITING_LINK", paidAt: now },
      });
    }
  }

  // 2. KASUS: EMAIL SENDIRI (Gmail / Email Pribadi)
  if (order.orderType === "SINGLE_VERIFY") {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "WAITING_LINK",
        paidAt: now,
      },
    });

    if (order.targetEmail) {
      try {
        await ampro.sendLink(order.targetEmail);
      } catch (err) {
        console.warn("[OrderProcessor] Gagal mengirim link ke Gmail:", err);
      }
    }
    return updated;
  }

  // 3. KASUS: MEMBERSHIP RESELLER
  if (order.orderType === "MEMBERSHIP" && order.planId) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: order.planId },
    });

    if (plan) {
      const expiresAt = new Date();
      expiresAt.setMonth(now.getMonth() + plan.durationMonths);

      const existingMembership = await prisma.userMembership.findFirst({
        where: {
          userId: order.userId,
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: "desc" },
      });

      if (existingMembership) {
        const extendedExpiry = new Date(existingMembership.expiresAt);
        extendedExpiry.setMonth(extendedExpiry.getMonth() + plan.durationMonths);

        const newTotal =
          plan.quota === -1 || existingMembership.totalQuota === -1
            ? -1
            : existingMembership.totalQuota + plan.quota;
        const newRemaining =
          plan.quota === -1 || existingMembership.remainingQuota === -1
            ? -1
            : existingMembership.remainingQuota + plan.quota;

        await prisma.userMembership.update({
          where: { id: existingMembership.id },
          data: {
            expiresAt: extendedExpiry,
            totalQuota: newTotal,
            remainingQuota: newRemaining,
            planName: `${existingMembership.planName} (Extended)`,
          },
        });
      } else {
        await prisma.userMembership.create({
          data: {
            userId: order.userId,
            planId: plan.id,
            planName: plan.name,
            totalQuota: plan.quota,
            remainingQuota: plan.quota,
            usedQuota: 0,
            durationMonths: plan.durationMonths,
            expiresAt,
            status: "ACTIVE",
          },
        });
      }
    }

    return await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "COMPLETED",
        paidAt: now,
      },
    });
  }

  return order;
}
