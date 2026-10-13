import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role") || "ALL";

    const where: any = {};

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { apiKey: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          where: {
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
            activations: true,
          },
        },
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (err: any) {
    console.error("Admin Users GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Parameter userId dan action diperlukan" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (action === "update_role") {
      const { role } = body;
      if (role !== "customer" && role !== "admin") {
        return NextResponse.json({ error: "Role harus 'customer' atau 'admin'" }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      return NextResponse.json({
        success: true,
        message: `Role ${user.email} diubah menjadi ${role}`,
        user: updated,
      });
    }

    if (action === "adjust_balance") {
      const { amount, mode = "add" } = body;
      const numAmount = parseInt(amount, 10);
      if (isNaN(numAmount)) {
        return NextResponse.json({ error: "Nominal saldo tidak valid" }, { status: 400 });
      }

      const newBalance = mode === "set" ? Math.max(0, numAmount) : Math.max(0, user.balance + numAmount);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });

      return NextResponse.json({
        success: true,
        message: `Saldo ${user.email} berhasil diperbarui menjadi Rp ${newBalance.toLocaleString("id-ID")}`,
        user: updated,
      });
    }

    if (action === "reset_api_key") {
      const newApiKey = generateApiKey();

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { apiKey: newApiKey },
      });

      return NextResponse.json({
        success: true,
        message: `API Key untuk ${user.email} berhasil diperbarui`,
        user: updated,
      });
    }

    if (action === "grant_membership") {
      const { planId, quota, durationMonths = 1 } = body;

      const plan = await prisma.membershipPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return NextResponse.json({ error: "Paket membership tidak ditemukan" }, { status: 404 });
      }

      const customQuota = quota !== undefined ? parseInt(quota, 10) : plan.quota;
      const customDuration = durationMonths ? parseInt(durationMonths, 10) : plan.durationMonths;

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + customDuration);

      const newMembership = await prisma.userMembership.create({
        data: {
          userId: user.id,
          planId: plan.id,
          planName: plan.name,
          totalQuota: customQuota,
          remainingQuota: customQuota,
          usedQuota: 0,
          durationMonths: customDuration,
          expiresAt,
          status: "ACTIVE",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan paket ${plan.name} ke ${user.email}`,
        membership: newMembership,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin Users PATCH Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
