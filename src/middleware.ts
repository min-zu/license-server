import { auth } from "@/auth";


export { auth as middleware };
  
export const config = {
  matcher: "/:path"
  // matcher: "/((?!login).*)"
};