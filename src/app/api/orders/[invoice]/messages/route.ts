import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tempmail } from "@/lib/tempmail";

export async function GET(req: Request, { params }: { params: { invoice: string } }) {
  try {
    const { invoice } = params;

    const order = await prisma.order.findUnique({
      where: { invoiceNumber: invoice },
      select: {
        id: true,
        invoiceNumber: true,
        orderType: true,
        targetEmail: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (!order.targetEmail) {
      return NextResponse.json({ success: true, messages: [] });
    }

    // Ambil inbox dari server tempmail
    const inbox = await tempmail.getInbox(order.targetEmail);

    return NextResponse.json({
      success: true,
      email: order.targetEmail,
      messages: inbox.messages || [],
    });
  } catch (error: any) {
    console.error("Fetch order messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
