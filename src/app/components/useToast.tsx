import { useState, useCallback } from "react";
import ToastAlert from '@/app/components/toastAleat';

export const useToastState = () => {
  const [toasts, setToasts] = useState<{ id: number; message: string; severity: "success" | "error" | "warning" | "info"; }[]>([]);
  const [nextId, setNextId] = useState(0);

  const showToast = useCallback((message: string, severity: "success" | "error" | "warning" | "info") => {
    setToasts((prev) => [...prev, { id: nextId, message, severity }]);
    setNextId((prev) => prev + 1);
  }, [nextId]);

  const closeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter(toast => toast.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    closeToast,
    ToastComponent: (
      <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 1000 }}>
        {toasts.map((toast, index) => (
          <ToastAlert
            key={toast.id}
            open={true}
            setOpen={() => closeToast(toast.id)}
            message={toast.message}
            severity={toast.severity}
            top={index * 60}
          />
        ))}
      </div>
    )
  };
};



