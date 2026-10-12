import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mustikapay } from "@/lib/mustikapay";
import { ampro } from "@/lib/ampro";

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

    // Cek batas waktu kadaluarsa pembayaran (10 Menit)
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const isPast10Mins = Date.now() - new Date(order.createdAt).getTime() >= TEN_MINUTES_MS;
    if (order.status === "PENDING" && isPast10Mins) {
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

    // Jika masih PENDING dan memiliki gatewayRefId (ref_no MustikaPay), auto check status langsung ke gateway
    if (order.status === "PENDING" && order.gatewayRefId) {
      try {
        const check = await mustikapay.checkQrisStatus(order.gatewayRefId);
        if (check.isPaid) {
          if (order.orderType === "SINGLE_VERIFY") {
            order = await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "WAITING_LINK",
                paidAt: new Date(),
              },
              include: {
                activations: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            });

            // Otomatis kirim magic link Alight Motion
            if (order.targetEmail) {
              try {
                await ampro.sendLink(order.targetEmail);
              } catch (err) {
                console.error("Gagal auto send link Ampro:", err);
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

            order = await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "COMPLETED",
                paidAt: new Date(),
              },
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

    return NextResponse.json({
      success: true,
      order,
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
