import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { deleteLicenses } from '@/app/api/license/license';
import { useToastState } from '@/app/components/useToast';
import ToastAlert from './toastAleat';

interface AlertModalProps {
  open: boolean;
  close: () => void;
  state: string;
  title: string;
  message: string;
  deleteIds?: string[];
  onConfirm?: (() => void) | undefined;
}

export default function AlertModal({ open, close, state, title, message, deleteIds, onConfirm }: AlertModalProps) {
  const { toastOpen, toastMsg, severity, showToast, toastClose } = useToastState();

  const handleDeleteConfirm = async () => {
    if (!deleteIds || deleteIds.length === 0) return;
  
    // 라이센스 삭제
    if(state === 'license') {
      try {
        const res = await deleteLicenses(deleteIds);
        console.log('res', res);
        if(res.success) {
          showToast(res.result.affectedRows + '개의 데이터가 삭제되었습니다.', 'success');
          onConfirm && onConfirm();
          close();
        }
      } catch (err) {
        console.error(err);
        showToast('삭제 중 오류 발생', 'error');
      }

      // 관리자 삭제제
    } else if(state === 'admin') {
      try {
        const res = await fetch('/api/admin', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: deleteIds }),
        });
    
        if (!res.ok) throw new Error('삭제 실패');
    
        showToast('삭제 완료!', 'success');
        close();
      } catch (err) {
        console.error(err);
        showToast('삭제 중 오류 발생', 'error');
      }
    }
  };

  return (
    <>
      <Dialog open={open} onClose={close}>
        <div className="flex justify-between items-center p-4 border-b bg-gray-500">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <Button className="close-btn" onClick={close}><span style={{ color: '#fff' }}>X</span></Button>
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
              onClick={() => { handleDeleteConfirm(); } }>
              확인
            </Button>
          )}
          <Button variant="contained" color="inherit" onClick={close}>
            취소
          </Button>
        </Box>

      </Dialog>
      <ToastAlert
        open={toastOpen}
        setOpen={toastClose}
        message={toastMsg}
        severity={severity} 
      />
    </>
  );
}
