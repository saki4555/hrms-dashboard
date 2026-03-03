import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Home, MapPin } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

import { AddressFields } from "./address-fields";
import { SheetFormFooter, DISCARD_CONFIRM, employeeBasePayload, assignToPayload, fd, parseDate } from "./sheet-helper";
import { addressesSchema } from "./employee-detail-schemas";
import { useUpdateEmployee } from "../queries";
import { is } from "date-fns/locale";

// Convert a stored address object → form default values
const addrDefaults = (a) => ({
  address1:           a?.ADDRESS1 || "",
  address1B:          a?.ADDRESS1_B || "",
  country:            a?.COUNTRY || "",
  region:             a?.REGION || "",
  district:           a?.DISTRICT || "",
  upazilla:           a?.UPAZILLA || "",
  unions:             a?.UNIONS || "",
  area:               a?.AREA || "",
  effectiveStartDate: parseDate(a?.EFFECTIVE_START_DATE),
  effectiveEndDate:   parseDate(a?.EFFECTIVEEND_DATE),
});

// Convert form values → API payload
const formAddrToPayload = (a) => ({
  ADDRESS1:             a.address1,
  ADDRESS1_B:           a.address1B,
  COUNTRY:              a.country,
  REGION:               a.region,
  DISTRICT:             a.district,
  UPAZILLA:             a.upazilla,
  UNIONS:               a.unions,
  AREA:                 a.area,
  EFFECTIVE_START_DATE: fd(a.effectiveStartDate),
  EFFECTIVEEND_DATE:    fd(a.effectiveEndDate),
});

export function EditAddressSheet({ employee, open, onClose, showConfirmation }) {
  const { mutateAsync, isPending } = useUpdateEmployee();
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [presentIds, setPresentIds]   = useState({ countryId: null, regionId: null, districtId: null });
  const [permanentIds, setPermanentIds] = useState({ countryId: null, regionId: null, districtId: null });
  const [formSeeded, setFormSeeded] = useState(false);

  const form = useForm({
    resolver: zodResolver(addressesSchema),
    defaultValues: {
      presentAddress:  addrDefaults(null),
      permanentAddress: addrDefaults(null),
    },
  });
  const { isDirty } = form.formState;

  useEffect(() => {
    if (!open || !employee) return;
    form.reset({
      presentAddress:  addrDefaults(employee.presentAddress),
      permanentAddress: addrDefaults(employee.permanentAddress),
    });
    setPresentIds({
      countryId:  employee.presentAddress?.COUNTRY_ID  || null,
      regionId:   employee.presentAddress?.REGION_ID   || null,
      districtId: employee.presentAddress?.DISTRICT_ID || null,
    });
    setPermanentIds({
      countryId:  employee.permanentAddress?.COUNTRY_ID  || null,
      regionId:   employee.permanentAddress?.REGION_ID   || null,
      districtId: employee.permanentAddress?.DISTRICT_ID || null,
    });
    setFormSeeded(true);
    setSameAsPresent(false);
  }, [open, employee]);

  const handleSameAsPresent = (checked) => {
    setSameAsPresent(checked);
    if (checked) {
      const p = form.getValues("presentAddress");
      Object.keys(p).forEach((k) =>
        form.setValue(`permanentAddress.${k}`, p[k], { shouldDirty: true }),
      );
    }
  };

  const handleAttemptClose = async () => {
    if (isDirty) {
      const ok = await showConfirmation(DISCARD_CONFIRM);
      if (!ok) return;
    }
    form.reset();
    setFormSeeded(false);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: employeeBasePayload(employee),
          address: {
            present:   formAddrToPayload(data.presentAddress),
            permanent: formAddrToPayload(data.permanentAddress),
          },
          assignment: assignToPayload(employee.assignment),
          STATUS: employee.STATUS,
        },
      });
      toast.success("Addresses updated!");
      form.reset(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update addresses.");
    }
  };

  const LoadingPlaceholder = () => (
    <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
      <Spinner className="h-4 w-4" /> Loading…
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleAttemptClose(); }}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Home className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <SheetTitle>Addresses</SheetTitle>
              <SheetDescription>Update present and permanent address details.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Present Address */}
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold mb-4">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Present Address
                </p>
                {formSeeded ? (
                  <AddressFields
                    form={form} prefix="presentAddress" disabled={isPending}
                    initialCountryId={presentIds.countryId}
                    initialRegionId={presentIds.regionId}
                    initialDistrictId={presentIds.districtId}
                  />
                ) : <LoadingPlaceholder />}
              </div>

              {/* Same-as-present toggle */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-muted/30">
                <Switch
                  id="sap-toggle"
                  checked={sameAsPresent}
                  onCheckedChange={handleSameAsPresent}
                  disabled={isPending}
                />
                <Label htmlFor="sap-toggle" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  Permanent address same as present address
                </Label>
              </div>

              {/* Permanent Address */}
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold mb-4">
                  <Home className="h-4 w-4 text-muted-foreground" /> Permanent Address
                </p>
                {formSeeded ? (
                  <AddressFields
                    form={form} prefix="permanentAddress" disabled={isPending || sameAsPresent}
                    initialCountryId={permanentIds.countryId}
                    initialRegionId={permanentIds.regionId}
                    initialDistrictId={permanentIds.districtId}
                  />
                ) : <LoadingPlaceholder />}
              </div>
            </div>

            <SheetFormFooter onCancel={handleAttemptClose} isPending={isPending} />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}