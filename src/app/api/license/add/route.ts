import { NextResponse, NextRequest } from "next/server";
import { query } from "@/app/db/database";
import { generateLicenseKey } from "@/app/utils/licenseUtils";

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
  const ip = request.headers.get('x-forwarded-for');
  const { hardwareStatus, hardwareCode, softwareOpt, limitTimeStart, limitTimeEnd, issuer, manager, cpuName, siteName, cfid, regInit } = data;
  const license_key = await generateLicenseKey(data);

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
  const option9 = softwareOpt.tracker || 0;

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
          hardwareCode, hardwareStatus, regInit, limitTimeStart, limitTimeEnd, ip, license_key, issuer, manager, siteName, cpuName, cfid, 
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
          hardwareCode, hardwareStatus, regInit, limitTimeStart, limitTimeEnd, ip, issuer, manager, siteName, cpuName, cfid, 
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
          hardwareCode, hardwareStatus, regInit, limitTimeStart, limitTimeEnd, ip, license_key, issuer, manager, siteName,
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
          hardwareCode, hardwareStatus, regInit, limitTimeStart, limitTimeEnd, ip, issuer, manager, siteName, 
          option0, option1, option2, option3, option4, option5, option6, option7, option8, option9
        );
      }
    }
    const result = await query(sql, params);
    return NextResponse.json({ result: result, success: true });
  }
}
