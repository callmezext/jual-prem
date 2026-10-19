import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/firebase-admin";
import { generateApiKey } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { idToken, email, displayName, photoUrl } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    const decoded = await verifyUserToken(idToken);
    const userEmail = decoded.email || email;
    const uid = decoded.uid;

    if (!userEmail || !uid) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // Cari user di database
    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      include: {
        memberships: {
          where: {
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      // Cek apakah user adalah admin atau user pertama
      const userCount = await prisma.user.count();
      const isAdminEmail = userEmail.toLowerCase() === "gunturafandy5@gmail.com";
      const role = (userCount === 0 || isAdminEmail) ? "admin" : "customer";

      try {
        user = await prisma.user.create({
          data: {
            firebaseUid: uid,
            email: userEmail,
            displayName: displayName || decoded.name || userEmail.split("@")[0],
            photoUrl: photoUrl || decoded.picture || null,
            role,
            apiKey: generateApiKey(),
          },
          include: {
            memberships: true,
          },
        });
      } catch (createErr: any) {
        // Fallback jika terjadi race condition pembuatan user bersamaan
        user = await prisma.user.findUnique({
          where: { firebaseUid: uid },
          include: {
            memberships: {
              where: {
                status: "ACTIVE",
                expiresAt: { gt: new Date() },
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });
      }
    } else {
      const isAdminEmail = user.email.toLowerCase() === "gunturafandy5@gmail.com";
      const shouldUpdateRole = isAdminEmail && user.role !== "admin";
      const shouldUpdateApiKey = !user.apiKey;

      if (shouldUpdateRole || shouldUpdateApiKey) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(shouldUpdateApiKey ? { apiKey: generateApiKey() } : {}),
            ...(shouldUpdateRole ? { role: "admin" } : {}),
          },
          include: {
            memberships: {
              where: {
                status: "ACTIVE",
                expiresAt: { gt: new Date() },
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Gagal memproses data pengguna" }, { status: 500 });
    }

    const activeMembership = user.memberships?.[0] || null;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        role: user.role,
        apiKey: user.apiKey,
        balance: user.balance,
        activeMembership,
      },
    });
  } catch (error: any) {
    console.error("API Auth Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
