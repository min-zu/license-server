import { NextResponse } from "next/server";
import { query } from "@/app/db/database";

export async function GET(params:Request) {
  try {
    const rows = await query("SELECT * FROM license ORDER BY number DESC;");
    return NextResponse.json(rows)
  } catch (e) {
    console.log('error', e);
  }
}

export async function POST(request: Request) {
  try {
    const { searchField, searchText } = await request.json();
    
    let sql = "SELECT * FROM license WHERE ";
    const params = [];

    if (searchText && searchField) {
      if (searchField.includes('date') || searchField.includes('_st') || searchField.includes('_end')) {
        sql += ` DATE_FORMAT(${searchField}, '%Y-%m-%d') = ?`; 
        if(!searchText.includes('-')) {
          params.push(`${searchText.slice(0, 4)}-${searchText.slice(4, 6)}-${searchText.slice(6, 8)}`);
        } else {
          params.push(searchText);
        }
      } else {
        sql += ` ${searchField} LIKE ? `;
        params.push(`%${searchText}%`);
      }
    }
    const rows = await query(sql, params);
    return NextResponse.json(rows);

  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { codes } = await request.json(); // codes로 변경

    const placeholders = codes.map(() => '?').join(',');
    const sql = `DELETE FROM license WHERE hardware_code IN (${placeholders})`;
    
    const result = await query(sql, codes);
    console.log('result', result);
    return NextResponse.json({ success: true, result: result });
    
  } catch (e) {
    console.error('삭제 중 오류 발생:', e); // 오류 메시지 수정
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}



