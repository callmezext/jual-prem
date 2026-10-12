import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ampro } from "@/lib/ampro";

export async function POST(req: Request) {
  try {
    const apiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { apiKey },
      include: {
        memberships: {
          where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
          take: 1,
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { success: false, error: "Membership tidak aktif" },
        { status: 403 }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email target diperlukan" }, { status: 400 });
    }

    const res = await ampro.sendLink(email);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
