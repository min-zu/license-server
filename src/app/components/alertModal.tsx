import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

interface AlertModalProps {
  open: boolean;
  close: () => void;
  state: string;
  title: string;
  message: string;
  deleteIds?: string[];
}

export default function AlertModal({ open, close, state, title, message, deleteIds }: AlertModalProps) {
  const handleDeleteConfirm = async () => {
    if (!deleteIds || deleteIds.length === 0) return;
  
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: deleteIds }),
      });
  
      if (!res.ok) throw new Error('삭제 실패');
  
      alert('삭제 완료!');
      close();
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류 발생');
    }
  };

  return (
    <Dialog open={open} onClose={close}>
      <div className="flex justify-between items-center p-4 border-b bg-gray-500">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <Button className="close-btn" onClick={close}><span style={{color:'#fff'}}>X</span></Button>
      </div>
      <DialogContent className="alert-modal-content">{message}</DialogContent>
      
      <Box display="flex" justifyContent="center" gap={1} mt={2} mb={2}>
        {state === 'help' ? (
          <Button variant="contained" color="primary">
            샘플파일 다운로드
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (state === 'admin') {
                handleDeleteConfirm();
              }
              else if (state === 'license') {

              }
            }}>
            확인
          </Button>
        )}
        <Button variant="contained" color="inherit" onClick={close}>
          취소
        </Button>
      </Box>
    </Dialog>
  );
}
