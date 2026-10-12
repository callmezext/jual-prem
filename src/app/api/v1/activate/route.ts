import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ampro } from "@/lib/ampro";

export async function POST(req: Request) {
  try {
    // 1. Ekstrak API Key dari Header
    const apiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API Key diperlukan pada header 'x-api-key'" },
        { status: 401 }
      );
    }

    // 2. Cari User pemilik API Key
    const user = await prisma.user.findUnique({
      where: { apiKey },
      include: {
        memberships: {
          where: {
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
          orderBy: { expiresAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "API Key tidak valid atau tidak terdaftar" },
        { status: 401 }
      );
    }

    // 3. Verifikasi Membership Aktif
    const membership = user.memberships[0];
    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "Anda belum memiliki paket membership aktif. Silakan berlangganan di website.",
        },
        { status: 403 }
      );
    }

    // Cek sisa kuota (jika bukan unlimited / -1)
    if (membership.remainingQuota !== -1 && membership.remainingQuota <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Kuota aktivasi membership Anda sudah habis. Silakan perpanjang paket Anda.",
        },
        { status: 403 }
      );
    }

    // 4. Validasi Body Request
    const { email, magicLink, nickname } = await req.json();

    if (!email || !magicLink) {
      return NextResponse.json(
        { success: false, error: "Field 'email' dan 'magicLink' wajib diisi" },
        { status: 400 }
      );
    }

    // 5. Panggil API Activator Ampro
    const amproResult = await ampro.verifyLink(email, magicLink, nickname);

    if (!amproResult.success || !amproResult.data) {
      return NextResponse.json(
        { success: false, error: amproResult.message || "Gagal aktivasi link" },
        { status: 400 }
      );
    }

    const d = amproResult.data;

    // 6. Potong Kuota Membership (jika bukan unlimited)
    let newRemaining = membership.remainingQuota;
    if (membership.remainingQuota !== -1) {
      newRemaining = membership.remainingQuota - 1;
      await prisma.userMembership.update({
        where: { id: membership.id },
        data: {
          remainingQuota: newRemaining,
          usedQuota: membership.usedQuota + 1,
        },
      });
    } else {
      await prisma.userMembership.update({
        where: { id: membership.id },
        data: {
          usedQuota: membership.usedQuota + 1,
        },
      });
    }

    // 7. Catat Aktivasi
    await prisma.activation.create({
      data: {
        userId: user.id,
        source: "API_KEY",
        targetEmail: d.email,
        targetNickname: d.displayName,
        amUid: d.uid,
        amOrderId: d.orderId,
        membershipStatus: d.membershipStatus,
        planName: d.planName,
        subscriptionType: d.subscriptionType,
        validUntil: d.validUntil,
        validUntilTimestamp: d.validUntilTimestamp ? String(d.validUntilTimestamp) : null,
        idToken: d.idToken,
        refreshToken: d.refreshToken,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Aktivasi via Developer API Berhasil!",
      quota: {
        isUnlimited: membership.remainingQuota === -1,
        remaining: newRemaining,
        expiresAt: membership.expiresAt,
      },
      data: {
        email: d.email,
        displayName: d.displayName,
        planName: d.planName,
        subscriptionType: d.subscriptionType,
        validUntil: d.validUntil,
        orderId: d.orderId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
