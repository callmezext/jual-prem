import { NextResponse } from "next/server";
import { ampro } from "@/lib/ampro";

export async function GET() {
  const status = await ampro.getStatus();
  return NextResponse.json(status);
}
