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
  // console.log('data', data);
  const license_key = generateLicenseKey(data);

  // console.log('license_key', license_key);
//   const url = new URL(params.url); 
//   const hardwareCode = url.searchParams.get('hardwareCode'); 
//   const softwareOpt = url.searchParams.get('softwareOpt'); 
}
