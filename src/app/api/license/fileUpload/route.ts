import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/app/db/database'; // DB 쿼리 유틸
import { generateLicenseKey } from '@/app/utils/licenseUtils'; // 라이센스 생성 유틸
import { writeFile } from 'fs/promises';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('uploadFile') as File;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile('/tmp/upload_license.csv', buffer);

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
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim();

    for(let i = 0; i < filteredRows.length; i++) {
      const row = filteredRows[i];
      const trimmedRow = row.map(item => item.replace(/\r?\n|\r/g, '').trim());

      // 기본 필드 (앞쪽 공통 필드 9개)
      const [
        hardwareStatus,
        hardwareCode,
        limitTimeStart,
        limitTimeEnd,
        issuer,
        manager,
        cpuName,
        siteName,
        cfid,
        ...options // 나머지 옵션 필드들은 배열로 받음
        // initCode
      ] = trimmedRow;

      let [fw, vpn, 행안부, ssl, dpi, ips, waf, av, as, tracker] = ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0'];

      if(hardwareStatus.toUpperCase() === 'ITU') {
        [fw, vpn, 행안부, dpi, av, as] = options;
      } else {
        [fw, vpn, ssl, ips, waf, av, as, tracker] = options;
      }

      const trimmed = hardwareCode.trim();
      const codes = trimmed.split('-').length >= 3;

      if(!hardwareStatus.toUpperCase().includes('ITU') && !hardwareStatus.toUpperCase().includes('ITM') && !hardwareStatus.toUpperCase().includes('SMC') && !hardwareStatus.toUpperCase().includes('XTM')) {
        return NextResponse.json({ message: `${i + 1}행 장비선택 입력` }, { status: 400 });
      }

      if(codes && trimmed.length < 22) {
        return NextResponse.json({ message: `${i + 1}행 시리얼 [${hardwareCode}] 22자 이상 입력` }, { status: 400 });
      } else if(!codes && trimmed.length !== 24) {
        return NextResponse.json({ message: `${i + 1}행 시리얼 [${hardwareCode}] 24자 입력` }, { status: 400 });
      }

      const rowCheck = await query("SELECT COUNT(*) as cnt FROM license WHERE hardware_code = ?;", [hardwareCode]);
      if(Number(rowCheck[0].cnt) > 0) {
        return NextResponse.json({ message: `${i + 1}행 시리얼 [${hardwareCode}] 중복` }, { status: 400 });
      }

      if (limitTimeStart.length !== 8 || limitTimeEnd.length !== 8) {
        return NextResponse.json({ message: `${i + 1}행 유효기간 오류` }, { status: 400 });
      }

      if(manager === '') {
        return NextResponse.json({ message: `${i + 1}행 발급요청사 입력` }, { status: 400 });
      }

      if(cpuName === '') {
        return NextResponse.json({ message: `${i + 1}행 프로젝트/CPU명 입력` }, { status: 400 });
      }

      if(siteName === '') {
        return NextResponse.json({ message: `${i + 1}행 고객사명명 입력` }, { status: 400 });
      }

      if(cfid === '') {
        return NextResponse.json({ message: `${i + 1}행 고객사 E-mail/CFID 입력` }, { status: 400 });
      }

      // if(initCode === '') {
      //   return NextResponse.json({ message: `${i + 1}행 하드웨어 인증키 입력` }, { status: 400 });
      // }

      for(let j = 0; j < options.length; j++) {
        if(options[j] === '') options[j] = '0';
      }
      
      let sql = '';
      const params = [];
      
      if(hardwareStatus.toUpperCase() === 'ITU') {
        const license_key = await generateLicenseKey({hardwareStatus, hardwareCode, softwareOpt: {fw, vpn, dpi, av, as, 행안부}, limitTimeStart, limitTimeEnd, issuer, manager, cpuName, siteName, cfid});
  
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
            hardwareCode, hardwareStatus, '', limitTimeStart, limitTimeEnd, clientIp, license_key, issuer, manager, siteName, cpuName, cfid, 
            0, fw, vpn, dpi, 행안부, 0, 0, av, as, 0
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
            hardwareCode, hardwareStatus, '', limitTimeStart, limitTimeEnd, clientIp, issuer, manager, siteName, cpuName, cfid, 
            0, fw, vpn, dpi, 행안부, 0, 0, av, as, 0
          );
        }
      }else{
        const license_key = await generateLicenseKey({hardwareStatus, hardwareCode, softwareOpt: {fw, vpn, ssl, ips, waf, av, as}, limitTimeStart, limitTimeEnd, issuer, manager, cpuName, siteName, cfid});
  
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
            hardwareCode, hardwareStatus, '', limitTimeStart, limitTimeEnd, clientIp, license_key, issuer, manager, siteName, cpuName, cfid, 
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
            hardwareCode, hardwareStatus, '', limitTimeStart, limitTimeEnd, clientIp, issuer, manager, siteName, 
            0, fw, vpn, ssl, ips, 0, waf, av, as, tracker
          );
        }
      }
      await fs.appendFile(
        '/tmp/upload_log',
        `[${new Date().toISOString()}] SQL: ${sql}\nPARAMS: ${JSON.stringify(params)}\n\n`
      );
      await query(sql, params);
    }
    return NextResponse.json({ message: '업로드 성공' }, { status: 200 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: '업로드 처리 중 오류 발생' }, { status: 500 });
  }
}