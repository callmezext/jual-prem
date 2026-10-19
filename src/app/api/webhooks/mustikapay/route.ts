import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mustikapay } from "@/lib/mustikapay";
import { processPaidOrder } from "@/lib/order-processor";

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "MustikaPay Webhook Endpoint is ready and listening",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const signature = req.headers.get("x-signature") || req.headers.get("x-callback-signature") || "";

    // Verifikasi signature jika header signature dikirim oleh gateway
    if (signature && !mustikapay.verifySignature(rawBody, signature)) {
      console.warn("[Webhook] Invalid signature received:", signature);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Ekstraksi berbagai kemungkinan format ID transaksi dari MustikaPay
    const order_id =
      rawBody.ref_no ||
      rawBody.order_id ||
      rawBody.invoice ||
      rawBody.invoice_number ||
      rawBody.reference_id ||
      rawBody.originalPartnerReferenceNo ||
      rawBody.external_id ||
      rawBody.data?.ref_no ||
      rawBody.data?.order_id;

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id or ref_no in payload" }, { status: 400 });
    }

    // Cari pesanan berdasarkan invoiceNumber ATAU gatewayRefId (ref_no MustikaPay)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { invoiceNumber: String(order_id) },
          { gatewayRefId: String(order_id) },
        ],
      },
    });

    if (!order) {
      console.warn(`[Webhook] Order not found for identifier: ${order_id}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Jika pesanan sudah selesai / sudah diproses
    if (order.status !== "PENDING" && order.status !== "EXPIRED") {
      return NextResponse.json({ message: "Order already processed", status: order.status });
    }

    // Ekstraksi status pembayaran dari berbagai variasi payload SNAP / REST
    const rawSt = String(
      rawBody.status ||
      rawBody.transaction_status ||
      rawBody.raw?.transactionStatusDesc ||
      rawBody.data?.status ||
      ""
    ).toUpperCase();

    const rawCode = String(
      rawBody.latestTransactionStatus ||
      rawBody.raw?.latestTransactionStatus ||
      rawBody.response_code ||
      ""
    );

    const isPaid =
      rawSt === "PAID" ||
      rawSt === "SETTLEMENT" ||
      rawSt === "SUCCESS" ||
      rawCode === "00" ||
      rawCode === "2005300";

    if (isPaid) {
      await processPaidOrder(order.id);
      console.log(`[Webhook] Order ${order.invoiceNumber} (${order.gatewayRefId}) marked as PAID and processed.`);
    }

    return NextResponse.json({
      success: true,
      message: isPaid ? "Order successfully processed" : "Status noted",
      invoiceNumber: order.invoiceNumber,
    });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

