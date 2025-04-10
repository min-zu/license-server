'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SessionChecker({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allowRender, setAllowRender] = useState(false); 

  // 1. 외부 이동 시 unload 기록
  useEffect(() => {
    const handleUnload = () => {
      sessionStorage.setItem('wasExternal', 'true')
    }

    window.addEventListener('unload', handleUnload)
    return () => window.removeEventListener('unload', handleUnload)
  }, [])

  useEffect(() => {
    const checkAndSignOut = async () => {
      const navEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const navType = navEntry?.type
      const isLogin = document.cookie.includes("loginInit=true");
      const wasExternal = sessionStorage.getItem('wasExternal') === 'true'
      
      // 주소창에 url 직접 입력 + loginInit 쿠키 없음 -> 로그아웃
      if (navType === 'navigate' && !isLogin) {
        sessionStorage.setItem('loginToast', 'forced');
        await signOut({ callbackUrl: '/login' });
        return;
      }

      // unload일때 새로고침인지 외부사이트인지 판단
      if (wasExternal) {
        if (navType === 'reload') {
          // 새로고침 후 뒤로가기인 경우 → 기록만 제거하고 통과
          sessionStorage.removeItem('wasExternal');
        } else if (navType === 'back_forward') {
          // 외부에서 뒤로가기 복귀한 경우 → 로그아웃
          sessionStorage.removeItem('wasExternal');
          sessionStorage.setItem('loginToast', 'forced');
          await signOut({ callbackUrl: '/login' });
          return;
        }
      }

      setAllowRender(true);
    };
  
    if (typeof window !== "undefined") {
      checkAndSignOut();
    }
  }, []);

  // 로그인 후 쿠키 삭제
  useEffect(() => {
    if (allowRender) {
      // 렌더 직후 쿠키 제거
      document.cookie = 'loginInit=; Max-Age=0; path=/; SameSite=Lax'
    }
  }, [allowRender])

  
  if (!allowRender) return null; // false면 랜더링 막기
  
  return <>{children}</>;
}