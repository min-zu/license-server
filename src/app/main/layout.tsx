// Next.js
import { redirect } from "next/navigation";

// Auth.js (NextAuth.js)
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

// 컴포넌트
import SessionChecker from "../components/SessionChecker"; // 세션관리
import Header from "../components/header"; // 헤더


export default async function mainLayout({ children }: { children: React.ReactNode }) {
  // 세션 유무 확인
  const session = await auth();
  
  // 세션이 없으면 로그인페이지 이동
  if(!session) {
    redirect("/login");
  }
  return (
    <SessionProvider>
      <SessionChecker>
        <Header/>
        {children}
      </SessionChecker>
    </SessionProvider>
  );
}