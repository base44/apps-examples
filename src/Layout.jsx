import React from 'react';
import { Toaster } from "sonner";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}