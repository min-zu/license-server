'use client'

import React, { useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';

export default function Home() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if(pathname === '/') router.push('/login');
  }, []);
}