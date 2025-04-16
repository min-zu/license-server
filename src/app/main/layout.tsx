import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import SessionChecker from "../components/SessionChecker";
import Header from "../components/header";
import { redirect } from "next/navigation";

export default async function mainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
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