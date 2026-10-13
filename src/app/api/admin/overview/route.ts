import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Kriteria pesanan yang sudah dibayar pelanggan (omset uang masuk)
    const paidCondition: any = {
      OR: [
        { paidAt: { not: null } },
        { status: { in: ["PAID", "WAITING_LINK", "ACTIVATING", "COMPLETED"] } },
      ],
    };

    const [
      totalOrders,
      pendingOrders,
      paidOrdersCount,
      totalUsers,
      totalActivations,
      allTimeRevenueResult,
      todayRevenueResult,
      monthRevenueResult,
      pendingRevenueResult,
      singleRevenueResult,
      membershipRevenueResult,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.order.count({
        where: paidCondition,
      }),
      prisma.user.count(),
      prisma.activation.count({
        where: { status: "SUCCESS" },
      }),
      // Total omset semua waktu
      prisma.order.aggregate({
        where: paidCondition,
        _sum: { amount: true },
      }),
      // Omset hari ini
      prisma.order.aggregate({
        where: {
          AND: [
            paidCondition,
            {
              OR: [
                { paidAt: { gte: startOfToday } },
                { createdAt: { gte: startOfToday } },
              ],
            },
          ],
        },
        _sum: { amount: true },
      }),
      // Omset bulan ini
      prisma.order.aggregate({
        where: {
          AND: [
            paidCondition,
            {
              OR: [
                { paidAt: { gte: startOfMonth } },
                { createdAt: { gte: startOfMonth } },
              ],
            },
          ],
        },
        _sum: { amount: true },
      }),
      // Potensi dana pesanan pending
      prisma.order.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
      // Omset penjualan eceran (Single Verify)
      prisma.order.aggregate({
        where: {
          AND: [paidCondition, { orderType: "SINGLE_VERIFY" }],
        },
        _sum: { amount: true },
      }),
      // Omset penjualan paket membership reseller
      prisma.order.aggregate({
        where: {
          AND: [paidCondition, { orderType: "MEMBERSHIP" }],
        },
        _sum: { amount: true },
      }),
      // 5 pesanan terkini
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

    const totalRevenue = allTimeRevenueResult._sum.amount || 0;
    const todayRevenue = todayRevenueResult._sum.amount || 0;
    const monthRevenue = monthRevenueResult._sum.amount || 0;
    const pendingRevenue = pendingRevenueResult._sum.amount || 0;
    const singleRevenue = singleRevenueResult._sum.amount || 0;
    const membershipRevenue = membershipRevenueResult._sum.amount || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        todayRevenue,
        monthRevenue,
        pendingRevenue,
        singleRevenue,
        membershipRevenue,
        paidOrdersCount,
        totalOrders,
        pendingOrders,
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
