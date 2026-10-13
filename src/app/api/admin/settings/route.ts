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
    console.error("Admin Settings GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { singlePrice, plans, settings: generalSettings } = body;

    // 1. Simpan harga satuan jika dikirim
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

    // 2. Simpan pengaturan umum sistem (key-value)
    if (generalSettings && typeof generalSettings === "object") {
      for (const [key, val] of Object.entries(generalSettings)) {
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          await prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(val) },
            create: {
              key,
              value: String(val),
              description: `Pengaturan ${key}`,
            },
          });
        }
      }
    }

    // 3. Update plans jika dikirim sebagai array
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
      message: "Pengaturan sistem berhasil disimpan!",
    });
  } catch (err: any) {
    console.error("Admin Settings POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
