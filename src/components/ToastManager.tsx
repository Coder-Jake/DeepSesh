"use client";

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { useTimer } from "@/contexts/TimerContext";
import { useToast } from "@/hooks/use-toast";

const ToastManager: React.FC = () => {
  const { toasts } = useToast();
  const { areToastsEnabled } = useTimer();

  if (!areToastsEnabled) {
    return null;
  }

  return <Toaster toasts={toasts} />;
};

export default ToastManager;