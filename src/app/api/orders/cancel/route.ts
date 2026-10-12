import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { invoiceNumber } = await req.json();

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Nomor invoice wajib disertakan." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Hanya pesanan yang berstatus PENDING yang dapat dibatalkan." },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: "Pesanan berhasil dibatalkan.",
    });
  } catch (error: any) {
    console.error("Gagal membatalkan pesanan:", error);
    return NextResponse.json({ error: error.message || "Gagal membatalkan pesanan." }, { status: 500 });
  }
}
