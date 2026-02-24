"use client";

const STEP_LABELS = ["Your Situation", "Your Household", "Your Home", "Results"];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav className="mb-8" aria-label="Progress">
      <ol className="flex items-center gap-2">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isFuture = step > currentStep;

          return (
            <li key={step} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => step < currentStep && onStepClick(step)}
                disabled={isFuture}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isCompleted
                    ? "text-primary cursor-pointer hover:text-primary-dark"
                    : isCurrent
                    ? "text-gray-900"
                    : "text-gray-400 cursor-default"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCompleted
                      ? "bg-primary text-white"
                      : isCurrent
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? "\u2713" : step}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {index < STEP_LABELS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isCompleted ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
