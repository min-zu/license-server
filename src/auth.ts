// Auth.js (NextAuth.js v5)
import NextAuth from "next-auth";
import "next-auth/jwt"
import Credentials from "next-auth/providers/credentials";

// 비밀번호 암호화
import bcrypt from "bcryptjs";

// 유효성 검사
import { ValidID, ValidPW } from "@/app/api/validation"

// DB
import { query } from "@/app/db/database";
import { RowDataPacket } from "mysql2/promise"; // 타입

// Auth.js User, Session, JWT 타입 확장
declare module "next-auth" {
  interface User {
    role: number;
    status: number;
    phone?: string;
    login_ts?: string;
  }

  interface Session {
    user: {
      role: number;
      status: number;
      id: string;
      name?: string;
      phone?: string;
      email?: string;
      login_ts?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: number;
    status: number;
    phone?: string;
    login_ts?: string;
  }
}

// Auth.js 핸들러 및 함수 추출
export const { handlers, signIn, signOut, auth } = NextAuth({
  // 로그인 방식 : Credentials Provider 사용 (커스텀 로그인)
  providers: [
    Credentials({
      credentials: {
        id:{},
        password: {},
      },
      // 로그인 프로세스
      authorize: async (credentials) => {
        // 유효성 검사
        const idCheck = ValidID(credentials?.id);
        const pwCheck = ValidPW(credentials?.password);
        if (idCheck !== true) return null;
        if (pwCheck !== true) return null;

        // db 조회
        const users = (await query("SELECT * FROM admin WHERE id = ?", [credentials.id])) as RowDataPacket[] & {passwd: string};

        // db 조회 후 사용자 정보 없음
        if (users.length === 0) {
          return null;
        }

        // 비밀번호 검증
        const passwordMatch = await bcrypt.compare(credentials.password as string, users[0].passwd);

        // 비밀번호 검증 실패
        if (!passwordMatch) {
          return null;
        }

        // 로그인 성공 시 로그인 시간 업데이트
        await query("UPDATE admin SET login_ts = NOW() WHERE id = ?", [users[0].id]);
        
        // 로그인 성공 시 세션에 저장할 사용자 정보 반환
        return {
          role: users[0].role,
          status: users[0].status,
          id: users[0].id,
          name: users[0].name,
          phone: users[0].phone,
          email: users[0].email,
          login_ts: users[0].login_ts,
        };
      }
    })
  ],
  // 세션 설정 (JWT 기반)
  session: {
    strategy: "jwt", // JWT 기반 세션
    maxAge: 900, // 세션 유효 시간: 900초 (15분)
  },
  callbacks: {
    // JWT 콜백 함수: 로그인 성공 또는 세션 갱신 시 토큰 데이터를 설정하거나 갱신 
    async jwt({ token, user, trigger }) {
       // 로그인 성공 시: 토큰에 사용자 정보 저장
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.sub = user.id;
        token.name = user.name;
        token.phone = user.phone;
        token.email = user.email;
        token.login_ts = user.login_ts;
        return token;
      }
      
      // 세션 갱신 시 (trigger: 'update'): DB에서 최신 사용자 정보 조회로 토큰 갱신
      if (trigger === 'update') {
        const rows = (await query("SELECT * FROM admin WHERE id = ?", [token.sub]) as RowDataPacket[]);
        const updated = rows[0];

        if (updated) {
          token.role = updated.role;
          token.status = updated.status;
          token.name = updated.name;
          token.phone = updated.phone;
          token.email = updated.email;
          token.login_ts = updated.login_ts;
        }
      }
      return token;
    },
    // 세션 콜백 함수: JWT 토큰 정보를 클라이언트로 반환될 세션 객체에 저장
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.status = token.status;
      session.user.id = token.sub!;
      session.user.name = token.name ?? "";
      session.user.phone = token.phone ?? "";
      session.user.email = token.email ?? "";
      session.user.login_ts = token.login_ts;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});