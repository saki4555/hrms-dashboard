import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/DatePicker";
import { cn } from "@/lib/utils";
import { CascadeCombobox } from "./cascade-combobox";
import {
  useCountriesLookup,
  useDistrictsLookup,
  useRegionsLookup,
  useUpazillasLookup,
} from "../../../../api/location-lookup-queries";

/**
 * AddressFields
 *
 * Works for both Add (no initial IDs) and Update (pass initialCountryId etc.
 * so the cascade dropdowns are unlocked and pre-loaded on mount).
 */
export function AddressFields({
  form,
  prefix,
  disabled,
  initialCountryId = null,
  initialRegionId = null,
  initialDistrictId = null,
}) {
  const [selectedCountryId, setSelectedCountryId] = useState(initialCountryId);
  const [selectedRegionId, setSelectedRegionId] = useState(initialRegionId);
  const [selectedDistrictId, setSelectedDistrictId] = useState(initialDistrictId);

  // Sync if initial IDs arrive late (data loads after first render)
  useEffect(() => {
    if (initialCountryId && !selectedCountryId) setSelectedCountryId(initialCountryId);
  }, [initialCountryId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialRegionId && !selectedRegionId) setSelectedRegionId(initialRegionId);
  }, [initialRegionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialDistrictId && !selectedDistrictId) setSelectedDistrictId(initialDistrictId);
  }, [initialDistrictId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: countries = [], isLoading: countriesLoading } = useCountriesLookup();
  const { data: regions = [], isLoading: regionsLoading } = useRegionsLookup(selectedCountryId);
  const { data: districts = [], isLoading: districtsLoading } = useDistrictsLookup(selectedRegionId);
  const { data: upazillas = [], isLoading: upazillasLoading } = useUpazillasLookup(selectedDistrictId);

  const fieldClass = (fieldState) => cn(
    "transition-all duration-200",
    !fieldState?.error && fieldState?.isDirty && "border-emerald-500/50",
  );

  return (
    <div className="space-y-5">
      {/* Address lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.address1`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Address *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Enter address" disabled={disabled} {...field} className={fieldClass(fieldState)} />
                  {field.value && !fieldState.error && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.address1B`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Address (Bangla) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="ঠিকানা লিখুন" disabled={disabled} {...field} className={fieldClass(fieldState)} />
                  {field.value && !fieldState.error && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      {/* Country → Region */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.country`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Country *</FormLabel>
              <CascadeCombobox
                value={field.value}
                items={countries}
                idKey="COUNTRY_ID"
                nameKey="COUNTRY_NAME"
                placeholder={countriesLoading ? "Loading..." : "Select country"}
                disabled={disabled || countriesLoading}
                onSelect={(item) => {
                  field.onChange(item.COUNTRY_NAME);
                  setSelectedCountryId(item.COUNTRY_ID);
                  form.setValue(`${prefix}.region`, "");
                  form.setValue(`${prefix}.district`, "");
                  form.setValue(`${prefix}.upazilla`, "");
                  setSelectedRegionId(null);
                  setSelectedDistrictId(null);
                }}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.region`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Region / Division *</FormLabel>
              <CascadeCombobox
                value={field.value}
                items={regions}
                idKey="REGION_ID"
                nameKey="REGION_NAME"
                placeholder={!selectedCountryId ? "Select country first" : regionsLoading ? "Loading..." : "Select region"}
                disabled={disabled || !selectedCountryId || regionsLoading}
                onSelect={(item) => {
                  field.onChange(item.REGION_NAME);
                  setSelectedRegionId(item.REGION_ID);
                  form.setValue(`${prefix}.district`, "");
                  form.setValue(`${prefix}.upazilla`, "");
                  setSelectedDistrictId(null);
                }}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      {/* District → Upazilla */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.district`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">District *</FormLabel>
              <CascadeCombobox
                value={field.value}
                items={districts}
                idKey="DISTRICT_ID"
                nameKey="DISTRICT_NAME"
                placeholder={!selectedRegionId ? "Select region first" : districtsLoading ? "Loading..." : "Select district"}
                disabled={disabled || !selectedRegionId || districtsLoading}
                onSelect={(item) => {
                  field.onChange(item.DISTRICT_NAME);
                  setSelectedDistrictId(item.DISTRICT_ID);
                  form.setValue(`${prefix}.upazilla`, "");
                }}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.upazilla`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Upazilla *</FormLabel>
              <CascadeCombobox
                value={field.value}
                items={upazillas}
                idKey="UPAZILLA_ID"
                nameKey="UPAZILLA_NAME"
                placeholder={!selectedDistrictId ? "Select district first" : upazillasLoading ? "Loading..." : "Select upazilla"}
                disabled={disabled || !selectedDistrictId || upazillasLoading}
                onSelect={(item) => field.onChange(item.UPAZILLA_NAME)}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      {/* Union & Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.unions`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Union *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Enter union" disabled={disabled} {...field} className={fieldClass(fieldState)} />
                  {field.value && !fieldState.error && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.area`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Area / Village *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Enter area" disabled={disabled} {...field} className={fieldClass(fieldState)} />
                  {field.value && !fieldState.error && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.effectiveStartDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Effective Start Date *</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={disabled} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.effectiveEndDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Effective End Date *</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={disabled} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}