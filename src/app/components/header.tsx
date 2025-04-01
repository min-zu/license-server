'use client';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { Button, Modal, ToggleButton, ToggleButtonGroup } from '@mui/material';
import LicenseAddModal from './licenseAddModal';
import UpsertModal from './upsertAdminModal';
import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [navState, setNavState] = useState(() => {
    if (pathname.includes("/main/license")) return "license";
    if (pathname.includes("/main/admin")) return "admin";
    if (pathname.includes("/main/log")) return "log";
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [openUpsert, setOpenUpsert] = useState(false);
  const handleClose = () => setIsModalOpen(false);
  
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newClick: string,
  ) => {
    setNavState(newClick);
  };

  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login?loggedout=true')
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

  return (
    <div className="flex justify-between h-24 bg-gray-300 w-screen">
      <div className="flex items-center ml-4 gap-8">
        <div className="logo w-12 h-12 bg-gray-400" /> {/* 로고 자리 */}
        <nav className="flex gap-6">
          <Link 
            href="/main/license"
            className="hover:text-blue-600 transition-colors"
            onClick={() => setNavState('license')}
          >
            <p className={navState === 'license' ? 'text-blue-600' : ''}>License</p>
          </Link>

          <Link 
            href="/main/log"
            className="hover:text-blue-600 transition-colors"
            onClick={() => setNavState('log')}
          >
            <p className={navState === 'log' ? 'text-blue-600' : ''}>Log</p>
          </Link>

          <Link 
            href="/main/admin"
            className="hover:text-blue-600 transition-colors"
            onClick={() => setNavState('admin')}
          >
            <p className={navState === 'admin' ? 'text-blue-600' : ''}>Admin</p>
          </Link>
          
          {navState === 'license' && (
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
          )}
        </nav>
      </div>

      <div className="flex items-center mr-4 gap-8">
        <nav className="flex gap-6">
          <div
            className="hover:text-blue-600 transition-colors cursor-pointer"
            onClick={() => setOpenUpsert(true)}
          >
            <p>User</p>
          </div>
          <UpsertModal 
            open={openUpsert} 
            onClose={() => setOpenUpsert(false)} 
            mode="self"
          />

          <div
            className="hover:text-blue-600 transition-colors cursor-pointer"
            onClick={handleLogout}
          >
            <p>LogOut</p>
          </div>
        </nav>
      </div>
      
      <Modal
        open={isModalOpen}
        onClose={handleClose}
      >
        <span>
        <LicenseAddModal 
          close={handleClose}
        />
        </span>
      </Modal>
    </div>
  )
}