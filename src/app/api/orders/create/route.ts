import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mustikapay, buildMerchantQris } from "@/lib/mustikapay";
import { ampro } from "@/lib/ampro";
import { generateInvoiceNumber, generateApiKey } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const {
      userId,
      firebaseUid,
      userEmail,
      userDisplayName,
      orderType,
      planId,
      planSlug,
      targetEmail,
      targetNickname,
      qrisData,
    } = await req.json();

    // 1. Cari user di database dengan berbagai fallback
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && firebaseUid) {
      user = await prisma.user.findUnique({ where: { firebaseUid } });
    }
    if (!user && userEmail) {
      user = await prisma.user.findFirst({ where: { email: userEmail } });
    }

    // 2. Auto-heal: Jika user sudah login Firebase tapi belum sempat tersimpan di PostgreSQL
    if (!user && (firebaseUid || userEmail)) {
      try {
        const emailToSave = userEmail || "user@enchant-store.com";
        const uidToSave = firebaseUid || `fb_${Date.now()}`;
        const userCount = await prisma.user.count();
        const isAdminEmail = emailToSave.toLowerCase() === "gunturafandy5@gmail.com";
        const role = userCount === 0 || isAdminEmail ? "admin" : "customer";

        user = await prisma.user.create({
          data: {
            firebaseUid: uidToSave,
            email: emailToSave,
            displayName: userDisplayName || emailToSave.split("@")[0],
            role,
            apiKey: generateApiKey(),
          },
        });
      } catch (createErr) {
        console.warn("Auto-create user during order error:", createErr);
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    let amount = 1000;
    let planName: string | null = null;
    let activePlanId = planId;

    if (orderType === "SINGLE_VERIFY") {
      if (!targetEmail || !targetEmail.includes("@")) {
        return NextResponse.json({ error: "Email target akun Alight Motion wajib diisi" }, { status: 400 });
      }

      // Cek ketersediaan server Ampro
      const amStatus = await ampro.getStatus();
      if (amStatus.status !== "online") {
        return NextResponse.json(
          { error: "Server aktivasi sedang pemeliharaan. Coba beberapa saat lagi." },
          { status: 503 }
        );
      }

      // Ambil harga satuan dari setting
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "single_verify_price" },
      });
      if (setting && setting.value !== undefined && setting.value !== null) {
        const parsed = parseInt(setting.value, 10);
        amount = isNaN(parsed) ? 1000 : parsed;
      }
    } else if (orderType === "MEMBERSHIP") {
      let plan = null;
      if (planId) {
        plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
      } else if (planSlug) {
        plan = await prisma.membershipPlan.findUnique({ where: { slug: planSlug } });
      }

      if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Paket membership tidak tersedia" }, { status: 404 });
      }

      amount = plan.price;
      planName = plan.name;
      activePlanId = plan.id;
    } else {
      return NextResponse.json({ error: "Tipe order tidak valid" }, { status: 400 });
    }

    const invoiceNumber = generateInvoiceNumber();

    // Jika nominal Rp 0 (Mode Gratis / Testing Bebas Biaya)
    if (amount <= 0) {
      const order = await prisma.order.create({
        data: {
          invoiceNumber,
          userId: user.id,
          orderType,
          planId: activePlanId || null,
          planName,
          targetEmail: targetEmail || null,
          targetNickname: targetNickname || null,
          amount: 0,
          status: "WAITING_LINK",
          paidAt: new Date(),
        },
      });

      // Otomatis kirim magic link ke email Alight Motion
      if (targetEmail) {
        try {
          await ampro.sendLink(targetEmail);
        } catch (err) {
          console.warn("Gagal auto send link:", err);
        }
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          invoiceNumber: order.invoiceNumber,
          orderType: order.orderType,
          planName: order.planName,
          targetEmail: order.targetEmail,
          amount: 0,
          status: order.status,
        },
      });
    }

    // Buat QRIS via Mustika Payment (jika nominal > 0)
    const clientQris = qrisData;
    let qrString = clientQris?.qrString || null;
    let qrImageUrl = clientQris?.qrImageUrl || null;
    let gatewayRefId = clientQris?.gatewayRefId || null;

    // Jika belum disediakan oleh browser pengguna, buat di server
    if (!qrString || !gatewayRefId) {
      try {
        const qris = await mustikapay.createQris({
          invoiceNumber,
          amount,
          customerName: user.displayName || user.email.split("@")[0],
          customerEmail: user.email,
        });
        qrString = qris.qrString;
        qrImageUrl = qris.qrImageUrl || null;
        gatewayRefId = qris.transactionId;
      } catch (err: any) {
        console.warn("Server MustikaPay QRIS creation failed, using resilient fallback:", err.message);
      }
    }

    // Jaminan 100% QRIS selalu tersedia dan tidak pernah null
    if (!qrString) {
      qrString = buildMerchantQris(amount, invoiceNumber);
      gatewayRefId = gatewayRefId || `QR_${invoiceNumber}`;
    }

    // Simpan order di database
    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        userId: user.id,
        orderType,
        planId: activePlanId || null,
        planName,
        targetEmail: targetEmail || null,
        targetNickname: targetNickname || null,
        amount,
        status: "PENDING",
        qrString,
        qrImageUrl,
        gatewayRefId,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        invoiceNumber: order.invoiceNumber,
        orderType: order.orderType,
        planName: order.planName,
        targetEmail: order.targetEmail,
        amount: order.amount,
        status: order.status,
        qrString: order.qrString,
        qrImageUrl: order.qrImageUrl,
      },
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
