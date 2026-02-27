import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS } from "./steps";

export function ProgressBar({ currentStep, completedSteps, onStepClick }) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = completedSteps.has(idx);
            const isClickable = idx <= currentStep || isCompleted;
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(idx)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all duration-300",
                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                  )}
                >
                  <div
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : isActive
                          ? `bg-gradient-to-br ${step.color} border-transparent text-white shadow-lg`
                          : "bg-muted border-border text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium hidden sm:block transition-colors",
                      isActive
                        ? "text-foreground"
                        : isCompleted
                          ? "text-emerald-500"
                          : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 relative overflow-hidden rounded-full bg-border">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: completedSteps.has(idx) ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}