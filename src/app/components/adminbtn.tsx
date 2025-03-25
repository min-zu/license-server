'use client'

import { useState } from 'react';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import Addadmin from './addadmin';
import Editadmin from './editadmin';

export default function AdminBtn() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <div>
      <ButtonGroup
        disableElevation
        variant="contained"
      >
        <Button onClick={() => setOpenAdd(true)}>추가</Button>
        <Button onClick={() => setOpenEdit(true)}>삭제</Button>
      </ButtonGroup>

      <Addadmin open={openAdd} onClose={() => setOpenAdd(false)} />
      <Editadmin open={openEdit} onClose={() => setOpenEdit(false)} />
    </div>
  );
}