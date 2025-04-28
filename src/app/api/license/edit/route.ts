// Next.js
import { NextResponse, NextRequest } from "next/server";

// DB
import { query } from "@/app/db/database";


// License 정보 업데이트 처리
export async function PUT(request: NextRequest) {
  try {
    // 요청 본문(JSON) 파싱
    const body = await request.json();

    // body에서 필요한 값들을 꺼냄
    const {
      softwareOpt,
      limitTimeStart,
      limitTimeEnd,
      issuer,
      manager,
      cpuName,
      siteName,
      cfid,
      initCode,
    } = body;

    // 필수값 검사: initCode가 없으면 error
    if (!initCode) {
      return NextResponse.json({ error: "initCode is required" }, { status: 400 });
    }
    
    // ITU 장비 여부 판단: 수정사항에 cpuName과 cfid가 있으면 ITU (ITU가 아닐때 cpuName과 cfid 수정 안함)
    const isITU = "cpuName" in body && "cfid" in body;

    // 초기화
    let updateQuery = "";
    let queryParams: any[] = [];

    // ITU 장비일 경우: cpu_name, cfid 포함 쿼리
    if (isITU) {
      updateQuery = `
        UPDATE license
        SET
          license_fw = ?,
          license_vpn = ?,
          license_ssl = ?,
          license_ips = ?,
          license_waf = ?,
          license_av = ?,
          license_as = ?,
          license_tracker = ?,
          limit_time_st = ?,
          limit_time_end = ?,
          issuer = ?,
          manager = ?,
          cpu_name = ?,
          site_nm = ?,
          cfid = ?
        WHERE init_code = ?
      `;

      queryParams = [
        softwareOpt.FW,
        softwareOpt.VPN,
        softwareOpt["행안부"],
        softwareOpt["DPI"],
        softwareOpt.WAF,
        softwareOpt.AV,
        softwareOpt.AS,
        softwareOpt.Tracker,
        limitTimeStart,
        limitTimeEnd,
        issuer,
        manager,
        cpuName,
        siteName,
        cfid,
        initCode,
      ];
    }

    //ITU 제외 다른 장비일 경우: cpu_name, cfid는 제외
    else {
      updateQuery = `
        UPDATE license
        SET
          license_fw = ?,
          license_vpn = ?,
          license_ssl = ?,
          license_ips = ?,
          license_waf = ?,
          license_av = ?,
          license_as = ?,
          license_tracker = ?,
          limit_time_st = ?,
          limit_time_end = ?,
          issuer = ?,
          manager = ?,
          site_nm = ?
        WHERE init_code = ?
      `;

      queryParams = [
        softwareOpt.FW,
        softwareOpt.VPN,
        softwareOpt["SSL"],
        softwareOpt["IPS"],
        softwareOpt.WAF,
        softwareOpt.AV,
        softwareOpt.AS,
        softwareOpt.Tracker,
        limitTimeStart,
        limitTimeEnd,
        issuer,
        manager,
        siteName,
        initCode,
      ];
    }

    // DB에 업데이트 실행
    await query(updateQuery, queryParams);

    return NextResponse.json({ message: "라이선스 업데이트 완료" });
  } catch (error) {
    console.error("업데이트 오류:", error);
    return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  }
}
