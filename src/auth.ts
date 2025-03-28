import NextAuth from "next-auth";
import "next-auth/jwt"
import Credentials from "next-auth/providers/credentials";
import { ValidID, ValidPW } from "@/app/api/validation"
import { query } from "@/app/db/database";
import { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";


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

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        id:{},
        password: {},
      },
      // 로그인 프로세스
      authorize: async (credentials) => {
        const idCheck = ValidID(credentials?.id);
        const pwCheck = ValidPW(credentials?.password);
        if (idCheck !== true) return null;
        if (pwCheck !== true) return null;
        console.log("서버 유효성 검사(id, passwd):",{idCheck, pwCheck});

        const users = (await query("SELECT * FROM admin WHERE id = ?", [credentials.id])) as RowDataPacket[] & {passwd: string};

        if (users.length === 0) {
          console.log("사용자 정보 없음");
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password as string, users[0].passwd);
        console.log("비밀번호 검증:", passwordMatch);

        if (!passwordMatch) {
          console.log("비밀번호 불일치");
          return null;
        }

        console.log("로그인 성공:", users[0]);
        
        return {
          role: users[0].role,
          status: users[0].status,
          id: users[0].id,
          name: users[0].name,
          email: users[0].email,
          login_ts: users[0].login_ts,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 900,
    updateAge: 300,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.sub = user.id;
        token.name = user.name;
        token.phone = user.phone;
        token.email = user.email;
        token.login_ts = user.login_ts;
      }
      console.log("JWT", token);
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.status = token.status;
      session.user.id = token.sub!;
      session.user.name = token.name ?? "";
      session.user.phone = token.phone ?? "";
      session.user.email = token.email ?? "";
      session.user.login_ts = token.login_ts;
      console.log("Session", session);
      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl + "/main";
    },
  },
  pages: {
    signIn: "/login",
  },
});