/**
 * region-move-dialog.jsx
 *
 * Moves a Region to a different Country.
 * Single dropdown — only the parent (Country) is selectable.
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
import { AlertTriangle, Map } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateRegion } from "./queries";
import { useCountriesLookup } from "@/api/location-lookup-queries";

export default function RegionMoveDialog({
  open,
  onOpenChange,
  item, // { REGION_ID, REGION_NAME, COUNTRY_ID }
}) {
  const [selectedCountryId, setSelectedCountryId] = useState("");

  const { data: countries = [], isLoading: isCountriesLoading } = useCountriesLookup();
  const updateMutation = useUpdateRegion();

  const currentCountry = countries.find(
    (c) => String(c.COUNTRY_ID) === String(item?.COUNTRY_ID)
  );

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setSelectedCountryId("");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = async () => {
    if (!selectedCountryId) return;

    try {
      await updateMutation.mutateAsync({
        id: item.REGION_ID,
        data: {
          COUNTRY_ID: Number(selectedCountryId),
          REGION_NAME: item.REGION_NAME,
        },
      });
      toast.success(`"${item.REGION_NAME}" moved successfully!`);
      handleOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to move region. Please try again.");
    }
  };

  const selectedCountry = countries.find(
    (c) => String(c.COUNTRY_ID) === selectedCountryId
  );

  const isUnchanged =
    selectedCountryId &&
    String(selectedCountryId) === String(item?.COUNTRY_ID);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Map className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle>Move "{item?.REGION_NAME}"</DialogTitle>
              <DialogDescription>
                Move this region to a different country
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Warning */}
          <Alert variant="warning" className="border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm text-muted-foreground">
              Changing the country will move this region out of the current list.
            </AlertDescription>
          </Alert>

          {/* Current location — read-only context */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Currently in
            </Label>
            <p className="text-sm font-medium px-3 py-2 bg-muted/50 rounded-md">
              {currentCountry?.COUNTRY_NAME ?? "—"}
            </p>
          </div>

          {/* New Country — single dropdown */}
          <div className="space-y-1.5">
            <Label>Move to Country</Label>
            <Select
              value={selectedCountryId}
              onValueChange={setSelectedCountryId}
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

            {isUnchanged && (
              <p className="text-xs text-amber-500">
                This is already the current country.
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
              !selectedCountryId ||
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