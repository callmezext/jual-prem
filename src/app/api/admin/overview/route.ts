import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalUsers,
      totalActivations,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: { in: ["PENDING", "WAITING_LINK", "ACTIVATING"] },
        },
      }),
      prisma.order.count({
        where: { status: "COMPLETED" },
      }),
      prisma.user.count(),
      prisma.activation.count({
        where: { status: "SUCCESS" },
      }),
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true, displayName: true },
          },
        },
      }),
    ]);

    const totalRevenue = revenueResult._sum.amount || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalUsers,
        totalActivations,
      },
      recentOrders,
    });
  } catch (err: any) {
    console.error("Admin Overview API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
