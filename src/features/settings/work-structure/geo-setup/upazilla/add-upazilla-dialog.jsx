/**
 * add-upazilla-dialog.jsx
 *
 * Changes from original:
 * - Accepts optional `prefilledCountry`, `prefilledRegion`, `prefilledDistrict` props
 * - When all three are provided (drill-down mode):
 *     • All parent dropdowns (Country, Region, District) are REMOVED
 *     • "Context Header": "Adding to: Sunamganj · Sylhet · Bangladesh"
 *     • District ID is injected directly into submit payload
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
import { Building2, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCreateUpazilla } from "./queries";
import { useCountries } from "../country/queries";
import { useRegions } from "../region/queries";
import { useDistricts } from "../district/queries";

const formSchema = z.object({
  countryId: z.string().min(1, "Country is required"),
  regionId: z.string().min(1, "Region is required"),
  districtId: z.string().min(1, "District is required"),
  upazillaName: z
    .string()
    .min(1, "Upazilla name is required")
    .max(100, "Upazilla name cannot exceed 100 characters"),
});

export default function AddUpazillaDialog({
  open,
  onOpenChange,
  showConfirmation,
  prefilledCountry = null,  // { COUNTRY_ID, COUNTRY_NAME }
  prefilledRegion = null,   // { REGION_ID, REGION_NAME }
  prefilledDistrict = null, // { DISTRICT_ID, DISTRICT_NAME }
}) {
  const createUpazillaMutation = useCreateUpazilla();

  const isDrillDownMode =
    !!prefilledCountry && !!prefilledRegion && !!prefilledDistrict;

  // Only fetch lists when in standalone mode
  const { data: countries = [], isLoading: isCountriesLoading } = useCountries({
    enabled: !isDrillDownMode,
  });
  const { data: allRegions = [], isLoading: isRegionsLoading } = useRegions({
    enabled: !isDrillDownMode,
  });
  const { data: allDistricts = [], isLoading: isDistrictsLoading } = useDistricts({
    enabled: !isDrillDownMode,
  });

  const isCountryMounted = useRef(false);
  const isRegionMounted = useRef(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryId: "",
      regionId: "",
      districtId: "",
      upazillaName: "",
    },
  });

  const {
    formState: { isDirty },
    watch,
    setValue,
  } = form;

  const selectedCountryId = watch("countryId");
  const selectedRegionId = watch("regionId");

  // Standalone mode — filtered lists
  const filteredRegions = useMemo(() => {
    if (isDrillDownMode || !selectedCountryId) return [];
    const seen = new Set();
    return allRegions.filter((r) => {
      const id = String(r.REGION_ID);
      if (String(r.COUNTRY_ID) !== selectedCountryId) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [allRegions, selectedCountryId, isDrillDownMode]);

  const filteredDistricts = useMemo(() => {
    if (isDrillDownMode || !selectedRegionId) return [];
    const seen = new Set();
    return allDistricts.filter((d) => {
      const id = String(d.DISTRICT_ID);
      if (String(d.REGION_ID) !== selectedRegionId) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [allDistricts, selectedRegionId, isDrillDownMode]);

  // Reset form on open
  useEffect(() => {
    if (open) {
      isCountryMounted.current = false;
      isRegionMounted.current = false;
      form.reset({
        countryId: prefilledCountry ? String(prefilledCountry.COUNTRY_ID) : "",
        regionId: prefilledRegion ? String(prefilledRegion.REGION_ID) : "",
        districtId: prefilledDistrict ? String(prefilledDistrict.DISTRICT_ID) : "",
        upazillaName: "",
      });
    }
  }, [open, prefilledCountry, prefilledRegion, prefilledDistrict]);

  // Cascade resets — standalone mode only
  useEffect(() => {
    if (isDrillDownMode) return;
    if (!isCountryMounted.current) {
      isCountryMounted.current = true;
      return;
    }
    setValue("regionId", "", { shouldDirty: false, shouldValidate: false });
    setValue("districtId", "", { shouldDirty: false, shouldValidate: false });
  }, [selectedCountryId, isDrillDownMode]);

  useEffect(() => {
    if (isDrillDownMode) return;
    if (!isRegionMounted.current) {
      isRegionMounted.current = true;
      return;
    }
    setValue("districtId", "", { shouldDirty: false, shouldValidate: false });
  }, [selectedRegionId, isDrillDownMode]);

  const onSubmit = async (data) => {
    try {
      await createUpazillaMutation.mutateAsync({
        UPAZILLA_NAME: data.upazillaName,
        DISTRICT_ID: Number(data.districtId),
      });
      toast.success("Upazilla created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error?.message || "Failed to create upazilla. Please try again."
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
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add New Upazilla</DialogTitle>

              {/* Context Header — drill-down mode */}
              {isDrillDownMode ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Adding to:{" "}
                    <span className="font-medium text-foreground">
                      {prefilledDistrict.DISTRICT_NAME}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}· {prefilledRegion.REGION_NAME} · {prefilledCountry.COUNTRY_NAME}
                    </span>
                  </p>
                </div>
              ) : (
                <DialogDescription>
                  Create a new upazilla in the system
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">

            {/* Standalone mode: show all parent dropdowns */}
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
                                  ? "No regions available"
                                  : "Select a region"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredRegions.map((region) => (
                            <SelectItem
                              key={`region-${region.REGION_ID}`}
                              value={String(region.REGION_ID)}
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

                {/* District */}
                <FormField
                  control={form.control}
                  name="districtId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        District <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val)}
                        value={field.value || ""}
                        disabled={!selectedRegionId || isDistrictsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedRegionId
                                  ? "Select a region first"
                                  : isDistrictsLoading
                                  ? "Loading districts..."
                                  : filteredDistricts.length === 0
                                  ? "No districts available"
                                  : "Select a district"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredDistricts.map((district) => (
                            <SelectItem
                              key={`district-${district.DISTRICT_ID}`}
                              value={String(district.DISTRICT_ID)}
                            >
                              {district.DISTRICT_NAME}
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

            {/* Upazilla Name — always shown */}
            <FormField
              control={form.control}
              name="upazillaName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Upazilla Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Savar" {...field} />
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
                disabled={createUpazillaMutation.isPending}
              >
                {createUpazillaMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Save Upazilla"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}