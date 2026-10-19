import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mustikapay } from "@/lib/mustikapay";
import { processPaidOrder } from "@/lib/order-processor";

export async function GET(req: Request, { params }: { params: { invoice: string } }) {
  try {
    const { invoice } = params;

    let order = await prisma.order.findUnique({
      where: { invoiceNumber: invoice },
      include: {
        activations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // 1. Jika masih PENDING atau EXPIRED tapi punya gatewayRefId, prioritaskan cek apakah sudah lunas di gateway!
    if ((order.status === "PENDING" || order.status === "EXPIRED") && order.gatewayRefId) {
      try {
        const check = await mustikapay.checkQrisStatus(order.gatewayRefId);
        if (check.isPaid) {
          order = (await processPaidOrder(order.id)) as any;
          if (order) {
            order = await prisma.order.findUnique({
              where: { id: order.id },
              include: {
                activations: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            });
          }
        }
      } catch (checkErr) {
        console.warn("Auto-check QRIS status failed:", checkErr);
      }
    }

    // 2. Hanya tandai EXPIRED jika statusnya masih PENDING dan belum dibayar setelah batas 10 menit
    if (order && order.status === "PENDING") {
      const TEN_MINUTES_MS = 10 * 60 * 1000;
      const isPast10Mins = Date.now() - new Date(order.createdAt).getTime() >= TEN_MINUTES_MS;
      if (isPast10Mins) {
        order = await prisma.order.update({
          where: { id: order.id },
          data: { status: "EXPIRED" },
          include: {
            activations: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { invoice: string } }) {
  try {
    const { invoice } = params;
    const body = await req.json().catch(() => ({}));
    const { gatewayRefId, gatewayData } = body;

    let order = await prisma.order.findUnique({
      where: { invoiceNumber: invoice },
      include: {
        activations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (order.status !== "PENDING" && order.status !== "EXPIRED") {
      return NextResponse.json({
        success: true,
        order,
        message: "Pesanan sudah diproses sebelumnya",
      });
    }

    const refToUse = order.gatewayRefId || gatewayRefId || gatewayData?.ref_no;
    let isVerified = false;

    // 1. Cek langsung via server
    if (refToUse) {
      try {
        const check = await mustikapay.checkQrisStatus(refToUse);
        if (check.isPaid) {
          isVerified = true;
        }
      } catch (err) {
        console.warn("Server-side check failed:", err);
      }
    }

    // 2. Jika server-side terhalang WAF Cloudflare Vercel, validasi data verifikasi browser client
    if (!isVerified && gatewayData && refToUse) {
      const isRefMatch = gatewayData.ref_no === refToUse;
      const isStatusSuccess =
        gatewayData.isPaid === true ||
        gatewayData.status === "success" ||
        gatewayData.raw?.latestTransactionStatus === "00" ||
        String(gatewayData.raw?.transactionStatusDesc || "").toLowerCase() === "success";

      if (isRefMatch && isStatusSuccess) {
        isVerified = true;
      }
    }

    if (isVerified) {
      order = (await processPaidOrder(order.id)) as any;
      if (order) {
        order = await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            activations: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });
      }
      return NextResponse.json({
        success: true,
        order,
        message: "Pembayaran berhasil diverifikasi!",
      });
    }

    return NextResponse.json({
      success: false,
      order,
      message: "Pembayaran belum terdeteksi di server gateway.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { invoice: string } }) {
  try {
    const { invoice } = params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "CANCEL"; // "CANCEL" | "EXPIRE"

    const order = await prisma.order.findUnique({
      where: { invoiceNumber: invoice },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Hanya pesanan PENDING yang dapat diubah statusnya" }, { status: 400 });
    }

    const newStatus = action === "EXPIRE" ? "EXPIRED" : "CANCELLED";
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: action === "EXPIRE" ? "Pesanan telah kadaluarsa" : "Pesanan berhasil dibatalkan",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
