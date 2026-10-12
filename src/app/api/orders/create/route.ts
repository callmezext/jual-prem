import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mustikapay } from "@/lib/mustikapay";
import { ampro } from "@/lib/ampro";
import { generateInvoiceNumber } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { userId, orderType, planId, targetEmail, targetNickname } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    let amount = 1000;
    let planName: string | null = null;

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
      if (!planId) {
        return NextResponse.json({ error: "Paket membership wajib dipilih" }, { status: 400 });
      }

      const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
      if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Paket membership tidak tersedia" }, { status: 404 });
      }

      amount = plan.price;
      planName = plan.name;
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
          planId: planId || null,
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
    const qris = await mustikapay.createQris({
      invoiceNumber,
      amount,
      customerName: user.displayName || user.email.split("@")[0],
      customerEmail: user.email,
    });

    // Simpan order di database
    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        userId: user.id,
        orderType,
        planId: planId || null,
        planName,
        targetEmail: targetEmail || null,
        targetNickname: targetNickname || null,
        amount,
        status: "PENDING",
        qrString: qris.qrString,
        qrImageUrl: qris.qrImageUrl,
        gatewayRefId: qris.transactionId,
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
