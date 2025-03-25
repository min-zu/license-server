import { auth } from "@/auth";
import Header from "../components/header";
import { redirect } from "next/navigation";

export default async function mainLayout({ children }: { children: React.ReactNode }) {
  // const session = await auth();
  // if(!session) {
  //   redirect("/login");
  // }
  return (
    <div>
      <div>
        <Header/>
      </div>
      {children}
    </div>
  );
}