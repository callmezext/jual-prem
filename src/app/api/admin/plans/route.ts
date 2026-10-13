import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { price: "asc" },
      include: {
        _count: {
          select: { userMemberships: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (err: any) {
    console.error("Admin Plans GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      quota,
      durationMonths = 1,
      price,
      description,
      badgeText,
      isActive = true,
    } = body;

    if (!name || !slug || price === undefined || quota === undefined) {
      return NextResponse.json(
        { error: "Nama, slug, harga, dan kuota wajib diisi" },
        { status: 400 }
      );
    }

    // Periksa apakah slug sudah ada
    const existing = await prisma.membershipPlan.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${slug}" sudah digunakan oleh paket lain` },
        { status: 400 }
      );
    }

    const newPlan = await prisma.membershipPlan.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        quota: parseInt(quota, 10),
        durationMonths: Math.max(1, parseInt(durationMonths, 10) || 1),
        price: parseInt(price, 10),
        description: description?.trim() || null,
        badgeText: badgeText?.trim() || null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Paket ${newPlan.name} berhasil ditambahkan!`,
      plan: newPlan,
    });
  } catch (err: any) {
    console.error("Admin Plans POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
