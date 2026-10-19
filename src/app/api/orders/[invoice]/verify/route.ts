import { NextResponse } from "next/server";
import { POST as verifyPost } from "../route";

export async function POST(req: Request, context: { params: { invoice: string } }) {
  return verifyPost(req, context);
}
