// NextAuth(v5) 핸들러: /api/auth 경로에서 인증 관련 GET, POST 요청 처리
import { handlers } from "@/auth"


// /api/auth 엔드포인트에서 GET(세션 조회 등) 및 POST(로그인 등) 요청을 처리할 수 있도록 NextAuth 핸들러 연결
export const { GET, POST } = handlers;