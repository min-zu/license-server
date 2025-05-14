// Next.js
import { NextResponse, NextRequest } from "next/server";

// DB
import { query } from "@/app/db/database";

// exec(shell 명령 실행)을 async/await 방식으로 사용하기 위한 모듈 임포트
import { exec } from 'child_process';
import { promisify } from "util";

import fs from "fs/promises";


// exec 함수를 Promise 기반으로 변환하여 async/await 사용 가능하게 함
const execAsync = promisify(exec);

// License 정보 업데이트 처리
export async function PUT(request: NextRequest) {
  try {
    // 요청 본문(JSON) 파싱
    const body = await request.json();
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(":").pop() || null;

    // body에서 필요한 값들을 꺼냄
    const {
      softwareOpt,
      limitTimeStart,
      limitTimeEnd,
      regUser,
      regRequest,
      projectName,
      customer,
      customerEmail,
      hardwareSerial,
      hardwareCode,
    } = body;

    // 필수값 검사: initCode가 없으면 error
    if (!hardwareSerial) {
      return NextResponse.json({ error: "serialCode is required" }, { status: 400 });
    }

    // 기존 데이터 조회
    const rows = await query("SELECT hardware_status, hardware_serial, hardware_code, limit_time_start, limit_time_end, license_fw, license_vpn, license_s2, license_dpi, license_av, license_as, license_ot FROM license WHERE hardware_serial = ?", [hardwareSerial]);
    const currentData = rows[0];

    // DB에서 불러온 date타입 한국시간 YYYY-MM-DD 형식으로 변환
    const kstStartDate = new Date(currentData.limit_time_start).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'});
    const kstEndDate = new Date(currentData.limit_time_end).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'});
    
    // ITU 장비 여부 판단: 기존데이터의 hardware_status값이 ITU 거나 시리얼번호가 ITU로 시작할떄
    const isITU = (currentData.hardware_status == 'ITU') || (hardwareSerial.startsWith('ITU'));

    // 라이선스 키 재발급 해야하는지 확인
    const isSoftwareOptChanged = 
      Number(currentData.license_fw) !== softwareOpt.FW ||
      Number(currentData.license_vpn) !== softwareOpt.VPN ||
      Number(currentData.license_s2) !== softwareOpt.S2 ||
      Number(currentData.license_dpi) !== softwareOpt.DPI ||
      Number(currentData.license_av) !== softwareOpt.AV ||
      Number(currentData.license_as) !== softwareOpt.AS ||
      Number(currentData.license_ot) !== softwareOpt.OT;

    const isLimitTimeStartChanged = kstStartDate !== limitTimeStart;

    const isLimitTimeEndChanged = kstEndDate !== limitTimeEnd;

    const needReissue = isSoftwareOptChanged || isLimitTimeStartChanged || isLimitTimeEndChanged;

    // 3. 다르면(needReissue값이 true면) 라이선스 키 새로 발급
    let newLicenseKey = null;
    if (needReissue) {
      if (isITU) {
        const functionMap = 
          (Number(softwareOpt.FW) || 0) * 1 + // option 1
          (Number(softwareOpt.VPN) || 0) * 2 + // option 2
          (Number(softwareOpt.DPI) || 0) * 4 + // option 4
          (Number(softwareOpt.AV) || 0) * 8 + // option 7
          (Number(softwareOpt.AS) || 0) * 16 + // option 8
          (Number(softwareOpt.S2) || 0) * 32 + // option 3
          (Number(softwareOpt.OT) || 0) * 64; // option 9
        
        const [y, m, d] = limitTimeEnd.split("-").map(Number);
        const expireDate = new Date(y, m - 1, d, 0, 0, 0).getTime()/1000;
        const hex_expire = Math.floor(expireDate).toString(16);

        const cmd = `/home/future/license/license ${hardwareSerial} ${functionMap} ${hex_expire}`;
        const result = await execAsync(cmd);
        const _ituKey = result.stdout.replace(/\n/g, '');

        // const _ituKey = "addtestITU123hardwardCode456";

        newLicenseKey = typeof _ituKey === 'string' ? _ituKey : null;

        // Log
        const logPath = "/home/future/license/log/edit_itulicense.log";
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

      else if(hardwareSerial.split('-').length >= 3){
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
        newLicenseKey = typeof _itmKey === 'string' ? _itmKey : null;

        // Log
        const logPath = "/home/future/license/log/edit_itmlicense.log";
        const logContent =
`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}]
serial_num: ${hardwareSerial}
hardware_key: ${hardwareCode}
limit_time_st: ${limitTimeStart}
limit_time_end: ${limitTimeEnd}
${cmd}

`;
        try {
          await fs.appendFile(logPath, logContent)
        } catch (error) {
          console.error("log 파일 생성 실패: ", error);
        }
      }
    }
    

    // 초기화
    let updateQuery = "";
    let queryParams: any[] = [];

    const isNewLicenseKey = Boolean(newLicenseKey);

    if (isNewLicenseKey) {
      if (isITU) {
        updateQuery = `
          UPDATE license
          SET
            limit_time_start = ?,
            limit_time_end = ?,
            license_fw = ?,
            license_vpn = ?,
            license_s2 = ?,
            license_dpi = ?,
            license_av = ?,
            license_as = ?,
            license_ot = ?,
            license_date = now(),
            license_key = ?,
            ip = ?,
            reg_user = ?,
            reg_request = ?,
            customer = ?,
            project_name = ?,
            customer_email = ?
          WHERE hardware_serial = ?
        `;
  
        queryParams = [
          limitTimeStart,
          limitTimeEnd,
          softwareOpt.FW,
          softwareOpt.VPN,
          softwareOpt.S2,
          softwareOpt.DPI,
          softwareOpt.AV,
          softwareOpt.AS,
          softwareOpt.OT,
          newLicenseKey,
          clientIp,
          regUser,
          regRequest,
          customer,
          projectName,
          customerEmail,
          hardwareSerial,
        ];
      }
      //ITU 제외 다른 장비일 경우: cpu_name, cfid는 제외
      else {
        updateQuery = `
          UPDATE license
          SET
            limit_time_start = ?,
            limit_time_end = ?,
            license_fw = ?,
            license_vpn = ?,
            license_s2 = ?,
            license_dpi = ?,
            license_av = ?,
            license_as = ?,
            license_ot = ?,
            license_date = now(),
            license_key = ?,
            ip = ?,
            reg_user = ?,
            reg_request = ?,
            customer = ?
          WHERE hardware_serial = ?
        `;
  
        queryParams = [
          limitTimeStart,
          limitTimeEnd,
          softwareOpt.FW,
          softwareOpt.VPN,
          softwareOpt.S2,
          softwareOpt.DPI,
          softwareOpt.AV,
          softwareOpt.AS,
          softwareOpt.OT,
          newLicenseKey,
          clientIp,
          regUser,
          regRequest,
          customer,
          hardwareSerial,
        ];
      }
    }
    else {
      // ITU 장비일 경우
      if (isITU) {
        updateQuery = `
          UPDATE license
          SET
            limit_time_start = ?,
            limit_time_end = ?,
            license_fw = ?,
            license_vpn = ?,
            license_s2 = ?,
            license_dpi = ?,
            license_av = ?,
            license_as = ?,
            license_ot = ?,
            ip = ?,
            reg_user = ?,
            reg_request = ?,
            customer = ?,
            project_name = ?,
            customer_email = ?
          WHERE hardware_serial = ?
        `;

        queryParams = [
          limitTimeStart,
          limitTimeEnd,
          softwareOpt.FW,
          softwareOpt.VPN,
          softwareOpt.S2,
          softwareOpt.DPI,
          softwareOpt.AV,
          softwareOpt.AS,
          softwareOpt.OT,
          clientIp,
          regUser,
          regRequest,
          customer,
          projectName,
          customerEmail,
          hardwareSerial,
        ];
      }

      //ITU 제외 다른 장비일 경우: cpu_name, cfid는 제외
      else {
        updateQuery = `
          UPDATE license
          SET
            limit_time_start = ?,
            limit_time_end = ?,
            license_fw = ?,
            license_vpn = ?,
            license_s2 = ?,
            license_dpi = ?,
            license_av = ?,
            license_as = ?,
            license_ot = ?,
            ip = ?,
            reg_user = ?,
            reg_request = ?,
            customer = ?
          WHERE hardware_serial = ?
        `;

        queryParams = [
          limitTimeStart,
          limitTimeEnd,
          softwareOpt.FW,
          softwareOpt.VPN,
          softwareOpt.S2,
          softwareOpt.DPI,
          softwareOpt.AV,
          softwareOpt.AS,
          softwareOpt.OT,
          clientIp,
          regUser,
          regRequest,
          customer,
          hardwareSerial,
        ];
      }
    }

    // DB에 업데이트 실행
    await query(updateQuery, queryParams);

    // 업데이트 후, 최신 데이터 조회
    const updatedRows = await query(
      `SELECT * FROM license WHERE hardware_serial = ?`,
      [hardwareSerial]
    );

    const response: any = {
      message: "라이선스 업데이트 완료",
      updated: updatedRows
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("업데이트 오류:", error);
    return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  }
}
