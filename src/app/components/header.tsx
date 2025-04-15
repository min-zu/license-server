'use client';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { Button, Modal, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import LicenseAddModal from './licenseAddModal';
import UpsertModal from './upsertAdminModal';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from "next/navigation";
import { useToastState } from './useToast';

import '@/app/style/common.css';
import '@/app/style/login.css';

export default function Header() {
  const pathname = usePathname();
  const [navState, setNavState] = useState(() => {
    if (pathname.includes("/main/license")) return "license";
    if (pathname.includes("/main/admin")) return "admin";
    if (pathname.includes("/main/log")) return "log";
  });

  const { data: session, update } = useSession();
  const role = session?.user?.role;

  // const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [openUpsert, setOpenUpsert] = useState(false);
  // const handleClose = () => setIsModalOpen(false);
  
  // const handleChange = (
  //   event: React.MouseEvent<HTMLElement>,
  //   newClick: string,
  // ) => {
  //   setNavState(newClick);
  // };
  
  // 로그아웃
  const handleLogout = async () => {
    sessionStorage.setItem('loginToast', 'loggedout');
    await signOut({ callbackUrl:'/login' });

  };

  useEffect(() => {
    if (pathname.includes("/main/license")) {
      setNavState("license");
    } else if (pathname.includes("/main/admin")) {
      setNavState("admin");
    } else if (pathname.includes("/main/log")) {
      setNavState("log");
    }
  }, [pathname]);

  const { showToast, ToastComponent } = useToastState();

  return (
    <div className="flex justify-between h-12 bg-cyan-950 w-screen">
      <div className="flex items-center ml-4 gap-8">
        <div className="logo w-12 h-12 bg-gray-400" /> {/* 로고 자리 */}
        <p className="text-white">|</p>
        <nav className="flex gap-6">
          <Link 
            href="/main/license"
            onClick={() => setNavState('license')}
          >
            <p className={navState === 'license' ? 'text-white font-bold' : 'text-gray-300'}>License</p>
          </Link>

          <p className="text-white">|</p>

          <Link 
            href="/main/log"
            onClick={() => setNavState('log')}
          >
            <p className={navState === 'log' ? 'text-white font-bold' : 'text-gray-300'}>Log</p>
          </Link>

          <p className="text-white">|</p>

          <Link 
            href="/main/admin"
            onClick={(e) => {
              if (role !== 3) {
                e.preventDefault();
                showToast("접근 권한이 없습니다.", "warning");
                return;
              }
          
              setNavState('admin');
            }}
          >
            <p className={navState === 'admin' ? 'text-white font-bold' : 'text-gray-300'}>Admin</p>
          </Link>
          
          {/* {navState === 'license' && (
            <Button
              variant="contained"
              color="primary" 
              size="small"
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              라이센스 등록
            </Button>
          )} */}
        </nav>
      </div>

      <div className="flex items-center mr-4">
        <nav className="flex gap-6">
          <div
            onClick={() => {
              if (role === 3) {
                showToast("슈퍼 관리자는 본인 정보를 수정할 수 없습니다.", "warning");
                return;
              }
              setOpenUpsert(true)}}
          >
            <AccountCircle style={{ color: 'white', cursor: 'pointer' }} />
          </div>

          <p className="text-white">|</p>

          <div
            onClick={handleLogout}
          >
            <Logout style={{ color: 'white', cursor: 'pointer' }} />
          </div>
        </nav>
      {ToastComponent}      
      
      {openUpsert && (
        <UpsertModal 
          open={openUpsert}
          onClose={() => setOpenUpsert(false)} 
          mode="self"
          session={session}
          onAdded={async () => {
            await update({ trigger: "update" });
            showToast("내 정보가 수정되었습니다.", "success")
          }}
        />
      )}
      </div>
    </div>
  )
}