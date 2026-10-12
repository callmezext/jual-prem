import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ampro } from "@/lib/ampro";

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

    if (order.orderType === "SINGLE_VERIFY") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "WAITING_LINK",
          paidAt: new Date(),
        },
      });

      if (order.targetEmail) {
        try {
          await ampro.sendLink(order.targetEmail);
        } catch (e) {
          console.warn("Simulate pay send link error:", e);
        }
      }
    } else if (order.orderType === "MEMBERSHIP") {
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: order.planId! },
      });

      if (plan) {
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(now.getMonth() + plan.durationMonths);

        const existingMembership = await prisma.userMembership.findFirst({
          where: {
            userId: order.userId,
            status: "ACTIVE",
            expiresAt: { gt: now },
          },
          orderBy: { expiresAt: "desc" },
        });

        if (existingMembership) {
          const extendedExpiry = new Date(existingMembership.expiresAt);
          extendedExpiry.setMonth(extendedExpiry.getMonth() + plan.durationMonths);

          const newTotal =
            plan.quota === -1 || existingMembership.totalQuota === -1
              ? -1
              : existingMembership.totalQuota + plan.quota;
          const newRemaining =
            plan.quota === -1 || existingMembership.remainingQuota === -1
              ? -1
              : existingMembership.remainingQuota + plan.quota;

          await prisma.userMembership.update({
            where: { id: existingMembership.id },
            data: {
              expiresAt: extendedExpiry,
              totalQuota: newTotal,
              remainingQuota: newRemaining,
              planName: `${existingMembership.planName} (Extended)`,
            },
          });
        } else {
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
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Simulasi pembayaran berhasil lunas!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
