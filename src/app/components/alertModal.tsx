import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Menu, MenuItem } from '@mui/material';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { deleteLicenses } from '@/app/api/license/license';
import { useToastState } from '@/app/components/useToast';

interface AlertModalProps {
  open: boolean;
  close: () => void;
  state: string;
  title: string;
  message: string | React.ReactNode;
  deleteIds?: string[];
  onConfirm?: (() => void) | undefined;
  onDeleted?: (ids: string[]) => void;
}

export default function AlertModal({ open, close, state, title, message, deleteIds, onDeleted, onConfirm }: AlertModalProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const sampleOpen = Boolean(anchorEl);
  const handleSampleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleSampleClose = () => {
    setAnchorEl(null);
  };

  const router = useRouter();
  const { showToast, ToastComponent } = useToastState();

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

      // 관리자 삭제
    } else if(state === 'admin') {
      try {
        const res = await fetch('/api/admin', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: deleteIds }),
        });
          
        const data = await res.json();

        if (!res.ok) showToast('삭제 실패!', 'error');
    
        showToast(deleteIds.length + '개의 계정이 삭제되었습니다.', 'success');
        onDeleted?.(deleteIds);
        close();
    
        if (data.deletedSelf) {
          await signOut({ redirect: false });
          router.push('/login?loggedout=true');
        }
      } catch (err) {
        console.error(err);
        showToast('삭제 중 오류 발생', 'error');
      }
    }
  };

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onClose={close}>
        <div className="flex justify-between items-center p-4 border-b bg-cyan-950">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <Button className="close-btn" onClick={close}><span style={{ color: '#fff' }}>X</span></Button>
        </div>
        <DialogContent className="alert-modal-content">{message}</DialogContent>

        <Box display="flex" justifyContent="center" gap={0.5} mt={2} mb={2}>
          {state === 'help' ? (
            <>
            <Button className="default-btn" onClick={handleSampleClick}>
              샘플파일 다운로드
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={sampleOpen}
              onClose={handleSampleClose}
            >
              <MenuItem 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/sample/ituImport.csv';
                  link.download = 'ituImport.csv';
                  link.click();
              }}>
                ITU 샘플파일
              </MenuItem>
              <MenuItem
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/sample/defaultImport.csv';
                  link.download = 'defaultImport.csv';
                  link.click();
                }}
              >ITM/SMC/XTM 샘플파일</MenuItem>
            </Menu>
            </>
          ) : (
            <Button
              className="default-btn"
              onClick={() => { handleDeleteConfirm(); } }>
              확인
            </Button>
          )}
          <Button className="close-text-btn" onClick={close}>
            취소
          </Button>
        </Box>

      </Dialog>
    </>
  );
}
