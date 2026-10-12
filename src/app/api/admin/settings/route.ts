import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { price: "asc" },
    });

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return NextResponse.json({
      success: true,
      singlePrice: settingsMap.single_verify_price !== undefined ? parseInt(settingsMap.single_verify_price, 10) : 1000,
      settings: settingsMap,
      plans,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { singlePrice, plans } = await req.json();

    // Update single verify price jika diberikan
    if (singlePrice !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "single_verify_price" },
        update: { value: String(singlePrice) },
        create: {
          key: "single_verify_price",
          value: String(singlePrice),
          description: "Harga 1x aktivasi satuan (per-pcs)",
        },
      });
    }

    // Update harga & kuota membership plans jika diberikan
    if (Array.isArray(plans)) {
      for (const p of plans) {
        if (p.id) {
          await prisma.membershipPlan.update({
            where: { id: p.id },
            data: {
              name: p.name,
              price: Number(p.price),
              quota: Number(p.quota),
              durationMonths: Number(p.durationMonths),
              badgeText: p.badgeText || null,
              isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan berhasil diperbarui!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
