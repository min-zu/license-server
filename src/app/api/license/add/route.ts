import { NextResponse, NextRequest } from "next/server";
import { query } from "@/app/db/database";
import { exec } from 'child_process';
import { promisify } from "util";
import fs from "fs/promises";


const execAsync = promisify(exec);

export async function GET(params: NextRequest) {
  const url = new URL(params.url); 
  const hardwareSerial = url.searchParams.get('hardwareSerial'); 
  try {
    const rows = await query("SELECT COUNT(*) as cnt FROM license WHERE hardware_serial = ?;", [hardwareSerial]);
    return NextResponse.json(rows);
  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }); // 에러 발생 시 응답 추가
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded?.split(":").pop() || null;
  const { hardwareStatus, hardwareSerial, softwareOpt, limitTimeStart, limitTimeEnd, regUser, regRequest, projectName, customer, customerEmail, hardwareCode } = data;
  // const license_key = await generateLicenseKey(data);
  
  const option1 = Number(softwareOpt.fw) || 0;
  const option2 = Number(softwareOpt.vpn) || 0;
  const option3 = Number(softwareOpt.s2) || 0;
  const option4 = Number(softwareOpt.dpi) || 0;
  const option7 = Number(softwareOpt.av) || 0;
  const option8 = Number(softwareOpt.as) || 0; 
  const option9 = Number(softwareOpt.ot) || 0; // ot 임시
  
  let licenseKey = null;

  // 라이센스 키
  if (hardwareSerial.startsWith('ITU')) {
    const functionMap = 
      option1 * 1 + // option 1
      option2 * 2 + // option 2
      option4 * 4 + // option 4
      option7 * 8 + // option 7
      option8 * 16 + // option 8
      option3 * 32 + // option 3
      option9 * 64; // option 9

    const [y, m, d] = limitTimeEnd.split("-").map(Number);
    const expireDate = new Date(y, m - 1, d, 0, 0, 0).getTime()/1000;
    const hex_expire = Math.floor(expireDate).toString(16);

    const cmd = `/home/future/license/license ${hardwareSerial} ${functionMap} ${hex_expire}`;
    const result = await execAsync(cmd);
    const _ituKey = result.stdout.replace(/\n/g, '');

    // const _ituKey = "addtestITU123hardwardCode456";
    licenseKey = typeof _ituKey === 'string' ? _ituKey : null;

    // Log
    const logPath = "/home/future/license/log/add_itulicense.log";
    const logContent =
`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}]
serial_num: ${hardwareSerial}
function_map: ${functionMap}
limit_time_end: ${limitTimeEnd}
${cmd}

`;
    try {
      await fs.appendFile(logPath, logContent)
    } catch (error) {
      console.error("log 파일 생성 실패: ", error);
    }

  } else if (!hardwareSerial.startsWith('ITU') && hardwareCode !== "" && hardwareCode !== undefined) {
    console.log("regInit: ", hardwareCode);

    // SMC / ITM
    if(hardwareSerial.split('-').length >= 3){
      let serial = hardwareSerial;
      const codes = hardwareSerial.split('-');

      if (codes.length > 3) { // cut dummy number
        serial = `${codes[0]}-${codes[1]}-${codes[2]}`;
      }

      const startDate = limitTimeStart.split('-').map(Number);
      const endDate = limitTimeEnd.split('-').map(Number);

      const startDateStr = `${startDate[0]}${startDate[1]}${startDate[2]}`;
      const endDateStr = `${endDate[0]}${endDate[1]}${endDate[2]}`;

      const cmd = `/home/future/license/fslicense3 -n -k ${hardwareCode} -s ${serial} -b ${startDateStr} -e ${endDateStr}`;
      const result = await execAsync(cmd);
      const _itmKey = result.stdout.replace(/\n/g, '');

      // const _itmKey = "addtestITM123hardwardCode456";
      licenseKey = typeof _itmKey === 'string' ? _itmKey : null;

      // Log
      const logPath = "/home/future/license/log/add_itmlicense.log";
      const logContent =
`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}]
serial_num: ${hardwareSerial}
hardware_key: ${hardwareCode}
limit_time_start: ${limitTimeStart}
limit_time_end: ${limitTimeEnd}
${cmd}

`;
      try {
        await fs.appendFile(logPath, logContent)
      } catch (error) {
        console.error("log 파일 생성 실패: ", error);
      }

    } 
  } else {
    licenseKey = null;
  }

  console.log("license_key: ", licenseKey);

  let sql = '';
  const params = [];
  if(hardwareSerial !== "") {
    if(hardwareSerial.startsWith("ITU")) {
      if(licenseKey) {        
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, demo_cnt,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, license_key, reg_user, reg_request, customer, project_name, customer_email,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot
          ) VALUES (
            0, now(), now(), 0, 1,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareSerial, hardwareStatus, hardwareCode, limitTimeStart, limitTimeEnd, clientIp, licenseKey, regUser, regRequest, customer, projectName, customerEmail, 
          option1, option2, option3, option4, option7, option8, option9
        );
      } else {
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, demo_cnt, license_key,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, reg_user, reg_request, customer, project_name, customer_email,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot
        ) VALUES (
          0, now(), now(), 0, 1, 0,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?
        )`

        params.push(
          hardwareSerial, hardwareStatus, hardwareCode, limitTimeStart, limitTimeEnd, clientIp, regUser, regRequest, customer, projectName, customerEmail, 
          option1, option2, option3, option4, option7, option8, option9
        );
      }
    // ITM
    } else {
      if(licenseKey) {
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, process,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, license_key, reg_user, reg_request, customer, cpu_name, cfid,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot
          ) VALUES (
            0, now(), now(), 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0,
            ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareSerial, hardwareStatus, hardwareCode, limitTimeStart, limitTimeEnd, clientIp, licenseKey, regUser, regRequest, customer,
          option1, option2, option3, option4, option7, option8, option9
        );
      } else {
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, license_key, process,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, reg_user, reg_request, customer, cpu_name, cfid,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot
          ) VALUES (
            0, now(), now(), 0, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0,
            ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareSerial, hardwareStatus, hardwareCode, limitTimeStart, limitTimeEnd, clientIp, regUser, regRequest, customer, 
          option1, option2, option3, option4, option7, option8, option9
        );
      }
    }
    const result = await query(sql, params);
    return NextResponse.json({ result: result, success: true });
  }
}
