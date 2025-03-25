'use client';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { Button, Modal, ToggleButton, ToggleButtonGroup } from '@mui/material';
import LicenseAddModal from './licenseAddModal';

export default function Header() {

  const [navState, setNavState] = useState<string>('license');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const handleClose = () => setIsModalOpen(false);

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newClick: string,
  ) => {
    setNavState(newClick);
  };

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
          <Link  
            href="/main/admin"
            className="hover:text-blue-600 transition-colors"
          >
            <p>User</p>
          </Link>

          <Link  
            href="/main/admin"
            className="hover:text-blue-600 transition-colors"
          >
            <p>LogOut</p>
          </Link>
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