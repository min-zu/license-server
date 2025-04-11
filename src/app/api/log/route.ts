import { NextResponse } from "next/server";
import { query } from "@/app/db/database";

export async function GET(params:Request) {
  try {
    const rows = await query("SELECT * FROM license_log ORDER BY number DESC;");
    return NextResponse.json(rows)
  } catch (e) {
    console.log('error', e);
  }
}

export async function POST(request: Request) {
  try {
    const { state, searchField, searchText, log } = await request.json();
    if(state === 'addLog') {
      
      const sql = "INSERT INTO license_log (number, hardware_code, date, manager, site_nm) VALUES (?, ?, ?, ?, ?)";
      
      if (log.length > 1) {
        const results = await Promise.all(log.map((item: any) => {
          const params = [item.number, item.hardware_code, item.license_date === null ? '0000-00-00' : item.license_date, item.manager, item.site_nm];
          return query(sql, params);
        }));
        return NextResponse.json(results);
      } else {
        const params = [log[0].number, log[0].hardware_code, log[0].license_date === null ? '0000-00-00' : log[0].license_date, log[0].manager, log[0].site_nm];
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