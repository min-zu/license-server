import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/login');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicAsset = pathname.startsWith('/_next') || pathname.includes('.');

  // 세션이 없는 경우 로그인 페이지 제외한 모든 페이지 접근 시 로그인페이지로 리다이렉트
  if (!session && !isAuthPage && !isApiRoute && !isPublicAsset) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('timedout', 'true');
    return NextResponse.redirect(loginUrl);
  }

  // 세션이 있는 경우 로그인 페이지 접근 시 메인으로 리다이렉트
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/main', request.url));
  }

  // role이 3 (슈퍼 관리자)가 아닌 경우, /main/admin 접근 제한
  if (pathname.startsWith('/main/admin')) {
    const role = session?.user?.role;

    if (role !== 3) {
      const referer = request.headers.get('referer');
      return NextResponse.redirect(referer ? referer : new URL('/main', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/:path*'
  ],
};
