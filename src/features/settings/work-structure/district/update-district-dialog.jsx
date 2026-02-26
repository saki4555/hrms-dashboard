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
import { Landmark } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateDistrict } from "./queries";
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

export default function UpdateDistrictDialog({
  open,
  onOpenChange,
  showConfirmation,
  district,
}) {
  const updateDistrictMutation = useUpdateDistrict();
  const { data: countries = [], isLoading: isCountriesLoading } = useCountries();
  const { data: allRegions = [], isLoading: isRegionsLoading } = useRegions();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryId: "",
      regionId: "",
      districtName: "",
    },
  });

  const { formState: { isDirty }, watch, setValue } = form;
  const selectedCountryId = watch("countryId");

  // Deduplicate by REGION_NAME+COUNTRY_ID (not REGION_ID)
  // This shows all unique region names even if DB has duplicate IDs
  const filteredRegions = useMemo(() => {
    if (!selectedCountryId) return [];

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
  }, [allRegions, selectedCountryId]);

  // Populate form when dialog opens
  useEffect(() => {
    if (district && open) {
      form.reset({
        countryId: district.COUNTRY_ID ? String(district.COUNTRY_ID).trim() : "",
        regionId: district.REGION_ID ? String(district.REGION_ID).trim() : "",
        districtName: district.DISTRICT_NAME || "",
      });
    }
  }, [district, open]);

  const handleCountryChange = (value, fieldOnChange) => {
    fieldOnChange(value);
    if (district && String(district.COUNTRY_ID).trim() !== value.trim()) {
      setValue("regionId", "", { shouldDirty: true, shouldValidate: false });
    }
  };

  const onSubmit = async (data) => {
    if (!district?.DISTRICT_ID) {
      toast.error("District ID is missing");
      return;
    }
    try {
      await updateDistrictMutation.mutateAsync({
        id: district.DISTRICT_ID,
        data: {
          COUNTRY_ID: Number(data.countryId),
          REGION_ID: Number(data.regionId),
          DISTRICT_NAME: data.districtName,
        },
      });
      toast.success("District updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update district. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = updateDistrictMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update District</DialogTitle>
              <DialogDescription>
                Edit district details for "{district?.DISTRICT_NAME}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Country */}
              <FormField
                control={form.control}
                name="countryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                    <Select
                      onValueChange={(val) => handleCountryChange(val, field.onChange)}
                      value={field.value || ""}
                      disabled={isSubmitting || isCountriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={isCountriesLoading ? "Loading..." : "Select a country"} />
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

              {/* Region — deduplicated by NAME */}
              <FormField
                control={form.control}
                name="regionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region <span className="text-destructive">*</span></FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val)}
                      value={field.value || ""}
                      disabled={isSubmitting || !selectedCountryId || isRegionsLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              !selectedCountryId ? "Select a country first"
                                : isRegionsLoading ? "Loading regions..."
                                : filteredRegions.length === 0 ? "No regions for this country"
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

              {/* District Name */}
              <FormField
                control={form.control}
                name="districtName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>District Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mirpur" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Spinner className="mr-2 h-4 w-4" />Updating...</>
                ) : "Update District"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}