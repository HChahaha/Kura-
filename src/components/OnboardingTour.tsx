import React, { useState, useEffect } from 'react';
import { Joyride, CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { View } from '../types';

interface OnboardingTourProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function OnboardingTour({ currentView, onViewChange }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Only run if user hasn't seen it
    const hasSeenTour = localStorage.getItem('kura_onboarding_tour_done_v2');
    if (!hasSeenTour) {
      setTimeout(() => {
        setRun(true);
      }, 1500); // Wait for the app to init and animate in
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: "Welcome to Kura! Let's take a quick tour to see how to save money and manage your groceries without the hassle.",
      title: "Welcome to Kura",
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'input[placeholder*="What should we buy"]',
      content: "Where do you usually shop? Let's check your store tabs like Walmart or T&T! Try typing 'Milk' here. We'll automatically show the lowest historical price to help you save.",
      title: "The Shopping Habit",
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#btn-ai-import',
      content: "Hate typing out long recipes? Just paste an Instagram Reel link or upload a food screenshot here. Our AI will automatically extract all ingredients and steps for you with 1-click!",
      title: "The Magic Auto-Fill",
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-inventory-cards',
      content: "When you click 'BUY' on your shopping list, your items automatically fly right into this fridge inventory. We will track the expiry dates and alert you before food spoils!",
      title: "The Zero-Waste Fridge",
      placement: 'top',
      disableBeacon: true,
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as any)) {
      const isNext = action === ACTIONS.NEXT;
      const nextStepIndex = index + (isNext ? 1 : -1);
      
      // Before jumping to next step state, navigate the app
      if (nextStepIndex === 1 && currentView !== 'shopping') {
         onViewChange('shopping');
         setTimeout(() => setStepIndex(nextStepIndex), 300);
         return;
      } else if (nextStepIndex === 2 && currentView !== 'add-recipe') {
         onViewChange('add-recipe');
         setTimeout(() => setStepIndex(nextStepIndex), 300);
         return;
      } else if (nextStepIndex === 3 && currentView !== 'inventory') {
         onViewChange('inventory');
         setTimeout(() => setStepIndex(nextStepIndex), 300);
         return;
      }
      setStepIndex(nextStepIndex);
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem('kura_onboarding_tour_done_v2', 'true');
      // Go back to inventory as a default good state
      onViewChange('inventory');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showSkipButton
      showProgress
      disableOverlayClose
      styles={{
        options: {
          primaryColor: '#1e293b', // ink-black
          zIndex: 10000,
          textColor: '#3f3f46', // zinc-700
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.55)',
        },
        tooltipContainer: {
          textAlign: 'left'
        },
        tooltipTitle: {
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '14px',
          color: '#18181b',
          marginBottom: '8px'
        },
        tooltipContent: {
          padding: '10px 0',
          fontSize: '14px',
          lineHeight: 1.6
        },
        buttonNext: {
          backgroundColor: '#18181b', // ink-black
          borderRadius: 12,
          fontWeight: 700,
          padding: '10px 16px',
        },
        buttonBack: {
          color: '#71717a', // zinc-500
          fontWeight: 600,
        },
        buttonSkip: {
          color: '#71717a', // zinc-500
          fontWeight: 600,
        }
      }}
      callback={handleJoyrideCallback}
    />
  );
}
