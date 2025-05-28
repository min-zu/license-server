import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/db/database";

export async function GET(request:NextRequest) {
  try {
    const rows = await query("SELECT * FROM license_log ORDER BY number DESC;");
    return NextResponse.json(rows)
  } catch (e) {
    console.log('error', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { state, searchField, searchText, log } = await request.json();
    const clientIp = request.headers.get('x-forwarded-for')?.split(':').pop() || null;

    if(state === 'addLog') {
      
      const sql = "INSERT INTO license_log (action_date, hardware_serial, user, ip, action, `desc`) VALUES (now(), ?, ?, ?, ?, ?)";
      
      if (log.length > 1) {
        const results = await Promise.all(log.map((item: any) => {
          const params = [item.hardware_serial, item.user, clientIp, item.action, item.desc];
          return query(sql, params);
        }));
        return NextResponse.json(results);
      } else {
        const params = [log[0].hardware_serial, log[0].user, clientIp, log[0].action, log[0].desc];
        console.log("params =", params)
        const result = await query(sql, params);
        return NextResponse.json(result);
      }
    } else if(state === 'searchLog')
      {
        let sql = "SELECT * FROM license_log WHERE ";
        const params = [];
    
        if (searchText && searchField) {
          if (searchField === 'date') {
            sql += ` DATE_FORMAT(date, '%Y-%m-%d') = ?`; 
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
      }

  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 