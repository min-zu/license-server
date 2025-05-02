import { NextResponse, NextRequest } from "next/server";
import { query } from "@/app/db/database";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';


const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const hardwareSerial = searchParams.get('serial') || '';
  const uuid = searchParams.get('uuid') || '';
  const hardwareCode = searchParams.get('hardware') || 'testcode';
  const ip = request.headers.get('x-forwarded-for')?.split(':').pop() || null;

  const rows = await query("SELECT hardware_serial, hardware_code, demo_cnt FROM license");

  for (const row of rows as any[]) {
    if (row.hardware_serial === hardwareSerial) {
      if(row.demo_cnt === 0) {
        // return NextResponse.json({ success: false, message: "Inactive license" });
      } else {
        await query(`UPDATE license SET hardware_code = ?, license_date = NOW(), ip = ?, demo_cnt = 0, license_key = '0' WHERE hardware_serial = ?`, [hardwareCode, ip, hardwareSerial]);
        // return NextResponse.json({ success: true, message: "License updated successfully"});
      }
    } 
  }

  const rows2 = await query("SELECT hardware_status, limit_time_end, license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot FROM license WHERE hardware_serial = ?", [hardwareSerial]);

  if(rows2.length === 0) {
    return NextResponse.json('');
  }
  const { hardware_status, limit_time_end, license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot } = (rows2 as any[])[0];

  const functionMap =  
    (Number(license_fw) || 0) * 1 +
    (Number(license_vpn) || 0) * 2 +
    (Number(license_dpi) || 0) * 4 +
    (Number(license_av) || 0) * 8 +
    (Number(license_as) || 0) * 16 +
    (Number(license_s2) || 0) * 32 +
    (Number(license_ot) || 0) * 64;

  const today = new Date(); // 현재 날짜 객체
  const endDate = new Date(); 
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setHours(0, 0, 0, 0);  // 시간을 0시로 설정

  const expireDate = new Date(endDate).getTime()/1000;
  const hex_expire = Math.floor(expireDate).toString(16);

  // const cmd = `/var/www/issue/license ${hardwareSerial} ${functionMap} ${hex_expire}`;

  let license_key: string | null = null;
  if (hardware_status.toUpperCase() === 'ITU') {
    const cmd = `/home/future/license/license ${hardwareSerial} ${functionMap} ${hex_expire}`;
    const result = await execAsync(cmd);
    const _ituKey = result.stdout.replace(/\n/g, '');
    // const _ituKey = await execAsync(cmd);
    // const _ituKey = "DemoITUtest123hardwardCode456";
    license_key = typeof _ituKey === 'string' ? _ituKey : null; // exec의 결과가 문자열인지 확인

    // Log
    const logPath = "/home/future/license/log/demoindex_license.log";
    const logContent =
`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}]
serial_num: ${hardwareSerial}
uuid: ${uuid}
hardware_key: ${hardwareCode}
enddate: ${endDate}
${cmd}

`;
    try {
      await fs.appendFile(logPath, logContent)
    } catch (error) {
      console.error("log 파일 생성 실패: ", error);
    }
  }

  const rows3 = await query("SELECT hardware_serial, hardware_code, license_key, demo_cnt, project_name, customer_email FROM license");
  
  for (const row of rows3 as any[]) {
    if (row.hardware_serial === hardwareSerial)
      if(row.license_key === '0') {
      await query(`UPDATE license SET hardware_code = ? WHERE hardware_serial = ?`, [hardwareCode, hardwareSerial]);
      await query(`UPDATE license SET limit_time_st = ? WHERE hardware_serial = ?`, [today, hardwareSerial]);
      await query(`UPDATE license SET limit_time_end = ? WHERE hardware_serial = ?`, [endDate.toISOString().split("T")[0], hardwareSerial]);
      await query(`UPDATE license SET license_date = ? WHERE hardware_serial = ?`, [today, hardwareSerial]);
      await query(`UPDATE license SET license_key = ? WHERE hardware_serial = ?`, [license_key, hardwareSerial]);

      return NextResponse.json(license_key);
      } else {
        let comment = '';
        await query(`INSERT INTO license_reauth values(0, ?, ?, ?, ?, ?, ?, now());`, [hardwareSerial, hardwareCode, row.demo_cnt, row.project_name, row.customer_email, comment]);
        return NextResponse.json(comment);

      }
    } 
  }
