'use client';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export default function Header() {

  const [navState, setNavState] = useState<string>('license');

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newClick: string,
  ) => {
    setNavState(newClick);
  };

  return (
  <div className="flex justify-between h-24 bg-gray-300 w-screen">
    <div className='logo ml-4 mt-8' />
    <div className='content-center mr-4'>
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
          href={'/main/admin'}
        >
          <p>Admin</p>
        </Link>
        </ToggleButton>

        <ToggleButton value="logout">
          <p>LogOut</p>
        </ToggleButton>
      </ToggleButtonGroup>
      </div>
    </div>
  )
}