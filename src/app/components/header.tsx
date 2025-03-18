'use client';
import Link from 'next/link';
import { useEffect, useState } from "react";
import HeaderLinks from '@/app/components/headerLinks';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

// const links = [
//   { name: 'License', href: '/main/license' },
//   { name: 'Log', href: '/main/log' },
//   { name: 'Admin', href: '/admin' },
// ];

export default function Header() {

  const [navState, setNavState] = useState<string>('license');

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newClick: string,
  ) => {
    setNavState(newClick);
  };

  return (
  <div className="flex justify-end h-24 bg-gray-300 w-screen">
      {/* <HeaderLinks /> */}
      {/* <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div> */}
      {/* <form>
        <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
          <PowerIcon className="w-6" />
          <div className="hidden md:block">Sign Out</div>
        </button>
      </form> */}

    <ToggleButtonGroup
      color="primary"
      value={navState}
      exclusive
      onChange={handleChange}
    >
      <ToggleButton value="license">
        <Link
          href={'/main/license'}
        >
          <p>License</p>
        </Link>
      </ToggleButton>

      <ToggleButton value="log">
        <Link
          href={'/main/log'}
        >
          <p>Log</p>
        </Link>
      </ToggleButton>
      
      <ToggleButton value="admin">
      <Link
        href={'/admin'}
      >
        <p>Admin</p>
      </Link>
      </ToggleButton>
    </ToggleButtonGroup>
    </div>
  )
}