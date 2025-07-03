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
  const { hardwareStatus, hardwareSerial: rawSerial, softwareOpt, limitTimeStart, limitTimeEnd, regUser, regRequest, projectName, customer, customerEmail, hardwareCode } = data;
  const hardwareSerial = rawSerial?.slice(0, 3).toUpperCase() === "ITU" ? rawSerial.toUpperCase() : rawSerial;
  // const license_key = await generateLicenseKey(data);
  
  const fw = Number(softwareOpt.fw) || 0;
  const vpn = Number(softwareOpt.vpn) || 0;
  const s2 = Number(softwareOpt.s2) || 0;
  const dpi = Number(softwareOpt.dpi) || 0;
  const av = Number(softwareOpt.av) || 0;
  const as = Number(softwareOpt.as) || 0; 
  const ot = Number(softwareOpt.ot) || 0; 
  const zt = Number(softwareOpt.zt) || 0;
  
  let licenseKey = null;
  let _ituKey = null;
  let _itmKey = null;

  // 라이센스 키
  if (hardwareStatus === 'ITU') {
    const functionMap = 
      fw * 1 +
      vpn * 2 +
      s2 * 4 +
      dpi * 8 +
      av * 16 +
      as * 32 +
      ot * 64 +
      zt * 128;

    const [y, m, d] = limitTimeEnd.split("-").map(Number);
    const expireDate = new Date(y, m - 1, d, 0, 0, 0).getTime()/1000;
    const hex_expire = Math.floor(expireDate).toString(16);

    if(clientIp === "1") { // 로컬테스트 환경
      _ituKey = "addTestLicenseKeyByITU";
    } else {
      const cmd = `/home/future/license/license ${hardwareSerial} ${functionMap} ${hex_expire}`;
      const result = await execAsync(cmd);
      _ituKey = result.stdout.replace(/\n/g, '');

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
    }

    licenseKey = typeof _ituKey === 'string' ? _ituKey : null;

  } else if (hardwareStatus === 'ITM' && hardwareCode !== "" && hardwareCode !== undefined) {

    // ITM
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

      if(clientIp === "1") { // 로컬테스트 환경
        _itmKey = "addTestLicenseKeyByITM";
      } else {
        const cmd = `/home/future/license/fslicense3 -n -k ${hardwareCode} -s ${serial} -b ${startDateStr} -e ${endDateStr}`;
        const result = await execAsync(cmd);
        _itmKey = result.stdout.replace(/\n/g, '');

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
      licenseKey = typeof _itmKey === 'string' ? _itmKey : null;
    } 
  } else {
    licenseKey = null;
  }

  let sql = '';
  const params = [];
  if(hardwareSerial !== "") {
    if(hardwareStatus === "ITU") {
      if(licenseKey) {        
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, demo_cnt, reg_auto,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, license_key, reg_user, reg_request, customer, project_name, customer_email,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot, license_zt
          ) VALUES (
            0, now(), now(), 0, 1, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareSerial, hardwareStatus, hardwareCode, limitTimeStart, limitTimeEnd, clientIp, licenseKey, regUser, regRequest, customer, projectName, customerEmail, 
          fw, vpn, s2, dpi, av, as, ot, zt
        );
      } else {
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, demo_cnt, license_key,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, reg_user, reg_request, customer, project_name, customer_email,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot, license_zt
        ) VALUES (
          0, now(), now(), 0, 1, 0,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
        )`

        params.push(
          hardwareSerial, hardwareStatus, hardwareCode, limitTimeStart, limitTimeEnd, clientIp, regUser, regRequest, customer, projectName, customerEmail, 
          fw, vpn, s2, dpi, av, as, ot, zt
        );
      }
    // ITM
    } else {
      if(licenseKey) {
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, process, reg_auto,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, license_key, reg_user, reg_request, customer, cpu_name, cfid,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot, license_zt
          ) VALUES (
            0, now(), now(), 0, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareSerial, hardwareStatus, hardwareCode, limitTimeStart, limitTimeEnd, clientIp, licenseKey, regUser, regRequest, customer,
          fw, vpn, s2, dpi, av, as, ot, zt
        );
      } else {
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, license_key, process,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, reg_user, reg_request, customer, cpu_name, cfid,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot, license_zt
          ) VALUES (
            0, now(), now(), 0, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareSerial, hardwareStatus, hardwareCode, limitTimeStart, limitTimeEnd, clientIp, regUser, regRequest, customer,
          fw, vpn, s2, dpi, av, as, ot, zt
        );
      }
    }
    const result = await query(sql, params);
    return NextResponse.json({ result: result, success: true });
  }
}
