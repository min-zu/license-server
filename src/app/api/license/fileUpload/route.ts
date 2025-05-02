import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { query } from '@/app/db/database'; // DB 쿼리 유틸 유틸
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('uploadFile') as File;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile('/home/future/license/upload_license.csv', buffer);

    const content = buffer.toString('utf-8');

    const records: string[][] = parse(content, {
      skip_empty_lines: true,
      trim: true,
    });

    // 헤더 제거
    const [header, ...dataRows] = records;

    // 모든 셀이 빈 문자열일 경우 제거
    const filteredRows = dataRows.filter(row =>
      row.some(cell => cell.trim() !== '')
    );
  
    if(filteredRows.length === 0) {
      return NextResponse.json({ message: '파일이 비어있습니다.' }, { status: 400 });
    }    

    const results: string[] = [];
    const clientIp = request.headers.get('x-forwarded-for')?.split(':').pop() || null;

    for(let i = 0; i < filteredRows.length; i++) {
      const row = filteredRows[i];
      const trimmedRow = row.map(item => item.replace(/\r?\n|\r/g, '').trim());

      // 기본 필드 (앞쪽 공통 필드 9개)
      const [
        hardwareStatus,
        hardwareSerial,
        limitTimeStart,
        limitTimeEnd,
        regUser,
        regRequest,
        customer,
        projectName,
        customerEmail,
        // hardwareCode,
        ...options // 나머지 옵션 필드들은 배열로 받음
      ] = trimmedRow;

      console.log("options: ", options);

      let [fw, vpn, s2, dpi, av, as, ot] = ['0', '0', '0', '0', '0', '0', '0'];

      [fw, vpn, s2, dpi, av, as, ot] = options;

      const trimmed = hardwareSerial.trim();
      const codes = trimmed.split('-').length >= 3;

      if(!hardwareStatus.toUpperCase().includes('ITU') && !hardwareStatus.toUpperCase().includes('ITM')) {
        return NextResponse.json({ message: `${i + 1}행 장비선택 입력` }, { status: 400 });
      }

      if(codes && trimmed.length < 22) {
        return NextResponse.json({ message: `${i + 1}행 시리얼 [${hardwareSerial}] 22자 이상 입력` }, { status: 400 });
      } else if(!codes && trimmed.length !== 24) {
        return NextResponse.json({ message: `${i + 1}행 시리얼 [${hardwareSerial}] 24자 입력` }, { status: 400 });
      }

      const rowCheck = await query("SELECT COUNT(*) as cnt FROM license WHERE hardware_serial = ?;", [hardwareSerial]);
      if(Number(rowCheck[0].cnt) > 0) {
        return NextResponse.json({ message: `${i + 1}행 시리얼 [${hardwareSerial}] 중복` }, { status: 400 });
      }

      if (limitTimeStart.length !== 8 || limitTimeEnd.length !== 8) {
        return NextResponse.json({ message: `${i + 1}행 유효기간 오류, 8자(YYYYMMDD) 입력` }, { status: 400 });
      }

      if(regRequest === '') {
        return NextResponse.json({ message: `${i + 1}행 발급요청사 입력` }, { status: 400 });
      }

      if(projectName === '') {
        return NextResponse.json({ message: `${i + 1}행 프로젝트/CPU명 입력` }, { status: 400 });
      }

      if(customer === '') {
        return NextResponse.json({ message: `${i + 1}행 고객사명 입력` }, { status: 400 });
      }

      if(customerEmail === '') {
        return NextResponse.json({ message: `${i + 1}행 고객사 E-mail/CFID 입력` }, { status: 400 });
      }

      // if(hardwareCode === '') {
      //   return NextResponse.json({ message: `${i + 1}행 하드웨어 인증키 입력` }, { status: 400 });
      // }

      for(let j = 0; j < options.length; j++) {
        if(options[j] === '') options[j] = '0';
      }
      
      let sql = '';
      const params = [];
      
      let licenseKey: string | null = null;
      const startDate = limitTimeStart.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      const endDate = limitTimeEnd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

      if(hardwareStatus.toUpperCase() === 'ITU') {
        const functionMap = 
          (Number(fw) || 0) * 1 +
          (Number(vpn) || 0) * 2 +
          (Number(dpi) || 0) * 4 +
          (Number(av) || 0) * 8 +
          (Number(as) || 0) * 16 +
          (Number(s2) || 0) * 32 +
          (Number(ot) || 0) * 64;
        
        const [y, m, d] = endDate.split("-").map(Number);
        const expireDate = new Date(y, m - 1, d, 0, 0, 0).getTime()/1000;
        const hex_expire = Math.floor(expireDate).toString(16);
    
        const cmd = `/home/future/license/license ${hardwareSerial} ${functionMap} ${hex_expire}`;
        const result = await execAsync(cmd);
        const _ituKey = result.stdout.replace(/\n/g, '');
        // const _ituKey = "fileImportAddtestITU123hardwardCode456";
        licenseKey = typeof _ituKey === 'string' ? _ituKey : null;
  
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
            hardwareSerial, hardwareStatus, '', startDate, endDate, clientIp, licenseKey, regUser, regRequest, customer, projectName, customerEmail, 
            fw, vpn, s2, dpi, av, as, ot
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
            hardwareSerial, hardwareStatus, '', startDate, endDate, clientIp, regUser, regRequest, customer, projectName, customerEmail, 
            fw, vpn, s2, dpi, av, as, ot
          );
        }
      }
      /* itu 외 파일업로드 논의 (기존에없음음)
      else{
        // const license_key = await generateLicenseKey({hardwareStatus, hardwareCode, softwareOpt: {fw, vpn, ssl, ips, waf, av, as}, limitTimeStart, limitTimeEnd, issuer, manager, cpuName, siteName, cfid});
        let license_module = "-F";
        if(Number(vpn) === 1) license_module += "V"; // option 2
        if(Number(ssl) === 1) license_module += "S"; // option 3
        if(Number(ips) === 1) license_module += "I"; // option 4
        if(Number(ddos) === 1) license_module += "D"; // option 5
        if(Number(waf) === 1) license_module += "W"; // option 6
        if(Number(av) === 1) license_module += "A"; // option 7
        if(Number(as) === 1) license_module += "P"; // option 8

        // SMC / ITM
        else if(hardwareCode.split('-').length >= 3){
          let serial = hardwareCode;
          const codes = hardwareCode.split('-');

          if (codes.length > 3) { // cut dummy number
            serial = `${codes[0]}-${codes[1]}-${codes[2]}`;
          }

          console.log("regInit: ", initCode);
          console.log("serial: ", serial);
          console.log("limitTimeStart: ", limitTimeStart);
          console.log("limitTimeEnd: ", limitTimeEnd);
          const cmd = `../issue/fslicense -n -k ${initCode} -s ${serial} -b ${startDate} -e ${endDate}`;
          // const _itmKey = await execAsync(cmd);
          const _itmKey = "fileImportAddtestSMCITM123hardwardCode456";
          license_key = typeof _itmKey === 'string' ? _itmKey : null;

        } else {
          // XTM
          console.log("regInit: ", initCode);
          console.log("limitTimeStart: ", limitTimeStart);
          console.log("limitTimeEnd: ", limitTimeEnd);
          console.log("hardwareCode: ", hardwareCode);
          console.log("license_module: ", license_module);
          const cmd = `../issue/issue_china -c ${initCode} -s ${startDate} -e ${endDate} -r ${hardwareCode} ${license_module}`;
          // const xtm_key = await execAsync(cmd);
          const xtm_key = "fileImportAddtestXTM123hardwardCode456";
          license_key = typeof xtm_key === 'string' ? xtm_key : null;
        }
  
        console.log("license_key: ", license_key);
        console.log('fw : ', fw);
        console.log('vpn : ', vpn);
        console.log('ssl : ', ssl);
        console.log('ips : ', ips);
        console.log('ddos : ', ddos);
        console.log('waf : ', waf);
        console.log('av : ', av);
        console.log('as : ', as);
        console.log('tracker : ', tracker);

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
            hardwareCode, hardwareStatus, '', startDate, endDate, clientIp, license_key, issuer, manager, siteName, cpuName, cfid, 
            0, fw, vpn, ssl, ips, 0, waf, av, as, tracker
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
            hardwareCode, hardwareStatus, '', startDate, endDate, clientIp, issuer, manager, siteName, 
            0, fw, vpn, ssl, ips, 0, waf, av, as, tracker
          );
        }
      }

      */
      // Log
      const logPath = '/home/future/license/log/upload_license.log';
      const logContent =
`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}]
SQL: ${sql}
PARAMS: ${JSON.stringify(params)}

`;
      try {
        await fs.appendFile(logPath, logContent)
      } catch (error) {
        console.error("log 파일 생성 실패: ", error);
      }
      await query(sql, params);
    }
    return NextResponse.json({ message: '업로드 성공' }, { status: 200 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: '업로드 처리 중 오류 발생' }, { status: 500 });
  }
}