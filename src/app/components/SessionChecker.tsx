'use client';

import { useEffect, useState } from 'react';

// 유휴상태 감지
import { useIdleTimer } from 'react-idle-timer'

// Auth.js (NextAuth.js v5)
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';


export default function SessionChecker({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter()
  
  // 화면 렌더링 허용 여부
  const [allowRender, setAllowRender] = useState(false);

  // 유휴 상태 감지 (5분 이상 아무 입력 없을 경우)
  useIdleTimer({
    timeout: 1000 * 60 * 5, // 5분
    onIdle: async () => {
      // 현재 페이지가 보이는 상태일 경우에만 세션만료 수행
      if (document.visibilityState === 'visible') {
        localStorage.setItem('loginToast', 'timedout')

        history.pushState(null, '', location.href);
        window.addEventListener('popstate', () => {
          history.pushState(null, '', location.href);
        });

        await signOut({ redirect: false });
        window.location.replace('/login');
        return;
      } else {
        // 보이지 않는 경우에는 기록만 남기고 세션만료는 나중에 처리
        localStorage.setItem('loginToast', 'timedout')
      }
    },
    debounce: 500, // 이벤트 감지 최소 간격 (선택)
  })

  // 사용자가 다시 탭에 복귀할 때 `timedout` 상태 확인해서 로그아웃
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const expired = localStorage.getItem('loginToast') === 'timedout';
        if (expired) {
          (async () => {
            history.pushState(null, '', location.href);
            window.addEventListener('popstate', () => {
              history.pushState(null, '', location.href);
            });

            await signOut({ redirect: false });
            window.location.replace('/login');
            return;
          })();
        }
      }
      // 정상 접근으로 판단되면 렌더링 허용
      setAllowRender(true);
    };
  
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // 주소창에 url 직접 입력 + loginInit 쿠키 없음 -> 로그아웃
  useEffect(() => {
    const checkDirectUrl = async () => {
      const navEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const navType = navEntry?.type;
      const isLogin = document.cookie.includes("loginInit=true");

      if (navType === 'navigate' && !isLogin) {
        localStorage.setItem('loginToast', 'forced');

        history.pushState(null, '', location.href);
        window.addEventListener('popstate', () => {
          history.pushState(null, '', location.href);
        });

        await signOut({ redirect: false });
        window.location.replace('/login');
      }

      // 정상 접근으로 판단되면 렌더링 허용
      setAllowRender(true);
    };
  
    if (typeof window !== "undefined") {
      checkDirectUrl();
    }
  }, []);

  // 외부 페이지 이동 시 localStorage에 기록
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem('wasExternal', 'true');
      }
    }

    document.addEventListener('visibilitychange', handleBeforeUnload);
    return () => document.removeEventListener('visibilitychange', handleBeforeUnload);
  }, [])

  // 외부페이지에서 복귀 시 비정상 진입 여부 확인
  useEffect(() => {
    const checkExternalReturn = async (e?: PageTransitionEvent) => {
      const wasExternal = localStorage.getItem('wasExternal') === 'true'
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const navType = navEntry?.type

      if (wasExternal && (e?.persisted || navType === 'back_forward')) {
        localStorage.removeItem('wasExternal')
        localStorage.setItem('loginToast', 'forced')

        history.pushState(null, '', location.href);
        window.addEventListener('popstate', () => {
          history.pushState(null, '', location.href);
        });

        await signOut({ redirect: false });
        window.location.replace('/login');
        return;
      }
      else {
        localStorage.removeItem('wasExternal');
      }
      // 정상 접근으로 판단되면 렌더링 허용
      setAllowRender(true);
    }

    if (typeof window !== "undefined") {
      checkExternalReturn();
    }
  
    window.addEventListener('pageshow', checkExternalReturn)
    return () => window.removeEventListener('pageshow', checkExternalReturn)
  }, [])

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