import { useState } from "react";

export const useToastState = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [severity, setSeverity] = useState<"success" | "error" | "warning" | "info">("info");

  const showToast = (message: string, severity: "success" | "error" | "warning" | "info") => {
    console.log('showToast', message, severity);
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  };

  const toastClose = () => {
    setOpen(false);
  };

  return { open, message, severity, showToast, toastClose };
};