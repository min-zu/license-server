import { NextResponse, NextRequest } from "next/server";
import { query } from "@/app/db/database";

export async function PUT(request: NextRequest) {
  // 라이센스 수정 로직
  try {
    const body = await request.json();
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

    if (!initCode) {
      return NextResponse.json({ error: "initCode is required" }, { status: 400 });
    }
    
    const updateQuery = `
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

    await query(updateQuery, [
      softwareOpt.FW,
      softwareOpt.VPN,
      softwareOpt["SSL"] ?? softwareOpt["행안부"], // 둘 중 하나 사용
      softwareOpt["IPS"] ?? softwareOpt["DPI"],   // 둘 중 하나 사용
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
    ]);

    return NextResponse.json({ message: "라이선스 업데이트 완료" });
  } catch (error) {
    console.error("업데이트 오류:", error);
    return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  }
}
