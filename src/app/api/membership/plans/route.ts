import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Cek apakah membership plans sudah ada
    let plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    if (plans.length === 0) {
      // Seed default membership plans sesuai permintaan spesifik user:
      // 20x verify: 10rb (1 Bulan)
      // 50x verify: 20rb (1 Bulan)
      // 100x verify: 40rb (1 Bulan)
      // Unlimited verify: 75rb (3 Bulan)
      await prisma.membershipPlan.createMany({
        data: [
          {
            slug: "starter_20",
            name: "Bronze Creator",
            quota: 20,
            durationMonths: 1,
            price: 10000,
            description: "20x Aktivasi Alight Motion Pro 1 Tahun. Masa aktif kuota 1 Bulan.",
            badgeText: "HEMAT 50%",
          },
          {
            slug: "pro_50",
            name: "Silver Studio",
            quota: 50,
            durationMonths: 1,
            price: 20000,
            description: "50x Aktivasi Alight Motion Pro 1 Tahun. Masa aktif kuota 1 Bulan.",
            badgeText: "POPULER",
          },
          {
            slug: "business_100",
            name: "Gold Reseller",
            quota: 100,
            durationMonths: 1,
            price: 40000,
            description: "100x Aktivasi Alight Motion Pro 1 Tahun. Akses API Developer & Bot.",
            badgeText: "RESELLER",
          },
          {
            slug: "unlimited_vip",
            name: "Diamond Unlimited VIP",
            quota: -1, // Unlimited
            durationMonths: 3, // 3 Bulan!
            price: 75000,
            description: "UNLIMITED Aktivasi Alight Motion Pro. Masa aktif 3 BULAN + Full Akses API!",
            badgeText: "SULTAN 3 BULAN",
          },
        ],
      });

      plans = await prisma.membershipPlan.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" },
      });
    }

    // Ambil harga satuan per-pcs dari SystemSetting (default 1000)
    let singlePriceSetting = await prisma.systemSetting.findUnique({
      where: { key: "single_verify_price" },
    });

    if (!singlePriceSetting) {
      singlePriceSetting = await prisma.systemSetting.create({
        data: {
          key: "single_verify_price",
          value: "1000",
          description: "Harga 1x aktivasi satuan (per-pcs)",
        },
      });
    }

    return NextResponse.json({
      success: true,
      singlePrice: isNaN(parseInt(singlePriceSetting.value, 10)) ? 1000 : parseInt(singlePriceSetting.value, 10),
      plans,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
