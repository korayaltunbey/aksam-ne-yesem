import { NextResponse } from "next/server";

import { getFilterAvailability } from "@/lib/filter-availability";
import { parseSuggestionRequest } from "@/lib/requests";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const { req, error } = parseSuggestionRequest(body);
  if (error || !req) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ availability: getFilterAvailability(req) });
}
