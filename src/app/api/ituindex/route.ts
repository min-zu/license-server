import { NextResponse, NextRequest } from "next/server";
import { query } from "@/app/db/database";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from "fs/promises";


const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const hardware_code = searchParams.get('serial') || '';
  const uuid = searchParams.get('uuid') || '';
  const init_code = searchParams.get('hardware') || 'testcode';
  const ip = request.headers.get('x-forwarded-for')?.split(':').pop() || null;
  
  let check = 0;

  const rows = await query("SELECT hardware_code, init_code FROM license");

  for (const row of rows as any[]) {
    if (row.hardware_code == hardware_code) {
      await query(`UPDATE license SET init_code = ? WHERE hardware_code = ?`, [init_code, hardware_code]);
      await query(`UPDATE license SET license_date = NOW() WHERE hardware_code = ?`, [hardware_code]);
      await query(`UPDATE license SET ip = ? WHERE hardware_code = ?`, [ip, hardware_code]);
      await query(`UPDATE license SET auth_code = '0' WHERE hardware_code = ?`, [hardware_code]);

      check = 1;
    }
  }

  if(check == 1) {
    const data = await query("SELECT limit_time_st, limit_time_end, license_fw, license_vpn, license_ssl, license_ips, license_av, license_as, license_tracker FROM license WHERE hardware_code = ?;", [hardware_code]);
    const { limit_time_start, limit_time_end, license_fw, license_vpn, license_ssl, license_ips, license_av, license_as, license_tracker } = (data as any[])[0];

    let license_key: string | null = null;
    if (hardware_code.startsWith('ITU')) {
          
      const function_map = 
        (Number(license_fw) || 0) * 1 +
        (Number(license_vpn) || 0) * 2 +
        (Number(license_ips) || 0) * 4 +
        (Number(license_av) || 0) * 8 +
        (Number(license_as) || 0) * 16 +
        (Number(license_ssl) || 0) * 32 +
        (Number(license_tracker) || 0) * 64;

      const date = new Date(limit_time_end.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
      const [y, m, d] = date.split("-").map(Number);
      const expireDate = new Date(y, m - 1, d, 0, 0, 0).getTime()/1000;
      const hex_expire = Math.floor(expireDate).toString(16);

      const cmd = `/home/future/license/license ${hardware_code} ${function_map} ${hex_expire}`;
      const result = await execAsync(cmd);
      const _ituKey = result.stdout.replace(/\n/g, '');
      // const _ituKey = "ituindexITUtest123hardwardCode456";
      license_key = typeof _ituKey === 'string' ? _ituKey : null; // exec의 결과가 문자열인지 확인

      // Log
      const logPath = "/home/future/license/log/ituindexcmd.log";
      const logContent =
`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}]
serial_num: ${hardware_code}
uuid: ${uuid}
hardware_key: ${init_code}
enddate: ${date}
${cmd}

`;
      try {
        await fs.appendFile(logPath, logContent)
      } catch (error) {
        console.error("log 파일 생성 실패: ", error);
      }

    } else if (hardware_code.split('-').length >= 3) {
      
      let serial = hardware_code;
      const codes = hardware_code.split('-');

      if (codes.length > 3) { // cut dummy number
        serial = `${codes[0]}-${codes[1]}-${codes[2]}`;
      }

      const date = new Date(limit_time_end.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
      const endDate = date.split('-').map(Number);
      const endDateStr = `${endDate[0]}${endDate[1]}${endDate[2]}`;

      const cmd = `/home/future/license/fslicense3 -n -k ${init_code} -s ${serial} -e ${endDateStr}`;

      const result = await execAsync(cmd);
      const _itmKey = result.stdout.replace(/\n/g, '');
      // const _itmKey = "ituindexSMCITMtest123hardwardCode456";
      license_key = typeof _itmKey === 'string' ? _itmKey : null; // exec의 결과가 문자열인지 확인
    }

    const rows2 = await query("SELECT hardware_code, init_code, auth_code, process, cpu_name, cfid FROM license");
    const today = new Date().toISOString().split('T')[0];
    
    for (const row of rows2 as any[]) {
      if (row.hardware_code === hardware_code){
        if(row.auth_code === '0') {
          await query(`UPDATE license SET auth_code = ? WHERE hardware_code = ?`, [license_key, hardware_code]);
          await query(`UPDATE license SET license_date = ? WHERE hardware_code = ?`, [today, hardware_code]);
        } else {
          let comment = '';
          await query(`INSERT INTO license_reauth values(0, ?, ?, ?, ?, ?, ?, now());`, [hardware_code, init_code, row.process, row.cpu_name, row.cfid, comment]);
        }
      }
    }
    return NextResponse.json({ license_key });
  } else {
    return NextResponse.json({ error: 'Invalid hardware code' }, { status: 400 });
  }
}