import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/db/database";
import fs from "fs/promises"
import { auth } from "@/auth";

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
      sql += `hardware_status = '${hardwareStatus}' AND `;
    }

    if (searchField === 'software_opt') {
      // 소프트웨어 검색 
      if(searchData.length === 0) {
        sql += ` (license_fw IS NULL OR license_fw = 0) AND (license_vpn IS NULL OR license_vpn = 0) AND (license_s2 IS NULL OR license_s2 = 0) AND (license_dpi IS NULL OR license_dpi = 0) AND (license_av IS NULL OR license_av = 0) AND (license_as IS NULL OR license_as = 0) AND (license_ot IS NULL OR license_ot = 0) AND (license_zt IS NULL OR license_zt = 0)`;
      } else {
        if(searchData.includes(',')) {
          const searchTexts = searchData.split(',');
          for(let i = 0; i < searchTexts.length; i++) {
            if(i > 0) sql += ' AND';
            sql += ` ${searchTexts[i]} = 1`;
          }
        } else {
          sql += `${searchData} = 1`;
        }
      }
    } else if (searchField.includes('date') || searchField.includes('_start') || searchField.includes('_end')) {
      // 날짜 범위 검색
      if (typeof searchData === 'object' && searchData.startDate && searchData.endDate) {
        sql += ` ${searchField} BETWEEN ? AND ?`;
        params.push(`${searchData.startDate} 00:00:00`, `${searchData.endDate} 23:59:59`);
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
      if(searchText.includes(',')) {
        const searchTexts = searchText.split(',');
        for(let i = 0; i < searchTexts.length; i++) {
          if(searchTexts[i].trim() === '') continue;
          if(i > 0) sql += ' OR';
          sql += ` ${searchField} LIKE ?`;
          params.push(`%${searchTexts[i].trim()}%`);
        }
      } else {
        sql += ` ${searchField} LIKE ? `;
        params.push(`%${searchText.trim()}%`);
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
    const session = await auth();
    const ip = request.headers.get('x-forwarded-for')?.split(':').pop() || null;
    const { codes } = await request.json(); // codes로 변경

    const placeholders = codes.map(() => '?').join(',');
    const selectSql = `SELECT * FROM license WHERE hardware_serial IN (${placeholders})`;
    const selectResult = await query(selectSql, codes);

    const sql = `DELETE FROM license WHERE hardware_serial IN (${placeholders})`;    
    const result = await query(sql, codes);

    if(result.affectedRows > 0) {
      const columns = Object.keys(selectResult[0]);
      for(const row of selectResult) {
        const logSql = "INSERT INTO license_log (action_date, hardware_serial, user, ip, action, `desc`, customer, action_type) VALUES (now(), ?, ?, ?, ?, ?, ?, ?)";
        await query(logSql, [row.hardware_serial, session?.user?.name + '(' + session?.user?.id + ')', ip, 'success', '라이센스 정보 및 라이센스 키 삭제', row.customer, 'license']);
        const values = columns.map(col => row[col]);
        await query(`INSERT INTO log_detail (${columns.join(',')}, action_date) VALUES (${columns.map(() => '?').join(',')}, NOW())`, values);
      }
    }

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
    return NextResponse.json({ success: true, result: total });
  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: '만료 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}


