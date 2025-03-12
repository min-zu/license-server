import { NextResponse } from "next/server";
import database from "@/app/db/database";

export async function GET(params:Request) {
  try {
    const db = await database.getConnection()
    const query = 'SELECT * FROM license;';
    const rows = await db.execute(query);
    db.release()

    console.log('rows' , rows)
    return NextResponse.json(rows)
  } catch (e) {
    console.log('error', e)
  }
}