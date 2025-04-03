import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/db/database";
import { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { ValidID, ValidPW, ValidName, ValidPhone, ValidEmail } from "../validation";
import { auth } from "@/auth";

// admin 테이블 조회
export async function GET(req: Request) {
  // (Server Only) 요청 URL에서 mode, id 파라미터 추출
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const id = searchParams.get("id");

  // 아이디 중복 체크
  if (mode === 'checkId') {
    try {
      const rows = (await query("SELECT COUNT(*) as count FROM admin WHERE id = ?", [id]) as RowDataPacket[]);
      const count = rows[0]?.count || 0;
  
      return NextResponse.json( count > 0 ); // 중복 O : true, 중복 X : flase
    } catch (e) {
      return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
  }

  // admin 목록
  else if (mode === 'adminList') {
    try {
      const session = await auth();

      // 세션 없거나 슈퍼 관리자가 아닐 경우 권한 에러 반환
      if (!session || session.user.role !== 3) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
      }

      // admin 목록 조회
      const results = await query("SELECT * FROM admin");
      
      return NextResponse.json(results);
    } catch (error) {
      return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
}

// 관리자 추가
export async function POST(req: NextRequest) {
  // 관리자 추가에 필요한 ID, 이름, 연락처, 이메일, 비밀번호, 권한 추출
  const data = await req.json();
  const { id, role, name, phone, email, passwd } = data;
  
  // 유효성 검사
  const idCheck = ValidID(id);
  const pwCheck = ValidPW(passwd);
  const nameCheck = ValidName(name);
  const phoneCheck = ValidPhone(phone);
  const emailCheck = ValidEmail(email);

  // 유효성 검사 실패 시 오류 응답 반환
  if (isNaN(Number(role))) return NextResponse.json({ success: false, error: "권한(role)이 잘못되었습니다." }, { status: 400 });
  if (idCheck !== true) return NextResponse.json({ success: false, error: idCheck }, { status: 400 });
  if (pwCheck !== true) return NextResponse.json({ success: false, error: pwCheck }, { status: 400 });
  if (nameCheck !== true) return NextResponse.json({ success: false, error: nameCheck }, { status: 400 });
  if (phoneCheck !== true) return NextResponse.json({ success: false, error: phoneCheck }, { status: 400 });
  if (emailCheck !== true) return NextResponse.json({ success: false, error: emailCheck }, { status: 400 });
  
  // 관리자 추가
  try {
    // 비밀번호 해시 처리
    const hashedPw = await bcrypt.hash(passwd, 10);

    // admin 테이블에 저장
    await query(
      "INSERT INTO admin (role, status, id, name, phone, email, passwd) VALUES (?, 1, ?, ?, ?, ?, ?)",
      [role, id, name || null, phone || null, email || null, hashedPw]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "DB 오류" }, { status: 500 });
  }
}

// 관리자 수정
export async function PUT(req: NextRequest) {
  // 관리자 수정에 필요한 ID, 권한, 이름, 연락처, 이메일, 비밀번호, 계정 활성화 상태 추출
  const data = await req.json();
  const { id, role, name, phone, email, passwd, status } = data;

  try {
    // 기존 정보 불러오기
    const rows  = (await query("SELECT * FROM admin WHERE id = ?", [id]) as RowDataPacket[]);
    const existing = rows[0];

    // 기존 정보 없음
    if (!existing) {
      return NextResponse.json({ success: false, error: "해당 ID의 관리자가 존재하지 않습니다." }, { status: 404 });
    }

    // 업데이트할 필드와 값을 저장할 배열
    const updates: string[] = [];
    const values: any[] = [];

    // role이 숫자이고 기존 값과 다르면 updates와 values에 추가
    if (!isNaN(Number(role)) && Number(role) !== existing.role) {
      updates.push("role = ?");
      values.push(Number(role));
    }

    // status가 숫자이고 기존 값과 다르면 updates와 values에 추가
    if (!isNaN(Number(status)) && Number(status) !== existing.status) {
      updates.push("status = ?");
      values.push(Number(status));
    }

    // 이름 변경이 있는 경우 유효성 검사 후 추가
    if (name !== undefined && name !== existing.name) {
      const nameCheck = ValidName(name);
      if (nameCheck !== true) return NextResponse.json({ success: false, error: nameCheck }, { status: 400 });
      updates.push("name = ?");
      values.push(name);
    }
    
    // 연락처 변경이 있는 경우 유효성 검사 후 추가
    if (phone !== undefined && phone !== existing.phone) {
      const phoneCheck = ValidPhone(phone);
      if (phoneCheck !== true) return NextResponse.json({ success: false, error: phoneCheck }, { status: 400 });
      updates.push("phone = ?");
      values.push(phone);
    }
    
    // 이메일 변경이 있는 경우 유효성 검사 후 추가
    if (email !== undefined && email !== existing.email) {
      const emailCheck = ValidEmail(email);
      if (emailCheck !== true) return NextResponse.json({ success: false, error: emailCheck }, { status: 400 });
      updates.push("email = ?");
      values.push(email);
    }

    // 비밀번호 변경이 있는 경우 유효성 검사 및 해시 후 추가
    if (passwd) {
      const isSame = await bcrypt.compare(passwd, existing.passwd); // 입력된 비밀번호가 기존 비밀번호와 같은지 확인(같으면 업데이트 안 함)

      if (!isSame) {
        const pwCheck = ValidPW(passwd);
        if (pwCheck !== true) {
          return NextResponse.json({ success: false, error: pwCheck }, { status: 400 });
        }
        const hashedPw = await bcrypt.hash(passwd, 10);
        updates.push("passwd = ?");
        values.push(hashedPw);
      }
    }

    // 변경할 내용이 하나도 없는 경우
    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "변경된 정보가 없습니다." }, { status: 400 });
    }

    // 최종 업데이트 쿼리 실행
    const queryStr = `UPDATE admin SET ${updates.join(", ")} WHERE id = ?`;
    values.push(id);

    await query(queryStr, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("관리자 수정 오류:", error);
    return NextResponse.json({ success: false, error: "DB 오류" }, { status: 500 });
  }
}

// 관리자 삭제
export async function DELETE(req: NextRequest) {
  try {
    // 로그인한 관리자 세션 정보
    const session = await auth();
    // 삭제할 ID 추출
    const { ids } = await req.json();

    // ID 배열이 없거나 형식이 잘못된경우 예외 처리
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: '삭제할 ID가 없습니다.' }, { status: 400 });
    }

    // sql 쿼리에 사용할 문자열 생성
    const placeholders = ids.map(() => '?').join(',');

    // 삭제할 ID 목록 기반으로 admin 테이블에서 삭제
    const sql = `DELETE FROM admin WHERE id IN (${placeholders})`;
    await query(sql, ids);

    // 삭제 대상에 로그인한 관리자 계정이 포함되어 있는지 확인
    const deletedSelf = session?.user?.id && ids.includes(session.user.id);

    return NextResponse.json({ success: true, deletedSelf });
  } catch (error) {
    console.error('관리자 삭제 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
