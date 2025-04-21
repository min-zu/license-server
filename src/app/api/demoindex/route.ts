import { NextResponse, NextRequest } from "next/server";
import { query } from "@/app/db/database";
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const hardware_code = searchParams.get('serial') || '';
  const uuid = searchParams.get('uuid') || '';
  const init_code = searchParams.get('hardware') || 'testcode';
  const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
  
  // let check = 0;

  /**log */
  // const logPath = "/tmp/serial.log";
  // const logContent = [
  //   `hardware_code: ${hardware_code}`,
  //   `uuid: ${uuid}`,
  //   `init_code: ${init_code}`,
  //   `---\n`
  // ].join('\n');
  const logPath = "/tmp/serial.log";
  const logContent = `${hardware_code}\n${uuid}\n${init_code}`;

  try {
    writeFileSync(logPath, logContent, { flag: 'w' });
  } catch (error) {
    console.error("log 파일 생성 실패: ", error);
  }

  const rows = await query("SELECT hardware_code, init_code, process FROM license");

  for (const row of rows as any[]) {
    if (row.hardware_code === hardware_code) {
      if(row.process === 0) {
        // return NextResponse.json({ success: false, message: "Inactive license" });
      } else {
        await query(`UPDATE license SET init_code = ?, license_date = NOW(), ip = ?, process = 0, auth_code = '0' WHERE hardware_code = ?`, [init_code, ip, hardware_code]);
        // return NextResponse.json({ success: true, message: "License updated successfully"});
      }
    } 
  }

  const rows2 = await query("SELECT limit_time_end, license_fw, license_vpn, license_ssl, license_ips, license_av, license _as, license_tracker FROM license WHERE hardware_code = ?", [hardware_code]);
  const { limit_time_end, license_fw, license_vpn, license_ssl, license_ips, license_av, license_as, license_tracker } = (rows2 as any[])[0];

  const function_map =  
    (Number(license_fw) || 0) * 1 +
    (Number(license_vpn) || 0) * 2 +
    (Number(license_ips) || 0) * 4 +
    (Number(license_av) || 0) * 8 +
    (Number(license_as) || 0) * 16 +
    (Number(license_ssl) || 0) * 32 +
    (Number(license_tracker) || 0) * 64;

  const today = new Date(); // 현재 날짜 객체
  const endDate = new Date(today); // 복사본 생성
  endDate.setMonth(endDate.getMonth() + 1);

  const expireDate = new Date(endDate).getTime()/1000;
  const hex_expire = Math.floor(expireDate).toString(16);
  const logPath2 = "/tmp/date.log";

  try {
    writeFileSync(logPath2, endDate.toISOString().split("T")[0], "utf8");
  } catch (error) {
    console.error("log 파일 생성 실패: ", error);
  }

  const cmd = `/var/www/issue/license ${hardware_code} ${function_map} ${hex_expire}`;

  let license_key: string | null = null;
  if (hardware_code.startsWith('ITU')) {
    // const result = exec(cmd);
    const result = "DemoITUtest123hardwardCode456";
    license_key = typeof result === 'string' ? result : null; // exec의 결과가 문자열인지 확인
  } 

  const rows3 = await query("SELECT hardware_code, init_code, auth_code, process, cpu_name, cfid FROM license");
  
  for (const row of rows3 as any[]) {
    if (row.hardware_code === hardware_code)
      if(row.auth_code === '0') {
      await query(`UPDATE license SET init_code = ? WHERE hardware_code = ?`, [init_code, hardware_code]);
      await query(`UPDATE license SET limit_time_st = ? WHERE hardware_code = ?`, [today, hardware_code]);
      await query(`UPDATE license SET limit_time_end = ? WHERE hardware_code = ?`, [endDate.toISOString().split("T")[0], hardware_code]);
      await query(`UPDATE license SET license_date = ? WHERE hardware_code = ?`, [today, hardware_code]);
      await query(`UPDATE license SET auth_code = ? WHERE hardware_code = ?`, [license_key, hardware_code]);

      return NextResponse.json({ success: true, message: "License updated successfully"});
      } else {
        let comment = '';
        await query(`INSERT INTO license_reauth values(0, ?, ?, ?, ?, ?, ?, now());`, [hardware_code, init_code, row.process, row.cpu_name, row.cfid, comment]);
        return NextResponse.json({ success: false, message: 'Invalid hardware code' }, { status: 400 });

      }
    } 
  }
