const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Checking Supabase connection...");
  
  // 1. Seed or update SystemSetting single_verify_price
  const priceSetting = await prisma.systemSetting.upsert({
    where: { key: "single_verify_price" },
    update: { value: "1000" },
    create: {
      key: "single_verify_price",
      value: "1000",
      description: "Harga aktivasi single instan (Rupiah)",
    },
  });
  console.log("SystemSetting single_verify_price:", priceSetting);

  // 2. Seed MembershipPlans
  const defaultPlans = [
    {
      slug: "starter_20",
      name: "Bronze Activator (20x)",
      quota: 20,
      durationMonths: 1,
      price: 15000,
      badgeText: "HEMAT",
      description: "Cocok untuk reseller pemula atau pemakaian pribadi intensif. 20x aktivasi instan.",
      isActive: true,
    },
    {
      slug: "pro_50",
      name: "Silver Pro (50x)",
      quota: 50,
      durationMonths: 1,
      price: 30000,
      badgeText: "POPULER",
      description: "Pilihan terbaik untuk toko digital aktif. 50x kuota verifikasi bebas klaim.",
      isActive: true,
    },
    {
      slug: "business_100",
      name: "Gold Business (100x)",
      quota: 100,
      durationMonths: 1,
      price: 55000,
      badgeText: "TERBAIK",
      description: "Untuk juragan dan toko besar. 100x aktivasi instan dengan prioritas tertinggi.",
      isActive: true,
    },
    {
      slug: "unlimited_vip",
      name: "Platinum VIP (Unlimited)",
      quota: -1,
      durationMonths: 1,
      price: 99000,
      badgeText: "UNLIMITED",
      description: "Aktivasi sepuasnya tanpa batasan kuota selama 30 hari penuh.",
      isActive: true,
    },
  ];

  for (const plan of defaultPlans) {
    const upserted = await prisma.membershipPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`Plan ready: ${upserted.name} (${upserted.slug})`);
  }

  // 3. Ensure gunturafandy5@gmail.com is set to admin if exists
  const adminEmail = "gunturafandy5@gmail.com";
  const existingUser = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: "admin" },
    });
    console.log(`Updated user ${adminEmail} to admin`);
  } else {
    console.log(`User ${adminEmail} will be granted admin upon first Google login.`);
  }

  console.log("Supabase seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
