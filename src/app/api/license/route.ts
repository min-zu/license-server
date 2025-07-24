import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/db/database";
import fs from "fs/promises"

export async function GET(request:NextRequest) {
  try {
    const rows = await query("SELECT * FROM license ORDER BY number DESC;");
    return NextResponse.json(rows)
  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: '라이센스 데이터를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hardwareStatus, searchField, searchData } = await request.json();
    
    let sql = "SELECT * FROM license WHERE ";
    const params = [];

    if(hardwareStatus === "ITU" || hardwareStatus === "ITM") {
      sql += `hardware_status = '${hardwareStatus}' AND`;
    }

    if (searchData && searchField) {
      if (searchField.includes('date') || searchField.includes('_start') || searchField.includes('_end')) {
        // 날짜 범위 검색
        if (typeof searchData === 'object' && searchData.startDate && searchData.endDate) {
          sql += ` ${searchField} BETWEEN ? AND ?`;
          params.push(searchData.startDate, searchData.endDate);
        } else {
          // 단일 날짜 검색 (기존 로직)
          const searchText = searchData as string;
          sql += ` DATE_FORMAT(${searchField}, '%Y-%m-%d') = ?`; 
          if(!searchText.includes('-')) {
            params.push(`${searchText.slice(0, 4)}-${searchText.slice(4, 6)}-${searchText.slice(6, 8)}`);
          } else {
            params.push(searchText);
          }
        }
      } else {
        // 일반 텍스트 검색
        const searchText = searchData as string;
        sql += ` ${searchField} LIKE ? `;
        params.push(`%${searchText}%`);
      }
    }

    sql += " ORDER BY number DESC;";
    const rows = await query(sql, params);
    return NextResponse.json(rows);

  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { codes } = await request.json(); // codes로 변경

    const placeholders = codes.map(() => '?').join(',');
    const sql = `DELETE FROM license WHERE hardware_serial IN (${placeholders})`;
    
    const result = await query(sql, codes);

    // Log
    const logPath = "/home/future/license/log/delete_license.log"
    const logContent =
`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}]
Deleted serials: ${JSON.stringify(codes)} 

`;
    try {
      await fs.appendFile(logPath, logContent)
    } catch (error) {
      console.error("log 파일 생성 실패: ", error);
    }

    return NextResponse.json({ success: true, result: result });
    
  } catch (e) {
    console.error('삭제 중 오류 발생:', e); // 오류 메시지 수정
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data } = await request.json();
    let total = 0;
    for (const item of data) {
      const { hardware_serial, license_key } = item;
      const getSql = `SELECT * FROM license WHERE hardware_serial = ? AND license_key = ?`;
      const result = await query(getSql, [hardware_serial, license_key]);
      if(result.length > 0) {
        const putSql = `UPDATE license SET reg_auto = 4, license_key = NULL WHERE hardware_serial = ?`;
        const putResult = await query(putSql, [hardware_serial]);
        total++;
      }
    }
    console.log('total ::: ', total);
    return NextResponse.json({ success: true, result: total });
  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: '만료 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}


