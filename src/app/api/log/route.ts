import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/db/database";

export async function GET(request:NextRequest) {
  try {
    const rows = await query("SELECT * FROM license_log ORDER BY number DESC;");
    return NextResponse.json(rows);
  } catch (e) {
    console.log('error', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { state, searchField, searchData, log, hardware_serial, action_date } = await request.json();
    const clientIp = request.headers.get('x-forwarded-for')?.split(':').pop() || null;

    if(state === 'addLog') {
      
      const sql = "INSERT INTO license_log (action_date, hardware_serial, user, ip, action, `desc`, customer, action_type) VALUES (now(), ?, ?, ?, ?, ?, ?, ?)";
      
      if (log.length > 1) {
        const results = await Promise.all(log.map(async (item: any) => {
          const params = [item.hardware_serial, item.user ? item.user : '', item.ip ? item.ip : clientIp, item.action, item.desc, item.customer ? item.customer : '', item.action_type];
          const result = await query(sql, params);
          if(result.affectedRows > 0 && item.hardware_serial) {
            await query(`INSERT INTO log_detail SELECT *, NOW() FROM license WHERE hardware_serial = ?;`, [item.hardware_serial]);
          }
          return NextResponse.json(result);
        }));
        return NextResponse.json(results);
      } else {
        const params = [log[0].hardware_serial, log[0].user ? log[0].user : '', log[0].ip ? log[0].ip : clientIp, log[0].action, log[0].desc, log[0].customer ? log[0].customer : '', log[0].action_type];
        const result = await query(sql, params);
        if(result.affectedRows > 0 && log[0].hardware_serial) {
          await query(`INSERT INTO log_detail SELECT *, NOW() FROM license WHERE hardware_serial = ?;`, [log[0].hardware_serial]);
        }
        return NextResponse.json(result);
      }
    }
    else if(state === 'searchLog') {
      let sql = "SELECT * FROM license_log WHERE ";
      const params = [];
  
      if (searchData && searchField) {
        if (searchField.includes('date')) {
          if (typeof searchData === 'object' && searchData.startDate && searchData.endDate) {
            sql += `${searchField} BETWEEN ? AND ?`;
            params.push(`${searchData.startDate} 00:00:00`, `${searchData.endDate} 23:59:59`);
          } else {
            const searchText = searchData as string;
            sql += ` DATE_FORMAT(date, '%Y-%m-%d') = ?`; 
            if(!searchText.includes('-')) {
              params.push(`${searchText.slice(0, 4)}-${searchText.slice(4, 6)}-${searchText.slice(6, 8)}`);
            } else {
              params.push(searchText);
            }
          }
        } else {
          // desc 필드는 백틱으로 감싸기
          const searchText = searchData as string;
          const fieldName = searchField === 'desc' ? '`desc`' : searchField;
          sql += ` ${fieldName} LIKE ? `;
          params.push(`%${searchText}%`);
        }
      }
      const rows = await query(sql, params);
      return NextResponse.json(rows);
    }
    else if(state === 'logDetail') {
      // action_date를 분까지만 비교 (초 제외)
      if(clientIp === "1") {
        const rows = await query(
          "SELECT * FROM log_detail WHERE hardware_serial = ? AND DATE_FORMAT(action_date, '%Y-%m-%d %H:%i') = DATE_FORMAT(?, '%Y-%m-%d %H:%i');", 
          [hardware_serial, action_date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })]
        );
        return NextResponse.json(rows);
      }
      const rows = await query(
        "SELECT * FROM log_detail WHERE hardware_serial = ? AND DATE_FORMAT(action_date, '%Y-%m-%d %H:%i') = DATE_FORMAT(?, '%Y-%m-%d %H:%i');", 
        [hardware_serial, action_date]
      );
      return NextResponse.json(rows);
    }

  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 