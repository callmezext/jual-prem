import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processPaidOrder } from "@/lib/order-processor";

export async function POST(req: Request) {
  try {
    const { invoiceNumber } = await req.json();

    const order = await prisma.order.findUnique({
      where: { invoiceNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ message: "Order is already processed", status: order.status });
    }

    const updated = await processPaidOrder(order.id);

    return NextResponse.json({
      success: true,
      message: "Simulasi pembayaran berhasil lunas!",
      order: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
