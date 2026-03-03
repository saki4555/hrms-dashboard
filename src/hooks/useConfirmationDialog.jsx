// // features/core-hr/hooks/useConfirmationDialog.jsx
// import { Button } from "@/components/ui/button";
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { useState } from "react";

// let externalResolve;

// export function useConfirmationDialog() {
//   const [state, setState] = useState({
//     open: false,
//     title: "",
//     description: "",
//     confirmText: "Confirm",
//     cancelText: "Cancel",
//     variant: "default", // 'default' | 'destructive'
//   });

//   const showConfirmation = ({
//     title,
//     description,
//     confirmText = "Confirm",
//     cancelText = "Cancel",
//     variant = "default",
//   }) => {
//     setState({
//       open: true,
//       title,
//       description,
//       confirmText,
//       cancelText,
//       variant,
//     });
//     return new Promise((resolve) => {
//       externalResolve = resolve;
//     });
//   };

//   const handleConfirm = () => {
//     setState((s) => ({ ...s, open: false }));
//     if (externalResolve) {
//       externalResolve(true);
//     }
//   };

//   const handleCancel = () => {
//     setState((s) => ({ ...s, open: false }));
//     if (externalResolve) {
//       externalResolve(false);
//     }
//   };

//   const ConfirmationDialog = () =>
//     state.open ? (
//       <AlertDialog open={state.open} onOpenChange={handleCancel}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>{state.title}</AlertDialogTitle>
//             <AlertDialogDescription>{state.description}</AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <Button variant="outline" onClick={handleCancel}>
//               {state.cancelText}
//             </Button>
//             <Button variant={state.variant} onClick={handleConfirm}>
//               {state.confirmText}
//             </Button>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     ) : null;

//   return { showConfirmation, ConfirmationDialog };
// }



// ! updated version
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function useConfirmationDialog() {
  const resolveRef = useRef(null); // ✅ scoped to this hook instance, not the module

  const [state, setState] = useState({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default",
  });

  const showConfirmation = ({ title, description, confirmText = "Confirm", cancelText = "Cancel", variant = "default" }) => {
    setState({ open: true, title, description, confirmText, cancelText, variant });
    return new Promise((resolve) => {
      resolveRef.current = resolve; // ✅ stored in ref, not a bare module variable
    });
  };

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(true);
    resolveRef.current = null;
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(false);
    resolveRef.current = null;
  };

  const ConfirmationDialog = () =>
    state.open ? (
      <AlertDialog open={state.open} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
            <AlertDialogDescription>{state.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCancel}>{state.cancelText}</Button>
            <Button variant={state.variant} onClick={handleConfirm}>{state.confirmText}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : null;

  return { showConfirmation, ConfirmationDialog };
}