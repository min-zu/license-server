import { NextResponse, NextRequest } from "next/server";
import { query } from "@/app/db/database";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from "fs/promises";


const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const hardwareSerial = searchParams.get('serial') || '';
  const uuid = searchParams.get('uuid') || '';
  const hardwareCode = searchParams.get('hardware') || 'testcode';
  const ip = request.headers.get('x-forwarded-for')?.split(':').pop() || null;
  
  let check = 0;

  const rows = await query("SELECT hardware_serial, hardware_code FROM license");

  for (const row of rows as any[]) {
    if (row.hardware_serial == hardwareSerial) {
      await query(`UPDATE license SET hardware_code = ? WHERE hardware_serial = ?`, [hardwareCode, hardwareSerial]);
      await query(`UPDATE license SET license_date = NOW() WHERE hardware_serial = ?`, [hardwareSerial]);
      await query(`UPDATE license SET ip = ? WHERE hardware_serial = ?`, [ip, hardwareSerial]);
      await query(`UPDATE license SET license_key = '0' WHERE hardware_serial = ?`, [hardwareSerial]);

      check = 1;
    }
  }

  if(check == 1) {
    const data = await query("SELECT hardware_status, limit_time_start, limit_time_end, license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot FROM license WHERE hardware_serial = ?;", [hardwareSerial]);
    const { hardware_status, limit_time_start, limit_time_end, license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot } = (data as any[])[0];

    let licenseKey: string | null = null;
    if (hardware_status.toUpperCase() === 'ITU') {
          
      const function_map = 
        (Number(license_fw) || 0) * 1 +
        (Number(license_vpn) || 0) * 2 +
        (Number(license_dpi) || 0) * 4 +
        (Number(license_av) || 0) * 8 +
        (Number(license_as) || 0) * 16 +
        (Number(license_s2) || 0) * 32 +
        (Number(license_ot) || 0) * 64;

      const date = new Date(limit_time_end.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
      const [y, m, d] = date.split("-").map(Number);
      const expireDate = new Date(y, m - 1, d, 0, 0, 0).getTime()/1000;
      const hex_expire = Math.floor(expireDate).toString(16);

      const cmd = `/home/future/license/license ${hardwareSerial} ${function_map} ${hex_expire}`;
      const result = await execAsync(cmd);
      const _ituKey = result.stdout.replace(/\n/g, '');
      // const _ituKey = "ituindexITUtest123hardwardCode456";
      licenseKey = typeof _ituKey === 'string' ? _ituKey : null; // exec의 결과가 문자열인지 확인

      // Log
      const logPath = "/home/future/license/log/ituindex_license.log";
      const logContent =
`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}]
serial_num: ${hardwareSerial}
uuid: ${uuid}
hardware_key: ${hardwareCode}
enddate: ${date}
${cmd}

`;
      try {
        await fs.appendFile(logPath, logContent)
      } catch (error) {
        console.error("log 파일 생성 실패: ", error);
      }

    } else if (hardware_status.toUpperCase() === 'ITM') {
      
      let serial = hardwareSerial;
      const codes = hardwareSerial.split('-');

      if (codes.length > 3) { // cut dummy number
        serial = `${codes[0]}-${codes[1]}-${codes[2]}`;
      }

      const date = new Date(limit_time_end.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
      const endDate = date.split('-').map(Number);
      const endDateStr = `${endDate[0]}${endDate[1]}${endDate[2]}`;

      const cmd = `/home/future/license/fslicense3 -n -k ${hardwareCode} -s ${serial} -e ${endDateStr}`;

      const result = await execAsync(cmd);
      const _itmKey = result.stdout.replace(/\n/g, '');
      // const _itmKey = "ituindexSMCITMtest123hardwardCode456";
      licenseKey = typeof _itmKey === 'string' ? _itmKey : null; // exec의 결과가 문자열인지 확인
    }

    const rows2 = await query("SELECT hardware_serial, hardware_code, license_key, process, cpu_name, cfid FROM license");
    const today = new Date().toISOString().split('T')[0];
    
    for (const row of rows2 as any[]) {
      if (row.hardware_serial === hardwareSerial){
        if(row.license_key === '0') {
          await query(`UPDATE license SET license_key = ? WHERE hardware_serial = ?`, [licenseKey, hardwareSerial]);
          await query(`UPDATE license SET license_date = ? WHERE hardware_serial = ?`, [today, hardwareSerial]);
        } else {
          let comment = '';
          await query(`INSERT INTO license_reauth values(0, ?, ?, ?, ?, ?, ?, now());`, [hardwareSerial, hardwareCode, row.process, row.cpu_name, row.cfid, comment]);
        }
      }
    }
    return NextResponse.json(licenseKey);
  } else {
    return NextResponse.json('');
  }
}