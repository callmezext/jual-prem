import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ampro } from "@/lib/ampro";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { targetEmail: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total, totalAmountResult] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          activations: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const totalAmount = totalAmountResult._sum.amount || 0;

    return NextResponse.json({
      success: true,
      orders,
      total,
      totalAmount,
      page,
      limit,
      totalPages,
    });
  } catch (err: any) {
    console.error("Admin Orders GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, action, notes } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { error: "Parameter orderId dan action diperlukan" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (action === "mark_paid") {
      // Tandai pesanan sebagai lunas
      let nextStatus = "PAID";

      if (order.orderType === "SINGLE_VERIFY" && order.targetEmail) {
        // Coba kirim link aktivasi Ampro
        try {
          await ampro.sendLink(order.targetEmail);
          nextStatus = "WAITING_LINK";
        } catch (linkErr) {
          console.warn("Gagal kirim link otomatis saat mark_paid:", linkErr);
          nextStatus = "PAID";
        }
      } else if (order.orderType === "MEMBERSHIP" && order.planId) {
        // Aktifkan paket membership ke user
        const plan = await prisma.membershipPlan.findUnique({
          where: { id: order.planId },
        });

        if (plan) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);

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
        nextStatus = "COMPLETED";
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          paidAt: order.paidAt || new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Pesanan ${order.invoiceNumber} berhasil ditandai LUNAS (${nextStatus})`,
        order: updated,
      });
    }

    if (action === "cancel") {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Pesanan ${order.invoiceNumber} berhasil dibatalkan`,
        order: updated,
      });
    }

    if (action === "mark_completed") {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          paidAt: order.paidAt || new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Status pesanan ${order.invoiceNumber} diubah ke COMPLETED`,
        order: updated,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin Orders PATCH Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
