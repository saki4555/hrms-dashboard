/**
 * country-dialog.jsx
 *
 * Unified Add / Edit dialog for Country.
 *
 * Props:
 *   item={null}    → Add mode  (empty form, "Save Country" button)
 *   item={object}  → Edit mode (pre-filled form, "Update Country" button)
 *
 * Future: "Move" action will be a separate dialog/flow entirely.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Globe } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCreateCountry, useUpdateCountry } from "./queries";

const formSchema = z.object({
  countryName: z
    .string()
    .min(1, "Country name is required")
    .max(30, "Country name cannot exceed 30 characters"),
});

export default function CountryFormDialog({
  open,
  onOpenChange,
  showConfirmation,
  item = null, // null → Add mode | { COUNTRY_ID, COUNTRY_NAME } → Edit mode
}) {
  const isEditMode = !!item;

  const createMutation = useCreateCountry();
  const updateMutation = useUpdateCountry();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { countryName: "" },
  });

  const { formState: { isDirty } } = form;

  // Populate form on open
  useEffect(() => {
    if (open) {
      form.reset({
        countryName: isEditMode ? (item.COUNTRY_NAME || "") : "",
      });
    }
  }, [open, item]);

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: item.COUNTRY_ID,
          data: { countryName: data.countryName },
        });
        toast.success("Country updated successfully!");
      } else {
        await createMutation.mutateAsync({
          countryName: data.countryName,
        });
        toast.success("Country created successfully!");
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error?.message ||
          `Failed to ${isEditMode ? "update" : "create"} country. Please try again.`
      );
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description:
          "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {isEditMode ? "Edit Country" : "Add Country"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? `Editing "${item.COUNTRY_NAME}"`
                  : "Create a new country in the system"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="countryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Country Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Bangladesh"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update Country"
                ) : (
                  "Save Country"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}