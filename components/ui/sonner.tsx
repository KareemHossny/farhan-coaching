"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return <Toaster position="top-left" dir="rtl" richColors closeButton toastOptions={{ className: "font-sans" }} />;
}
