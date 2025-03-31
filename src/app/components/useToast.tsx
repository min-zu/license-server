import { useState } from "react";

export const useToastState = () => {
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [severity, setSeverity] = useState<"success" | "error" | "warning" | "info">("info");

  const showToast = (message: string, severity: "success" | "error" | "warning" | "info") => {
    console.log('showToast', message, severity);
    setToastMsg(message);
    setSeverity(severity);
    setToastOpen(true);
  };

  const toastClose = () => {
    setToastOpen(false);
  };

  return { toastOpen, toastMsg, severity, showToast, toastClose };};
