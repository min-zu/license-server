import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { query } from '@/app/db/database'; // DB 쿼리 유틸 유틸
import { exec } from 'child_process';
import { promisify } from 'util';
import { stringify } from 'csv-stringify/sync';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('uploadFile') as File;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // await fs.writeFile('/home/future/license/upload_license.csv', buffer);

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

    const clientIp = request.headers.get('x-forwarded-for')?.split(':').pop() || null;

    const failedRows: string[][] = [];

    for(let i = 0; i < filteredRows.length; i++) {
      const row = filteredRows[i];
      const trimmedRow = row.map(item => item.replace(/\r?\n|\r/g, '').trim());
      const errorMessages: string[] = [];

      // 기본 필드 (앞쪽 공통 필드 9개)
      const [
        hardwareSerial,
        limitTimeStart,
        limitTimeEnd,
        regUser,
        regRequest,
        customer,
        projectName,
        customerEmail,
        ...options // 나머지 옵션 필드들은 배열로 받음
      ] = trimmedRow;

      const [fw, vpn, s2, dpi, av, as, ot] = options.map(opt => opt || '0');

      const trimmedSerial = hardwareSerial.trim().replace(/\s/g, '').toUpperCase();
      const codes = trimmedSerial.split('-').length >= 3;

      if(!codes && trimmedSerial.length !== 24) {
        errorMessages.push(`시리얼 [${trimmedSerial}] 24자 입력`);
      }

      const rowCheck = await query("SELECT COUNT(*) as cnt FROM license WHERE hardware_serial = ?;", [trimmedSerial]);
      if(Number(rowCheck[0].cnt) > 0) {
        errorMessages.push(`시리얼 [${trimmedSerial}] 중복`);
      }

      if (limitTimeStart.length !== 8 || limitTimeEnd.length !== 8) {
        errorMessages.push(`유효기간 오류, 8자(YYYYMMDD) 입력`);
      }

      if(Number(limitTimeStart) >= Number(limitTimeEnd)) {
        errorMessages.push(`유효기간 타임라인 오류`);
      }

      if(regRequest === '') {
        errorMessages.push(`발급요청사 입력`);
      }

      if(projectName === '') {
        errorMessages.push(`프로젝트명 입력`);
      }

      if(customer === '') {
        errorMessages.push(`고객사명 입력`);
      }

      const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
      if(customerEmail === '') {
        errorMessages.push(`고객사 E-mail 입력`);
      } else if (!emailRegex.test(customerEmail)) {
        errorMessages.push(`고객사 E-mail 형식 오류`);
      }

      if (
        Number(ot) === 1 && (
          Number(vpn) === 1 ||
          Number(s2) === 1 ||
          Number(dpi) === 1 ||
          Number(av) === 1 ||
          Number(as) === 1
        )
      ) {
        errorMessages.push(`소프트웨어 옵션 사용값 재입력 필요`);
      }

      if (errorMessages.length > 0) {
        failedRows.push([...trimmedRow, errorMessages.join(', ')]);
        continue;
      }

      let sql = '';
      const params = [];

      let licenseKey: string | null = null;
      const startDate = limitTimeStart.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      const endDate = limitTimeEnd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

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

      const cmd = `/home/future/license/license ${trimmedSerial} ${functionMap} ${hex_expire}`;
      const result = await execAsync(cmd);
      const _ituKey = result.stdout.replace(/\n/g, '');

      // const _ituKey = "fileImportAddtestITU123hardwardCode456";
      licenseKey = typeof _ituKey === 'string' ? _ituKey : null;

      if(licenseKey) {        
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, demo_cnt, reg_auto,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, license_key, reg_user, reg_request, customer, project_name, customer_email,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot
          ) VALUES (
            0, now(), now(), 0, 1, 0,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )`;

        params.push(
          trimmedSerial, 'ITU', '', startDate, endDate, clientIp, licenseKey, regUser.trim(), regRequest.trim(), customer.trim(), projectName.trim(), customerEmail.trim(), 
          fw, vpn, s2, dpi, av, as, ot
        );
      } else {
        sql = `INSERT INTO license (
          number, reg_date, license_date, reissuance, demo_cnt, reg_auto, license_key,
          hardware_serial, hardware_status, hardware_code, limit_time_start, limit_time_end, ip, reg_user, reg_request, customer, project_name, customer_email,
          license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot
        ) VALUES ( 
          0, now(), now(), 0, 1, 0, 0,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?
        )`

        params.push(
          trimmedSerial, 'ITU', '', startDate, endDate, clientIp, regUser.trim(), regRequest.trim(), customer.trim(), projectName.trim(), customerEmail.trim(), 
          fw, vpn, s2, dpi, av, as, ot
        );
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

    const totalCount = filteredRows.length;
    const failedCount = failedRows.length;
    const successCount = totalCount - failedCount;

    if (failedRows.length > 0) {
      // 헤더에 "실패 사유" 컬럼 추가
      const extendedHeader = [...header, '실패 사유'];

      // 실패한 행들과 함께 CSV 콘텐츠 생성
      const failedCsv = stringify([extendedHeader, ...failedRows], { delimiter: ',' });

      // base64 인코딩
      const base64Csv = Buffer.from(failedCsv).toString('base64');

      return NextResponse.json({
        message: `등록 완료: 전체 ${totalCount}건 중 성공 ${successCount}건, 실패 ${failedCount}건`,
        failedCsvBase64: base64Csv,
      }, { status: 200 });
    }
    return NextResponse.json({ message: `업로드 성공: 전체 ${totalCount}건 모두 처리 완료` }, { status: 200 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: '업로드 처리 중 오류 발생' }, { status: 500 });
  }
}