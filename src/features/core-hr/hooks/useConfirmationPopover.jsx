import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

let externalResolve;

const defaultState = {
  open: false,
  message: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default",
};

export function useConfirmationPopover() {
  const [state, setState] = useState(defaultState);

  const showConfirmation = ({
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
  }) => {
    setState({
      open: true,
      message,
      confirmText,
      cancelText,
      variant,
    });

    return new Promise((resolve) => {
      externalResolve = resolve;
    });
  };

  const resetState = useCallback(() => {
    setState(defaultState);
  }, []);

  const handleConfirm = () => {
    resetState();
    if (externalResolve) {
      externalResolve(true);
    }
  };

  const handleCancel = () => {
    resetState();
    if (externalResolve) {
      externalResolve(false);
    }
  };

  /**
   * Wrapper component that should wrap your trigger button
   */
  const PopoverWrapper = ({ children, onTriggerClick }) => {
    return (
      <Popover modal={true} open={state.open} onOpenChange={(open) => !open && handleCancel()}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-80 p-4 space-y-3 shadow-xl", 
           
          )}
          side="top" 
          align="end"
        >
          <p className="text-sm font-medium ">
            {state.message}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {state.cancelText}
            </Button>
            <Button
              variant={state.variant}
              size="sm"
              onClick={handleConfirm}
            >
              {state.confirmText}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return { showConfirmation, PopoverWrapper };
}