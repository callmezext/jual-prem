import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ampro } from "@/lib/ampro";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { targetEmail: { contains: search, mode: "insensitive" } },
        { targetNickname: { contains: search, mode: "insensitive" } },
        { amUid: { contains: search, mode: "insensitive" } },
      ];
    }

    const [activations, total] = await Promise.all([
      prisma.activation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              email: true,
              displayName: true,
            },
          },
          order: {
            select: {
              invoiceNumber: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.activation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      activations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    console.error("Admin Activations GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, magicLink, nickname, adminUserId } = body;

    if (!email) {
      return NextResponse.json({ error: "Email target wajib diisi" }, { status: 400 });
    }

    // Aksi 1: Kirim magic link login ke email Alight Motion
    if (action === "send_link") {
      const result = await ampro.sendLink(email.trim());
      return NextResponse.json({
        success: true,
        message: result.message || `Magic link berhasil dikirim ke ${email}`,
        data: result,
      });
    }

    // Aksi 2: Verifikasi magic link dan aktifkan lisensi
    if (action === "verify_link") {
      if (!magicLink) {
        return NextResponse.json({ error: "Magic link wajib diisi" }, { status: 400 });
      }

      const verifyRes = await ampro.verifyLink(email.trim(), magicLink.trim(), nickname?.trim());

      if (!verifyRes.success || !verifyRes.data) {
        return NextResponse.json(
          { error: verifyRes.message || "Gagal verifikasi lisensi Alight Motion" },
          { status: 400 }
        );
      }

      const d = verifyRes.data;

      // Cari atau fallback ke user admin
      let targetUserId = adminUserId;
      if (!targetUserId) {
        const firstAdmin = await prisma.user.findFirst({
          where: { role: "admin" },
        });
        targetUserId = firstAdmin?.id || (await prisma.user.findFirst())?.id;
      }

      if (!targetUserId) {
        return NextResponse.json({ error: "Akun admin tidak ditemukan di database" }, { status: 404 });
      }

      // Catat hasil aktivasi ke tabel Activation
      const activationRecord = await prisma.activation.create({
        data: {
          userId: targetUserId,
          source: "ADMIN_DIRECT",
          targetEmail: d.email || email.trim(),
          targetNickname: d.displayName || nickname || null,
          amUid: d.uid || null,
          amOrderId: d.orderId || null,
          membershipStatus: d.membershipStatus || "PREMIUM_ACTIVE",
          planName: d.planName || "Alight Motion Pro / Member",
          subscriptionType: d.subscriptionType || "Yearly VIP License",
          validUntil: d.validUntil || null,
          validUntilTimestamp: d.validUntilTimestamp ? String(d.validUntilTimestamp) : null,
          idToken: d.idToken || null,
          refreshToken: d.refreshToken || null,
          status: "SUCCESS",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Lisensi Alight Motion untuk ${email} BERHASIL DIAKTIFKAN!`,
        activation: activationRecord,
        data: d,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin Activations POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
