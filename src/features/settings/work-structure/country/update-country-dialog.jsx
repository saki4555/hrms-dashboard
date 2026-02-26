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
import { useUpdateCountry } from "./queries";

const formSchema = z.object({
  countryName: z
    .string()
    .min(1, "Country name is required")
    .max(30, "Country name cannot exceed 30 characters"),
});

export default function UpdateCountryDialog({
  open,
  onOpenChange,
  showConfirmation,
  country,
}) {
  const updateCountryMutation = useUpdateCountry();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryName: "",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (country) {
      form.reset({
        countryName: country.COUNTRY_NAME || "",
      });
    }
  }, [country]);

  const onSubmit = async (data) => {
    if (!country?.COUNTRY_ID) {
      toast.error("Country ID is missing");
      return;
    }

    try {
      await updateCountryMutation.mutateAsync({
        id: country.COUNTRY_ID,
        data: { countryName: data.countryName },
      });

      toast.success("Country updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update country. Please try again.");
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

  const isSubmitting = updateCountryMutation.isPending;

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
              <DialogTitle>Update Country</DialogTitle>
              <DialogDescription>
                Edit country details for "{country?.COUNTRY_NAME}"
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
                      disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update Country"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}