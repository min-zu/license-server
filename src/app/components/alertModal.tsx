import React from 'react';

// MUI
import { Box, Button, Dialog, DialogContent } from '@mui/material';

// 라이선스 삭제
import { deleteLicenses } from '@/app/api/license/license';

// ToastAlert
import { useToastState } from '@/app/components/useToast';


interface AlertModalProps {
  open: boolean;
  close: () => void;
  state: string;
  title: string;
  message: string | React.ReactNode;
  deleteIds?: string[];
  onConfirm?: ((action?: string | null, desc?: string | null) => void) | undefined;
  onDeleted?: (ids: string[]) => void;
  failedCsvBase64?: string;
}

export default function AlertModal({ open, close, state, title, message, deleteIds, onDeleted, onConfirm, failedCsvBase64 }: AlertModalProps) {
  const { showToast, ToastComponent } = useToastState();

  const handleDeleteConfirm = async () => {
    if (!deleteIds || deleteIds.length === 0) return;
  
    // 라이센스 삭제
    if(state === 'license') {
      try {
        const res = await deleteLicenses(deleteIds);
        if(res.success && res.result.affectedRows > 0) {
          showToast(res.result.affectedRows + '개의 데이터가 삭제되었습니다.', 'success');
          onConfirm && onConfirm('del', null);
          close();
        }
      } catch (err) {
        console.error(err);
        showToast('삭제 중 오류 발생', 'error');
        onConfirm && onConfirm('fail', null);
      }

      // 관리자 삭제
    } else if(state === 'admin') {
      try {
        // 관리자 삭제 요청 API 호출
        const res = await fetch('/api/admin', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: deleteIds }),
        });
        // 요청 실패 시
        if (!res.ok) showToast('삭제 실패!', 'error'); // toastArlet
        // 성공시
        showToast(deleteIds.length + '개의 계정이 삭제되었습니다.', 'success');
        onDeleted?.(deleteIds);
        close();
      } catch (err) {
        console.error(err);
        showToast('삭제 중 오류 발생', 'error');
      }
    }
  };

  const handleEditConfirm = () => {
    onConfirm && onConfirm();
    close();
  }

  const handleDownload = () => {
    let fileData: string | Blob;
    let fileName: string;

    if (state === 'help') {
      fileData = '/sample/ituImport.csv';
      fileName = 'ituImport.csv';

      const link = document.createElement('a');
      link.href = fileData;
      link.download = fileName;
      link.click();

    } else if (state === 'fail' && failedCsvBase64) {
      const binaryString = atob(failedCsvBase64);
      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([byteArray], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'failed_rows.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
          {(state === 'help' || state === 'fail') ? (
            <>
              <Button 
                className="default-btn" 
                onClick={handleDownload}
              >
                {state === 'help' ? '샘플파일 다운로드' : '등록 실패한 ITU 파일 다운로드'}
              </Button>
            </>
          ) : (
            <Button
              className="default-btn"
              onClick={() => { state === 'edit' ? handleEditConfirm() : handleDeleteConfirm(); } }>
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