'use client';

import { useEffect, useState } from 'react';

// 유휴상태 감지
import { useIdleTimer } from 'react-idle-timer'

// Auth.js (NextAuth.js v5)
import { signOut } from 'next-auth/react';


export default function SessionChecker({
  children,
}: {
  children: React.ReactNode;
}) {
  // 화면 렌더링 허용 여부
  const [allowRender, setAllowRender] = useState(false);

  // 유휴 상태 감지 (5분 이상 아무 입력 없을 경우)
  useIdleTimer({
    timeout: 1000 * 60 * 5, // 5분
    onIdle: () => {
      // 현재 페이지가 보이는 상태일 경우에만 세션만료 수행
      if (document.visibilityState === 'visible') {
        sessionStorage.setItem('loginToast', 'timedout')
        signOut({ callbackUrl: '/login' });
      } else {
        // 보이지 않는 경우에는 기록만 남기고 세션만료는 나중에 처리
        sessionStorage.setItem('loginToast', 'timedout')
      }
    },
    debounce: 500, // 이벤트 감지 최소 간격 (선택)
  })

  // 사용자가 다시 탭에 복귀할 때 `timedout` 상태 확인해서 로그아웃
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const expired = sessionStorage.getItem('loginToast') === 'timedout';
        if (expired) {
          signOut({ callbackUrl: '/login' });
        }
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // 외부 페이지 이동 시 unload 기록 (뒤로가기 복귀 판단용)
  useEffect(() => {
    const handleUnload = () => {
      sessionStorage.setItem('wasExternal', 'true')
    }

    window.addEventListener('unload', handleUnload)
    return () => window.removeEventListener('unload', handleUnload)
  }, [])

  // 페이지 로드 시: 외부 이동 후 복귀 또는 주소창 입력 등의 비정상 진입 여부 확인
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

      // unload일때 새로고침인지 외부사이트인지 판단 후 처리
      if (wasExternal) {
        if (navType === 'reload') {
          // 새로고침 후 뒤로가기인 경우 → 기록만 제거하고 통과
          sessionStorage.removeItem('wasExternal');
        } else if (navType === 'back_forward') {
          // 외부에서 뒤로가기 복귀한 경우 → 비정상 접근 처리
          sessionStorage.removeItem('wasExternal');
          sessionStorage.setItem('loginToast', 'forced');
          await signOut({ callbackUrl: '/login' });
          return;
        }
      }
      // 정상 접근으로 판단되면 렌더링 허용
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