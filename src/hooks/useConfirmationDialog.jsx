// features/core-hr/hooks/useConfirmationDialog.jsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

let externalResolve;

export function useConfirmationDialog() {
  const [state, setState] = useState({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default", // 'default' | 'destructive'
  });

  const showConfirmation = ({
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
  }) => {
    setState({
      open: true,
      title,
      description,
      confirmText,
      cancelText,
      variant,
    });
    return new Promise((resolve) => {
      externalResolve = resolve;
    });
  };

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    if (externalResolve) {
      externalResolve(true);
    }
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    if (externalResolve) {
      externalResolve(false);
    }
  };

  const ConfirmationDialog = () =>
    state.open ? (
      <Dialog open={state.open} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.title}</DialogTitle>
            <DialogDescription>{state.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              {state.cancelText}
            </Button>
            <Button
              variant={state.variant}
              onClick={handleConfirm}
            >
              {state.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ) : null;

  return { showConfirmation, ConfirmationDialog };
}