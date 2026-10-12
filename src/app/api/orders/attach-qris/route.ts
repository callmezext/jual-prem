import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { invoiceNumber, gatewayRefId, qrString, qrImageUrl } = await req.json();
    if (!invoiceNumber || !gatewayRefId || !qrString) {
      return NextResponse.json({ error: "Data QRIS tidak lengkap" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { invoiceNumber } });
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order sudah diproses" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        gatewayRefId,
        qrString,
        qrImageUrl: qrImageUrl || null,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
