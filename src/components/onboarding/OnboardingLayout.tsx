"use client";

import React, { useState, ReactNode, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OnboardingLayoutProps {
  children: ReactNode[];
  onComplete: () => void;
  totalSteps: number;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children, onComplete, totalSteps }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, totalSteps, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        const isTyping = 
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.hasAttribute('contenteditable');

        if (!isTyping) {
          event.preventDefault(); // Prevent default form submission if any
          nextStep();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextStep]); // Depend on nextStep

  const progressValue = ((currentStep + 1) / totalSteps) * 100;

  return (
    <main className="max-w-md mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6 min-h-screen flex flex-col justify-center">
      <Card className="w-full flex flex-col flex-grow">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="mb-6">
            <Progress value={progressValue} className="h-2" />
            <p className="text-sm text-muted-foreground text-right mt-2">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
          <div className="flex-grow flex flex-col justify-between">
            {React.Children.map(children, (child, index) =>
              index === currentStep ? React.cloneElement(child as React.ReactElement, { nextStep, prevStep }) : null
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default OnboardingLayout;