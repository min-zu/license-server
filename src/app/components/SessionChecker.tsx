'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SessionChecker({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated: () => {
      const isLogout = localStorage.getItem('loggedout') === 'true';

      if (isLogout) {
      localStorage.removeItem('loggedout');
      router.replace('/login?loggedout=true')
      return;
      } 
      router.replace("/login?timedout=true");
    },
  });

  if (status === 'loading') return null;

  return <>{children}</>;
}