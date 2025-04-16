import { useEffect, useState } from "react";
import { Slide, Snackbar, Alert, SnackbarCloseReason } from "@mui/material";

export interface ToastAlertProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export default function ToastAlert({ open, setOpen, message, severity }: ToastAlertProps) {
  const [isOpen, setIsOpen] = useState<boolean>(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    setOpen(false);
  };

  return (
    <div>
      {isOpen && (
        <Slide direction="left" in={isOpen} mountOnEnter unmountOnExit>
          <Snackbar open={isOpen} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} autoHideDuration={3000} onClose={handleClose}>
            <Alert
            onClose={handleClose}
            severity={severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {message}
          </Alert>
        </Snackbar>
      </Slide>
      )}
    </div>
  );
};
