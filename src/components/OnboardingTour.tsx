import React, { useState, useEffect } from 'react';
import { Joyride, CallBackProps, STATUS, Step, ACTIONS, EVENTS, TooltipRenderProps } from 'react-joyride';
import { View } from '../types';

interface OnboardingTourProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const CustomTooltip = ({
  index,
  step,
  isLastStep,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) => {
  return (
    <div
      {...tooltipProps}
      className="bg-[#1c1c1c] text-white p-5 rounded-md shadow-2xl w-80 font-sans border border-white/10"
      style={{ overflow: 'hidden' }}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#8a8a8a] uppercase">Tip {index + 1} of 3</span>
        {!isLastStep && (
          <button {...skipProps} className="text-[10px] font-bold tracking-wider text-[#8a8a8a] hover:text-white uppercase transition-colors">
            Skip
          </button>
        )}
      </div>

      <div className="mb-6">
        {step.title && <h3 className="text-sm font-semibold tracking-wide text-white mb-2">{step.title}</h3>}
        <p className="text-xs leading-relaxed text-[#b3b3b3]">{step.content}</p>
      </div>

      <div className="flex justify-end">
        <button
          {...primaryProps}
          className="bg-white text-black px-4 py-2 rounded text-xs font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors"
        >
          {isLastStep ? 'Got it' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export function OnboardingTour({ currentView, onViewChange }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Only run if user hasn't seen it
    const hasSeenTour = localStorage.getItem('kura_onboarding_tour_done_v5');
    if (!hasSeenTour && !run) {
      if (currentView !== 'shopping' && stepIndex === 0) {
         onViewChange('shopping');
      } else {
         const timer = setTimeout(() => {
           setRun(true);
         }, 800); // Wait for the app to init and animate in
         return () => clearTimeout(timer);
      }
    }
  }, [currentView, run, stepIndex, onViewChange]);

  const steps: Step[] = [
    {
      target: '#tour-to-buy-form',
      content: "Where do you usually shop? Instantly add items here and track their lowest historical prices so you never overpay.",
      title: "Smart Shopping List",
      placement: 'bottom',
      disableBeacon: true,
      spotlightPadding: 16,
    },
    {
      target: '#tour-flyer-deals',
      content: "Browse current weekly flyer deals from your favorite stores. One tap adds them to your list.",
      title: "Weekly Flyer Deals",
      placement: 'top',
      disableBeacon: true,
      spotlightPadding: 12,
    },
    {
      target: '#btn-ai-import',
      content: "Hate typing out long recipes? Just paste an Instagram Reel link or upload a food screenshot here. Our AI will instantly extract all ingredients and steps.",
      title: "The Magic AI Import",
      placement: 'bottom',
      disableBeacon: true,
      spotlightPadding: 8,
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      const isNext = action === ACTIONS.NEXT;
      const nextStepIndex = index + (isNext ? 1 : -1);
      
      // Before jumping to next step state, navigate the app
      if (nextStepIndex === 0 && currentView !== 'shopping') {
         onViewChange('shopping');
         setTimeout(() => setStepIndex(nextStepIndex), 300);
         return;
      } else if (nextStepIndex === 1 && currentView !== 'shopping') {
         onViewChange('shopping');
         setTimeout(() => setStepIndex(nextStepIndex), 300);
         return;
      } else if (nextStepIndex === 2 && currentView !== 'add-recipe') {
         onViewChange('add-recipe');
         setTimeout(() => setStepIndex(nextStepIndex), 300);
         return;
      }
      setStepIndex(nextStepIndex);
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // If target is not found, wait a bit and force a re-render or view switch
      if (index === 0 && currentView !== 'shopping') {
         onViewChange('shopping');
      } else if (index === 1 && currentView !== 'shopping') {
         onViewChange('shopping');
      } else if (index === 2 && currentView !== 'add-recipe') {
         onViewChange('add-recipe');
      }
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem('kura_onboarding_tour_done_v5', 'true');
      // Go back to shopping list as a default good state
      onViewChange('shopping');
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
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.85)', // dark semi-transparent
        },
        spotlight: {
          borderRadius: 8,
        }
      }}
      callback={handleJoyrideCallback}
    />
  );
}
