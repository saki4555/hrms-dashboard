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
import { Map } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateRegion } from "./queries";
import { useCountries } from "../country/queries";

const formSchema = z.object({
  countryId: z.string().min(1, "Country is required"),
  regionName: z
    .string()
    .min(1, "Region name is required")
    .max(30, "Region name cannot exceed 30 characters"),
});

export default function UpdateRegionDialog({
  open,
  onOpenChange,
  showConfirmation,
  region,
}) {
  const updateRegionMutation = useUpdateRegion();
  const { data: countries = [], isLoading: isCountriesLoading } = useCountries();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryId: "",
      regionName: "",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (region) {
      form.reset({
        countryId: region.COUNTRY_ID ? String(region.COUNTRY_ID) : "",
        regionName: region.REGION_NAME || "",
      });
    }
  }, [region]);

  const onSubmit = async (data) => {
    if (!region?.REGION_ID) {
      toast.error("Region ID is missing");
      return;
    }

    try {
      await updateRegionMutation.mutateAsync({
        id: region.REGION_ID,
        data: {
          COUNTRY_ID: Number(data.countryId),
          REGION_NAME: data.regionName,
        },
      });

      toast.success("Region updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update region. Please try again.");
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

  const isSubmitting = updateRegionMutation.isPending;

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
              <DialogTitle>Update Region</DialogTitle>
              <DialogDescription>
                Edit region details for "{region?.REGION_NAME}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
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
                    disabled={isSubmitting || isCountriesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isCountriesLoading ? "Loading countries..." : "Select a country"
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
                  "Update Region"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}