import { NextResponse } from "next/server";
import { query } from "@/app/db/database";

export async function GET(params:Request) {
  try {
    const rows = await query("SELECT * FROM license;");
    return NextResponse.json(rows)
  } catch (e) {
    console.log('error', e);
  }
}