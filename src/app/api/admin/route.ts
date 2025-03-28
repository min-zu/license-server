import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/db/database";
import { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { ValidID, ValidPW, ValidName, ValidPhone, ValidEmail } from "../validation";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const id = searchParams.get("id");

  if (mode === 'check-id') {
    try {
      const rows = (await query("SELECT COUNT(*) as count FROM admin WHERE id = ?", [id]) as RowDataPacket[]);
      const count = rows[0]?.count || 0;
  
      return NextResponse.json( count > 0 ); // 중복 O : true, 중복 X : flase
    } catch (e) {
      console.error("ID 중복 검사 오류:", e);
      return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
  }
  else if (mode === 'list') {
    try {
      const results = await query("SELECT * FROM admin");
      return NextResponse.json(results);
    } catch (error) {
      console.error('DB 오류:', error);
      return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const mode = data.mode;

  if (mode === "add-admin") {
    const role = Number(data.role);
    const { id, name, phone, email, passwd } = data;

    const idCheck = ValidID(id);
    const pwCheck = ValidPW(passwd);
    const nameCheck = ValidName(name);
    const phoneCheck = ValidPhone(phone);
    const emailCheck = ValidEmail(email);

    if (isNaN(role)) return NextResponse.json({ success: false, error: "권한(role)이 잘못되었습니다." }, { status: 400 });
    if (idCheck !== true) return NextResponse.json({ success: false, error: idCheck }, { status: 400 });
    if (pwCheck !== true) return NextResponse.json({ success: false, error: pwCheck }, { status: 400 });
    if (nameCheck !== true) return NextResponse.json({ success: false, error: nameCheck }, { status: 400 });
    if (phoneCheck !== true) return NextResponse.json({ success: false, error: phoneCheck }, { status: 400 });
    if (emailCheck !== true) return NextResponse.json({ success: false, error: emailCheck }, { status: 400 });
    

    try {
      const hashedPw = await bcrypt.hash(passwd, 10);

      await query(
        "INSERT INTO admin (role, status, id, name, phone, email, passwd) VALUES (?, 1, ?, ?, ?, ?, ?)",
        [role, id, name || null, phone || null, email || null, hashedPw]
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("관리자 추가 오류:", error);
      return NextResponse.json({ success: false, error: "DB 오류" }, { status: 500 });
    }
  }
  
  else if (mode === 'update-admin') {

  }
  
  return NextResponse.json({ success: false, error: "유효하지 않은 mode입니다." }, { status: 400 });
}