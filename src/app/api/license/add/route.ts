import { NextResponse, NextRequest } from "next/server";
import { query } from "@/app/db/database";
import { exec } from 'child_process';
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(params: Request) {
  const url = new URL(params.url); 
  const hardwareCode = url.searchParams.get('hardwareCode'); 
  try {
    const rows = await query("SELECT COUNT(*) as cnt FROM license WHERE hardware_code = ?;", [hardwareCode]);
    return NextResponse.json(rows);
  } catch (e) {
    console.log('error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }); // 에러 발생 시 응답 추가
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded?.split(',')[0].trim();
  const { hardwareStatus, hardwareCode, softwareOpt, limitTimeStart, limitTimeEnd, issuer, manager, cpuName, siteName, cfid, regInit } = data;
  // const license_key = await generateLicenseKey(data);
  
  const option0 = softwareOpt.basic || 0;
  const option1 = softwareOpt.fw || 0;
  const option2 = softwareOpt.vpn || 0;
  const option3 = softwareOpt.ssl || softwareOpt.행안부 || 0;
  const option4 = softwareOpt.ips || softwareOpt.dpi || 0;
  const option5 = softwareOpt.ddos || 0;
  const option6 = softwareOpt.waf || 0;
  const option7 = softwareOpt.av || 0;
  const option8 = softwareOpt.as || 0; 
  // const option9 = softwareOpt.apt || 0;
  const option9 = softwareOpt.tracker || softwareOpt.한전 || 0; // 한전 임시
  
  let license_key = null;

  // 라이센스 키
  if (hardwareCode.startsWith('ITU')) {
    const functionMap = 
      (Number(softwareOpt.fw) || 0) * 1 + // option 1
      (Number(softwareOpt.vpn) || 0) * 2 + // option 2
      (Number(softwareOpt.dpi) || 0) * 4 + // option 4
      (Number(softwareOpt.av) || 0) * 8 + // option 7
      (Number(softwareOpt.AS) || 0) * 16 + // option 8
      (Number(softwareOpt.행안부) || 0) * 32 + // option 3
      (Number(softwareOpt.한전) || 0) * 64; // option 9

    const expireDate = new Date(limitTimeEnd).getTime()/1000;
    const hex_expire = Math.floor(expireDate).toString(16);

    console.log("limitTimeStart: ", limitTimeStart);
    console.log("limitTimeEnd: ", limitTimeEnd);
    console.log("functionMap: ", functionMap);
    console.log("hexExpire: ", hex_expire);

    const cmd = `/var/www/issue/license ${hardwareCode} ${functionMap} ${hex_expire}`;
    // const _ituKey = await execAsync(cmd);
    const _ituKey = "addtestITU123hardwardCode456";
    license_key = typeof _ituKey === 'string' ? _ituKey : null;

  } else if (!hardwareCode.startsWith('ITU') && regInit !== "" && regInit !== undefined) {
    console.log("regInit: ", regInit);
    let license_module = "-F";
    if(Number(softwareOpt.vpn) === 1) license_module += "V"; // option 2
    if(Number(softwareOpt.ssl) === 1) license_module += "S"; // option 3
    if(Number(softwareOpt.ips) === 1) license_module += "I"; // option 4
    if(Number(softwareOpt.ddos) === 1) license_module += "D"; // option 5
    if(Number(softwareOpt.waf) === 1) license_module += "W"; // option 6
    if(Number(softwareOpt.av) === 1) license_module += "A"; // option 7
    if(Number(softwareOpt.as) === 1) license_module += "P"; // option 8

    // SMC / ITM
    else if(hardwareCode.split('-').length >= 3){
      let serial = hardwareCode;
      const codes = hardwareCode.split('-');

      if (codes.length > 3) { // cut dummy number
        serial = `${codes[0]}-${codes[1]}-${codes[2]}`;
      }

      console.log("regInit: ", regInit);
      console.log("serial: ", serial);
      console.log("limitTimeStart: ", limitTimeStart);
      console.log("limitTimeEnd: ", limitTimeEnd);
      const cmd = `../issue/fslicense -n -k ${regInit} -s ${serial} -b ${limitTimeStart} -e ${limitTimeEnd}`;
      // const _itmKey = await execAsync(cmd);
      const _itmKey = "addtestSMCITM123hardwardCode456";
      license_key = typeof _itmKey === 'string' ? _itmKey : null;

    } else {
      // XTM
      console.log("regInit: ", regInit);
      console.log("limitTimeStart: ", limitTimeStart);
      console.log("limitTimeEnd: ", limitTimeEnd);
      console.log("hardwareCode: ", hardwareCode);
      console.log("license_module: ", license_module);
      const cmd = `../issue/issue_china -c ${regInit} -s ${limitTimeStart} -e ${limitTimeEnd} -r ${hardwareCode} ${license_module}`;
      // const xtm_key = await execAsync(cmd);
      const xtm_key = "addtestXTM123hardwardCode456";
      license_key = typeof xtm_key === 'string' ? xtm_key : null;
    }
  } else {
    license_key = null;
  }

  console.log("license_key: ", license_key);

  let sql = '';
  const params = [];
  if(hardwareCode !== "") {
    if(hardwareCode.startsWith("ITU")) {
      if(license_key) {        
        sql = `INSERT INTO license (
          number, reg_date, license_date,
          \`SSL\`, \`NAC\`, \`WAF\`, \`ASAV\`, reissuance, process,
          hardware_code, hardware_status, init_code, limit_time_st, limit_time_end, ip, auth_code, issuer, manager, site_nm, cpu_name, cfid,
          license_basic, license_fw, license_vpn, license_ssl, license_ips, license_ddos, license_waf, license_av, license_as, license_tracker
          ) VALUES (
            0, now(), now(),
            0, 0, 0, 0, 0, 1,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareCode, hardwareStatus, regInit, limitTimeStart, limitTimeEnd, clientIp, license_key, issuer, manager, siteName, cpuName, cfid, 
          option0, option1, option2, option3, option4, option5, option6, option7, option8, option9
        );
      } else {
        sql = `INSERT INTO license (
          number, reg_date, license_date,
          \`SSL\`, \`NAC\`, \`WAF\`, \`ASAV\`, reissuance, process, auth_code,
          hardware_code, hardware_status, init_code, limit_time_st, limit_time_end, ip, issuer, manager, site_nm, cpu_name, cfid,
          license_basic, license_fw, license_vpn, license_ssl, license_ips, license_ddos, license_waf, license_av, license_as, license_tracker
        ) VALUES (
          0, now(), now(),
          0, 0, 0, 0, 0, 1, 0,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`

        params.push(
          hardwareCode, hardwareStatus, regInit, limitTimeStart, limitTimeEnd, clientIp, issuer, manager, siteName, cpuName, cfid, 
          option0, option1, option2, option3, option4, option5, option6, option7, option8, option9
        );
      }
    } else {
      if(license_key) {
        sql = `INSERT INTO license (
          number, reg_date, license_date,
          \`SSL\`, \`NAC\`, \`WAF\`, \`ASAV\`, reissuance, process,
          hardware_code, hardware_status, init_code, limit_time_st, limit_time_end, ip, auth_code, issuer, manager, site_nm, cpu_name, cfid,
          license_basic, license_fw, license_vpn, license_ssl, license_ips, license_ddos, license_waf, license_av, license_as, license_tracker
          ) VALUES (
            0, now(), now(),
            0, 0, 0, 0, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareCode, hardwareStatus, regInit, limitTimeStart, limitTimeEnd, clientIp, license_key, issuer, manager, siteName,
          option0, option1, option2, option3, option4, option5, option6, option7, option8, option9
        );
      } else {
        sql = `INSERT INTO license (
          number, reg_date, license_date,
          \`SSL\`, \`NAC\`, \`WAF\`, \`ASAV\`, reissuance, auth_code, process,
          hardware_code, hardware_status, init_code, limit_time_st, limit_time_end, ip, issuer, manager, site_nm, cpu_name, cfid,
          license_basic, license_fw, license_vpn, license_ssl, license_ips, license_ddos, license_waf, license_av, license_as, license_tracker
          ) VALUES (
            0, now(), now(),
            0, 0, 0, 0, 0, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          hardwareCode, hardwareStatus, regInit, limitTimeStart, limitTimeEnd, clientIp, issuer, manager, siteName, 
          option0, option1, option2, option3, option4, option5, option6, option7, option8, option9
        );
      }
    }
    const result = await query(sql, params);
    return NextResponse.json({ result: result, success: true });
  }
}
