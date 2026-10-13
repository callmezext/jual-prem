import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : plan.name,
        price: body.price !== undefined ? parseInt(body.price, 10) : plan.price,
        quota: body.quota !== undefined ? parseInt(body.quota, 10) : plan.quota,
        durationMonths:
          body.durationMonths !== undefined
            ? Math.max(1, parseInt(body.durationMonths, 10))
            : plan.durationMonths,
        description: body.description !== undefined ? body.description?.trim() || null : plan.description,
        badgeText: body.badgeText !== undefined ? body.badgeText?.trim() || null : plan.badgeText,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : plan.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Paket ${updated.name} berhasil diperbarui!`,
      plan: updated,
    });
  } catch (err: any) {
    console.error("Admin Plan PUT Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userMemberships: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    // Jika sudah ada pengguna yang berlangganan paket ini, ubah isActive jadi false (Soft Deactivate)
    if (plan._count.userMemberships > 0) {
      await prisma.membershipPlan.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: `Paket dinonaktifkan (karena sudah memiliki ${plan._count.userMemberships} riwayat langganan pengguna)`,
        softDeleted: true,
      });
    }

    // Jika belum pernah digunakan, hapus permanen
    await prisma.membershipPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Paket ${plan.name} berhasil dihapus permanen`,
      softDeleted: false,
    });
  } catch (err: any) {
    console.error("Admin Plan DELETE Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
