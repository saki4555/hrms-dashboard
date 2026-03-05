/**
 * add-district-dialog.jsx
 *
 * Changes from original:
 * - Accepts optional `prefilledCountry` and `prefilledRegion` props
 * - When both are provided (drill-down mode):
 *     • Country + Region dropdowns are REMOVED from the form
 *     • "Context Header" sub-header shown: "Adding to: Sylhet, Bangladesh"
 *     • IDs are injected directly into submit payload
 * - When props NOT provided (standalone use):
 *     • Behaves exactly as the original
 */

import { useEffect, useMemo, useRef } from "react";
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
import { Landmark, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCreateDistrict } from "./queries";
import { useCountries } from "../country/queries";
import { useRegions } from "../region/queries";

const formSchema = z.object({
  countryId: z.string().min(1, "Country is required"),
  regionId: z.string().min(1, "Region is required"),
  districtName: z
    .string()
    .min(1, "District name is required")
    .max(30, "District name cannot exceed 30 characters"),
});

export default function AddDistrictDialog({
  open,
  onOpenChange,
  showConfirmation,
  prefilledCountry = null, // { COUNTRY_ID, COUNTRY_NAME }
  prefilledRegion = null,  // { REGION_ID, REGION_NAME }
}) {
  const createDistrictMutation = useCreateDistrict();

  const isDrillDownMode = !!prefilledCountry && !!prefilledRegion;

  // Only fetch when in standalone mode
  const { data: countries = [], isLoading: isCountriesLoading } = useCountries({
    enabled: !isDrillDownMode,
  });
  const { data: allRegions = [], isLoading: isRegionsLoading } = useRegions({
    enabled: !isDrillDownMode,
  });

  const isCountryMounted = useRef(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { countryId: "", regionId: "", districtName: "" },
  });

  const {
    formState: { isDirty },
    watch,
    setValue,
  } = form;

  const selectedCountryId = watch("countryId");

  // Deduplicate regions by name for standalone mode
  const filteredRegions = useMemo(() => {
    if (isDrillDownMode || !selectedCountryId) return [];
    const seenNames = new Set();
    return allRegions.filter((r) => {
      const rCountryId = String(r.COUNTRY_ID).trim();
      const selected = String(selectedCountryId).trim();
      const nameKey = String(r.REGION_NAME).trim().toLowerCase();
      if (rCountryId !== selected) return false;
      if (seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);
      return true;
    });
  }, [allRegions, selectedCountryId, isDrillDownMode]);

  useEffect(() => {
    if (open) {
      isCountryMounted.current = false;
      form.reset({
        countryId: prefilledCountry ? String(prefilledCountry.COUNTRY_ID) : "",
        regionId: prefilledRegion ? String(prefilledRegion.REGION_ID) : "",
        districtName: "",
      });
    }
  }, [open, prefilledCountry, prefilledRegion]);

  // Reset region when country changes (standalone mode only)
  useEffect(() => {
    if (isDrillDownMode) return;
    if (!isCountryMounted.current) {
      isCountryMounted.current = true;
      return;
    }
    setValue("regionId", "", { shouldDirty: false, shouldValidate: false });
  }, [selectedCountryId, isDrillDownMode]);

  const onSubmit = async (data) => {
    try {
      await createDistrictMutation.mutateAsync({
        COUNTRY_ID: Number(data.countryId),
        REGION_ID: Number(data.regionId),
        DISTRICT_NAME: data.districtName,
      });
      toast.success("District created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error?.message || "Failed to create district. Please try again."
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
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add New District</DialogTitle>

              {/* Context Header — drill-down mode */}
              {isDrillDownMode ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Adding to:{" "}
                    <span className="font-medium text-foreground">
                      {prefilledRegion.REGION_NAME}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}· {prefilledCountry.COUNTRY_NAME}
                    </span>
                  </p>
                </div>
              ) : (
                <DialogDescription>
                  Create a new district in the system
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            {/* Standalone mode: show Country + Region dropdowns */}
            {!isDrillDownMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country */}
                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Country <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val)}
                        value={field.value || ""}
                        disabled={isCountriesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isCountriesLoading
                                  ? "Loading..."
                                  : "Select a country"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem
                              key={`country-${country.COUNTRY_ID}`}
                              value={String(country.COUNTRY_ID).trim()}
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

                {/* Region */}
                <FormField
                  control={form.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Region <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val)}
                        value={field.value || ""}
                        disabled={!selectedCountryId || isRegionsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedCountryId
                                  ? "Select a country first"
                                  : isRegionsLoading
                                  ? "Loading regions..."
                                  : filteredRegions.length === 0
                                  ? "No regions for this country"
                                  : "Select a region"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredRegions.map((region) => (
                            <SelectItem
                              key={`region-${region.REGION_ID}-${region.REGION_NAME}`}
                              value={String(region.REGION_ID).trim()}
                            >
                              {region.REGION_NAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* District Name — always shown */}
            <FormField
              control={form.control}
              name="districtName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    District Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mirpur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createDistrictMutation.isPending}
              >
                {createDistrictMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Save District"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}