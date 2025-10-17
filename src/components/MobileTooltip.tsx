"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalTooltip } from '@/contexts/GlobalTooltipContext';

interface MobileTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

const MobileTooltip: React.FC<MobileTooltipProps> = ({
  children,
  content,
  delayDuration = 0, // Default to 0 for immediate hover
  skipDelayDuration = 300, // Default to 300ms for touch devices
  side = 'top',
  align = 'center',
  className,
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const {
    isLongPressActive,
    setIsLongPressActive,
    longPressTargetRef,
    longPressTimerRef,
    setTooltip,
    hideTooltip,
  } = useGlobalTooltip();

  const LONG_PRESS_DURATION = 500; // milliseconds

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTargetRef.current = event.currentTarget as HTMLElement;
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressActive(true);
      setIsOpen(true);
      setTooltip(content, event.touches[0].clientX, event.touches[0].clientY);
    }, LONG_PRESS_DURATION);
  }, [content, longPressTargetRef, longPressTimerRef, setIsLongPressActive, setTooltip]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressActive) {
      hideTooltip();
      setIsLongPressActive(false);
    }
    setIsOpen(false);
    longPressTargetRef.current = null;
  }, [hideTooltip, isLongPressActive, longPressTargetRef, longPressTimerRef, setIsLongPressActive]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (longPressTimerRef.current && longPressTargetRef.current) {
      const touch = event.touches[0];
      const targetRect = longPressTargetRef.current.getBoundingClientRect();
      const tolerance = 10; // Small tolerance for movement
      if (
        touch.clientX < targetRect.left - tolerance ||
        touch.clientX > targetRect.right + tolerance ||
        touch.clientY < targetRect.top - tolerance ||
        touch.clientY > targetRect.bottom + tolerance
      ) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        if (isLongPressActive) {
          hideTooltip();
          setIsLongPressActive(false);
        }
        setIsOpen(false);
      }
    } else if (isLongPressActive && isOpen) {
      // If long press is active and tooltip is showing, update its position
      setTooltip(content, event.touches[0].clientX, event.touches[0].clientY);
    }
  }, [content, hideTooltip, isLongPressActive, isOpen, longPressTargetRef, longPressTimerRef, setTooltip]);

  if (isMobile) {
    return (
      <TooltipProvider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <span
              ref={triggerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onTouchMove={handleTouchMove}
              className={className}
            >
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent side={side} align={align}>
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Desktop behavior (standard hover)
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MobileTooltip;