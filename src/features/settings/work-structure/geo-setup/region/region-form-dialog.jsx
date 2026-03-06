/**
 * region-dialog.jsx
 *
 * Unified Add / Edit dialog for Region.
 *
 * Props:
 *   item={null}            → Add mode
 *   item={object}          → Edit mode (pre-filled)
 *   prefilledCountry       → drill-down context (hides country dropdown)
 *
 * Modes:
 *   Add  + drill-down  → context header shown, no country dropdown
 *   Add  + standalone  → country dropdown shown
 *   Edit + drill-down  → context header shown, no country dropdown
 *   Edit + standalone  → country dropdown shown (pre-filled)
 *
 * Future: "Move" (reassign to different country) = separate dialog.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCreateRegion, useUpdateRegion } from "./queries";
import { useCountries } from "../country/queries";

const formSchema = z.object({
  countryId: z.string().min(1, "Country is required"),
  regionName: z
    .string()
    .min(1, "Region name is required")
    .max(30, "Region name cannot exceed 30 characters"),
});

export default function RegionFormDialog({
  open,
  onOpenChange,
  showConfirmation,
  item = null,             // null → Add | { REGION_ID, REGION_NAME, COUNTRY_ID } → Edit
  prefilledCountry = null, // { COUNTRY_ID, COUNTRY_NAME } from drill-down
}) {
  const isEditMode = !!item;
  const isDrillDownMode = !!prefilledCountry;

  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Only fetch countries in standalone mode
  const { data: countries = [], isLoading: isCountriesLoading } = useCountries({
    enabled: !isDrillDownMode,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { countryId: "", regionName: "" },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) {
      form.reset({
        countryId: isDrillDownMode
          ? String(prefilledCountry.COUNTRY_ID)
          : isEditMode
          ? String(item.COUNTRY_ID || "")
          : "",
        regionName: isEditMode ? (item.REGION_NAME || "") : "",
      });
    }
  }, [open, item, prefilledCountry]);

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: item.REGION_ID,
          data: {
            COUNTRY_ID: Number(data.countryId),
            REGION_NAME: data.regionName,
          },
        });
        toast.success("Region updated successfully!");
      } else {
        await createMutation.mutateAsync({
          COUNTRY_ID: Number(data.countryId),
          REGION_NAME: data.regionName,
        });
        toast.success("Region created successfully!");
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error?.message ||
          `Failed to ${isEditMode ? "update" : "create"} region. Please try again.`
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
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {isEditMode ? "Edit Region" : "Add New Region"}
              </DialogTitle>

              {/* Drill-down context header */}
              {isDrillDownMode ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isEditMode ? "Inside: " : "Adding to: "}
                    <span className="font-medium text-foreground">
                      {prefilledCountry.COUNTRY_NAME}
                    </span>
                  </p>
                </div>
              ) : (
                <DialogDescription>
                  {isEditMode
                    ? `Editing "${item.REGION_NAME}"`
                    : "Create a new region in the system"}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">

            {/* Country dropdown — standalone mode only */}
            {!isDrillDownMode && (
              <FormField
                control={form.control}
                name="countryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Country <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isCountriesLoading || isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isCountriesLoading
                                ? "Loading countries..."
                                : "Select a country"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem
                            key={country.COUNTRY_ID}
                            value={String(country.COUNTRY_ID)}
                          >
                            {country.COUNTRY_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Region Name */}
            <FormField
              control={form.control}
              name="regionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Region Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Dhaka Division"
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
                  "Update Region"
                ) : (
                  "Save Region"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}