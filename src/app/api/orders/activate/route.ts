import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ampro } from "@/lib/ampro";

export async function POST(req: Request) {
  try {
    const { invoiceNumber, magicLink } = await req.json();

    if (!invoiceNumber || !magicLink) {
      return NextResponse.json({ error: "Invoice dan Magic Link wajib diisi" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (order.status !== "WAITING_LINK") {
      if (order.status === "COMPLETED") {
        return NextResponse.json({ error: "Pesanan ini sudah berhasil diaktifkan sebelumnya" }, { status: 400 });
      }
      return NextResponse.json({ error: "Pesanan belum lunas atau tidak dalam status menunggu link" }, { status: 400 });
    }

    if (!order.targetEmail) {
      return NextResponse.json({ error: "Email target tidak ditemukan pada pesanan" }, { status: 400 });
    }

    // Set order status ke ACTIVATING sementara
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "ACTIVATING" },
    });

    try {
      const res = await ampro.verifyLink(order.targetEmail, magicLink, order.targetNickname || undefined);

      if (!res.success || !res.data) {
        // Kembalikan ke WAITING_LINK
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "WAITING_LINK" },
        });
        return NextResponse.json({ error: res.message || "Gagal verifikasi link" }, { status: 400 });
      }

      const d = res.data;

      // Catat aktivasi ke database
      await prisma.activation.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          source: "WEB_SINGLE",
          targetEmail: d.email,
          targetNickname: d.displayName,
          amUid: d.uid,
          amOrderId: d.orderId,
          membershipStatus: d.membershipStatus,
          planName: d.planName,
          subscriptionType: d.subscriptionType,
          validUntil: d.validUntil,
          validUntilTimestamp: d.validUntilTimestamp ? String(d.validUntilTimestamp) : null,
          idToken: d.idToken,
          refreshToken: d.refreshToken,
          status: "SUCCESS",
        },
      });

      // Tandai order selesai
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED" },
      });

      return NextResponse.json({
        success: true,
        message: "Aktivasi Alight Motion Pro 1 Tahun Berhasil!",
        data: {
          email: d.email,
          displayName: d.displayName,
          planName: d.planName,
          validUntil: d.validUntil,
          orderId: d.orderId,
        },
      });
    } catch (verifErr: any) {
      // Revert status
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "WAITING_LINK" },
      });
      return NextResponse.json({ error: verifErr.message || "Gagal memverifikasi magic link" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
