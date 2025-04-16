import { useState, useCallback } from "react";
import ToastAlert from '@/app/components/toastAleat';

export const useToastState = () => {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [severity, setSeverity] = useState<"success" | "error" | "warning" | "info">("info");

  const showToast = useCallback((message: string, severity: "success" | "error" | "warning" | "info") => {
    setToastMsg(message);
    setSeverity(severity);
    setToastOpen(true);
  }, []);

  const closeToast = useCallback(() => setToastOpen(false), []);

  return {
    toastOpen,
    toastMsg,
    severity,
    showToast,
    ToastComponent: (
      <ToastAlert
        open={toastOpen}
        setOpen={closeToast}
        message={toastMsg}
        severity={severity}
      />
    )
  };
};



