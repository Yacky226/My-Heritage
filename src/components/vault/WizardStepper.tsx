import { Check } from 'lucide-react';

interface Step {
  number: number;
  label: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 mb-8 select-none">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;

        return (
          <div
            key={step.number}
            className="flex-1 flex items-center w-full md:w-auto"
          >
            {/* Step bubble details */}
            <div className="flex items-center gap-3 w-full md:w-auto text-left py-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border shrink-0
                  ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                      : isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.25)]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500'
                  }
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={`
                  text-xs font-bold tracking-tight uppercase
                  ${isCompleted ? 'text-emerald-555' : isActive ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting lines for desktop layouts */}
            {idx !== steps.length - 1 && (
              <div
                className={`
                  hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300
                  ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
