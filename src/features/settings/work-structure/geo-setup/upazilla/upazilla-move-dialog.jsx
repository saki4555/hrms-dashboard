/**
 * upazilla-move-dialog.jsx
 *
 * Moves an Upazilla to a different District.
 * Cascade: Country (unlocks) → Region (unlocks) → District
 * Only the final selection (District) is saved.
 */

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Building2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateUpazilla } from "./queries";
import {
  useCountriesLookup,
  useRegionsLookup,
  useDistrictsLookup,
} from "@/api/location-lookup-queries";

export default function UpazillaMoveDialog({
  open,
  onOpenChange,
  item, // { UPAZILLA_ID, UPAZILLA_NAME, DISTRICT_ID, REGION_ID, COUNTRY_ID }
}) {
  // Cascade state — local only, not saved
  const [selectedCountryId,  setSelectedCountryId]  = useState("");
  const [selectedRegionId,   setSelectedRegionId]   = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");

  const { data: countries = [], isLoading: isCountriesLoading } = useCountriesLookup();
  const { data: regions = [],   isLoading: isRegionsLoading }   = useRegionsLookup(
    selectedCountryId || null
  );
  const { data: districts = [], isLoading: isDistrictsLoading } = useDistrictsLookup(
    selectedRegionId || null
  );

  const updateMutation = useUpdateUpazilla();

  // Build current location label
  const currentCountry  = countries.find((c) => String(c.COUNTRY_ID)  === String(item?.COUNTRY_ID));
  const currentRegion   = regions.find((r)   => String(r.REGION_ID)   === String(item?.REGION_ID));
  const currentDistrict = districts.find((d) => String(d.DISTRICT_ID) === String(item?.DISTRICT_ID));

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setSelectedCountryId("");
      setSelectedRegionId("");
      setSelectedDistrictId("");
    }
    onOpenChange(isOpen);
  };

  const handleCountryChange = (value) => {
    setSelectedCountryId(value);
    setSelectedRegionId("");   // reset dependents
    setSelectedDistrictId("");
  };

  const handleRegionChange = (value) => {
    setSelectedRegionId(value);
    setSelectedDistrictId(""); // reset dependent
  };

  const handleConfirm = async () => {
    if (!selectedDistrictId) return;

    try {
      await updateMutation.mutateAsync({
        id: item.UPAZILLA_ID,
        data: {
          UPAZILLA_NAME: item.UPAZILLA_NAME,
          DISTRICT_ID: Number(selectedDistrictId),
        },
      });
      toast.success(`"${item.UPAZILLA_NAME}" moved successfully!`);
      handleOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to move upazilla. Please try again.");
    }
  };

  const isUnchanged =
    selectedDistrictId &&
    String(selectedDistrictId) === String(item?.DISTRICT_ID);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle>Move "{item?.UPAZILLA_NAME}"</DialogTitle>
              <DialogDescription>
                Move this upazilla to a different district
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Warning */}
          <Alert className="border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm text-muted-foreground">
              Changing the district will move this upazilla out of the current list.
            </AlertDescription>
          </Alert>

          {/* Current location — read-only context */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Currently in
            </Label>
            <p className="text-sm font-medium px-3 py-2 bg-muted/50 rounded-md">
              {item?.DISTRICT_NAME ?? "—"}
              <span className="text-muted-foreground font-normal">
                {item?.REGION_NAME  && ` · ${item.REGION_NAME}`}
                {item?.COUNTRY_NAME && ` · ${item.COUNTRY_NAME}`}
              </span>
            </p>
          </div>

          {/* Step 1 — Country */}
          <div className="space-y-1.5">
            <Label>Step 1 — Select Country</Label>
            <Select
              value={selectedCountryId}
              onValueChange={handleCountryChange}
              disabled={isCountriesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isCountriesLoading ? "Loading countries..." : "Select a country"
                  }
                />
              </SelectTrigger>
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
          </div>

          {/* Step 2 — Region (disabled until country selected) */}
          <div className="space-y-1.5">
            <Label className={!selectedCountryId ? "text-muted-foreground" : ""}>
              Step 2 — Select Region
            </Label>
            <Select
              value={selectedRegionId}
              onValueChange={handleRegionChange}
              disabled={!selectedCountryId || isRegionsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedCountryId
                      ? "Select a country first"
                      : isRegionsLoading
                      ? "Loading regions..."
                      : regions.length === 0
                      ? "No regions for this country"
                      : "Select a region"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem
                    key={region.REGION_ID}
                    value={String(region.REGION_ID)}
                  >
                    {region.REGION_NAME}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 3 — District (disabled until region selected) */}
          <div className="space-y-1.5">
            <Label className={!selectedRegionId ? "text-muted-foreground" : ""}>
              Step 3 — Select District
            </Label>
            <Select
              value={selectedDistrictId}
              onValueChange={setSelectedDistrictId}
              disabled={!selectedRegionId || isDistrictsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedRegionId
                      ? "Select a region first"
                      : isDistrictsLoading
                      ? "Loading districts..."
                      : districts.length === 0
                      ? "No districts for this region"
                      : "Select a district"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem
                    key={district.DISTRICT_ID}
                    value={String(district.DISTRICT_ID)}
                  >
                    {district.DISTRICT_NAME}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isUnchanged && (
              <p className="text-xs text-amber-500">
                This is already the current district.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !selectedDistrictId ||
              isUnchanged ||
              updateMutation.isPending
            }
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {updateMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Moving...
              </>
            ) : (
              "Confirm Move"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}