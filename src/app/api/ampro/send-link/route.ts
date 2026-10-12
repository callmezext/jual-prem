import { NextResponse } from "next/server";
import { ampro } from "@/lib/ampro";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email target tidak valid" }, { status: 400 });
    }

    const result = await ampro.sendLink(email);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
