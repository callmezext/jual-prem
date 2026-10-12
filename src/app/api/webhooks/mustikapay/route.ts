import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mustikapay } from "@/lib/mustikapay";
import { ampro } from "@/lib/ampro";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const signature = req.headers.get("x-signature") || "";

    if (!mustikapay.verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const order_id = rawBody.order_id || rawBody.invoice || rawBody.invoice_number;
    const status = String(rawBody.status || rawBody.transaction_status || "").toUpperCase();

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNumber: order_id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ message: "Order already processed" });
    }

    if (status === "PAID" || status === "SETTLEMENT" || status === "SUCCESS") {
      if (order.orderType === "SINGLE_VERIFY") {
        // Update order status ke WAITING_LINK
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "WAITING_LINK",
            paidAt: new Date(),
          },
        });

        // Otomatis kirim magic link ke email target akun Alight Motion
        if (order.targetEmail) {
          try {
            await ampro.sendLink(order.targetEmail);
          } catch (err) {
            console.error("Gagal auto send link Ampro:", err);
          }
        }
      } else if (order.orderType === "MEMBERSHIP") {
        // Aktivasi Membership untuk User
        const plan = await prisma.membershipPlan.findUnique({
          where: { id: order.planId! },
        });

        if (plan) {
          // Hitung durasi masa aktif (1 bulan atau 3 bulan)
          const now = new Date();
          const expiresAt = new Date();
          expiresAt.setMonth(now.getMonth() + plan.durationMonths);

          // Cek apakah user sudah punya membership aktif untuk diperpanjang
          const existingMembership = await prisma.userMembership.findFirst({
            where: {
              userId: order.userId,
              status: "ACTIVE",
              expiresAt: { gt: now },
            },
            orderBy: { expiresAt: "desc" },
          });

          if (existingMembership) {
            // Perpanjang durasi membership yang ada
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
            // Buat membership baru
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

        // Tandai order membership COMPLETED
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
