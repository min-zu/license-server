import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ValidID, ValidPW } from "@/app/api/auth/login/validation"
import { query } from "@/app/db/database";
import { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        id:{},
        password: {},
      },
      authorize: async (credentials) => {
        const idCheck = ValidID(credentials?.id);
        const pwCheck = ValidPW(credentials?.password);
        if (idCheck !== true) return null;
        if (pwCheck !== true) return null;
        console.log("서버 유효성 검사(id, passwd):",{idCheck, pwCheck});

        const users = (await query("SELECT * FROM admin WHERE id = ?", [credentials.id])) as RowDataPacket[] & {pw: string};
        console.log("조회된 사용자:", users);

        if (users.length === 0) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password as string, users[0].pw);
        console.log("비밀번호 검증:", passwordMatch);

        if (!passwordMatch) {
          console.log("비밀번호 불일치");
          return null;
        }

        return {
          id: users[0].id,
          name: users[0].name,
          pw_expiry: users[0].pw_expiry,
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
});