import { auth } from '@/auth';
import { NextResponse } from 'next/server';


export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // 모든 페이지에서 캐시 방지 헤더 설정
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');

  // 세션이 있는데 로그인 페이지 접근 시 메인 페이지로 리다이렉트
  if (req.auth && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/main', req.url));
  }

  // role이 3이 아닌 경우 /main/admin 접근 제한
  if (req.auth && req.auth.user.role !== 3 && pathname.startsWith('/main/admin')) {
    const referer = req.headers.get('referer'); // 'referer' 헤더를 사용하여 이전 페이지로 리다이렉트
    const redirectUrl = referer ? referer : '/main'; // referer가 없으면 기본값으로 '/main'
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return response;
});

export const config = {
  matcher: [
    '/:path*'
  ],
};
