import { NextResponse } from "next/server";
import { query } from "@/app/db/database";

export async function GET(params:Request) {
  try {
    const rows = await query("SELECT * FROM license_log;");
    return NextResponse.json(rows)
  } catch (e) {
    console.log('error', e);
  }
}

export async function POST(request: Request) {
  // console.log('POST 요청이 수신되었습니다.');
  // console.log('request', request);
  try {
    const { searchField, searchText } = await request.json();
    
    let sql = "SELECT * FROM license_log WHERE 1=1";
    const params = [];

    if (searchText && searchField) {
      if (searchField === 'date') {
        sql += ` AND ${searchField} = `; 
      } else {
        sql += ` AND ${searchField} LIKE ? `;
      }
      params.push(`%${searchText}%`);
    }
    console.log('sql', sql);

    const rows = await query(sql, params);
    return NextResponse.json(rows);

  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}