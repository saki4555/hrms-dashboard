import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdCard } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/DatePicker";

import { SmartRadioGroup } from "./smart-radio-group";
import { FieldWithCounter } from "./field-with-counter";
import { SheetFormFooter, DISCARD_CONFIRM, employeeBasePayload, addrToPayload, assignToPayload, fd, parseDate } from "./sheet-helper";
import { personalSchema } from "./employee-detail-schemas";
import { useUpdateEmployee } from "../queries";
import { MARITAL_STATUS_OPTIONS, REG_DISABILITY_OPTIONS } from "@/lib/constants/employeeOptions";

export function EditPersonalSheet({ employee, open, onClose, showConfirmation }) {
  const { mutateAsync, isPending } = useUpdateEmployee();

  const form = useForm({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      title: "", firstName: "", lastName: "",
      fathersName: "", fathersNameB: "",
      mothersName: "", mothersNameB: "",
      gender: "", nid: "", birthRegNo: "",
      townOfBirth: "", regionOfBirth: "", countryOfBirth: "",
      maritalStatus: "", nationality: "", regDisability: "",
    },
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!open || !employee) return;
    form.reset({
      title:          employee.TITLE || "",
      firstName:      employee.FIRST_NAME || "",
      lastName:       employee.LAST_NAME || "",
      fathersName:    employee.FATHERS_NAME || "",
      fathersNameB:   employee.FATHERS_NAME_B || "",
      mothersName:    employee.MOTHERS_NAME || "",
      mothersNameB:   employee.MOTHERS_NAME_B || "",
      gender:         employee.GENDER || "",
      dateOfBirth:    parseDate(employee.DATE_OF_BIRTH),
      nid:            employee.NID || "",
      birthRegNo:     employee.BIRTH_REG_NO || "",
      townOfBirth:    employee.TOWN_OF_BIRTH || "",
      regionOfBirth:  employee.REGION_OF_BIRTH || "",
      countryOfBirth: employee.COUNTRY_OF_BIRTH || "",
      maritalStatus:  employee.MARRITIAL_STATUS?.toString() || "",
      nationality:    employee.NATIONALITY || "",
      regDisability:  employee.REG_DISABILITY?.toString() || "",
    });
  }, [open, employee]);

const handleAttemptClose = async () => {
  if (isDirty) {          // ← use the destructured variable, not form.formState.isDirty
    const ok = await showConfirmation(DISCARD_CONFIRM);
    if (!ok) return;
  }
  form.reset();
  onClose();
};

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: {
            ...employeeBasePayload(employee),
            TITLE:           data.title,
            FIRST_NAME:      data.firstName,
            LAST_NAME:       data.lastName,
            FATHERS_NAME:    data.fathersName,
            FATHERS_NAME_B:  data.fathersNameB,
            MOTHERS_NAME:    data.mothersName,
            MOTHERS_NAME_B:  data.mothersNameB,
            GENDER:          data.gender,
            DATE_OF_BIRTH:   fd(data.dateOfBirth),
            NID:             data.nid,
            BIRTH_REG_NO:    data.birthRegNo,
            TOWN_OF_BIRTH:   data.townOfBirth,
            REGION_OF_BIRTH: data.regionOfBirth,
            COUNTRY_OF_BIRTH: data.countryOfBirth,
            MARRITIAL_STATUS: parseInt(data.maritalStatus),
            NATIONALITY:     data.nationality,
            REG_DISABILITY:  parseInt(data.regDisability),
          },
          address: {
            present:   addrToPayload(employee.presentAddress),
            permanent: addrToPayload(employee.permanentAddress),
          },
          assignment: assignToPayload(employee.assignment),
          STATUS: employee.STATUS,
        },
      });
      toast.success("Personal details updated!");
      form.reset(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update personal details.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleAttemptClose(); }}>
      <SheetContent className="sm:max-w-2xl  flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <IdCard className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <SheetTitle>Personal Details</SheetTitle>
              <SheetDescription>Update identity, family background, and demographic information.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Title */}
              <SmartRadioGroup
                form={form}
                name="title"
                label="Title"
                options={["Mr.", "Mrs.", "Ms.", "Dr."]}
                disabled={isPending}
              />

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWithCounter form={form} name="firstName" label="First Name"  placeholder="Enter first name" maxLength={50} disabled={isPending} />
                <FieldWithCounter form={form} name="lastName"  label="Last Name"   placeholder="Enter last name"  maxLength={50} disabled={isPending} />
              </div>

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parents</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWithCounter form={form} name="fathersName"  label="Father's Name"         placeholder="Enter father's name" maxLength={100} disabled={isPending} />
                <FieldWithCounter form={form} name="fathersNameB" label="Father's Name (Bangla)" placeholder="পিতার নাম"         maxLength={100} disabled={isPending} />
                <FieldWithCounter form={form} name="mothersName"  label="Mother's Name"         placeholder="Enter mother's name" maxLength={100} disabled={isPending} />
                <FieldWithCounter form={form} name="mothersNameB" label="Mother's Name (Bangla)" placeholder="মাতার নাম"         maxLength={100} disabled={isPending} />
              </div>

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Demographics</p>

              <SmartRadioGroup form={form} name="gender" label="Gender" options={["Male", "Female", "Other"]} disabled={isPending} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Date of Birth *</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} placeholder="Select date" disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FieldWithCounter form={form} name="nationality" label="Nationality" placeholder="Enter nationality" maxLength={30} disabled={isPending} />
              </div>

              <SmartRadioGroup form={form} name="maritalStatus" label="Marital Status" options={MARITAL_STATUS_OPTIONS} disabled={isPending} />

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identification & Birth</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWithCounter form={form} name="nid"            label="NID"                      placeholder="NID number"     maxLength={30} disabled={isPending} />
                <FieldWithCounter form={form} name="birthRegNo"     label="Birth Registration No."   placeholder="Birth reg. no"  maxLength={30} disabled={isPending} />
                <FieldWithCounter form={form} name="townOfBirth"    label="Town of Birth"            placeholder="Enter town"     maxLength={30} disabled={isPending} />
                <FieldWithCounter form={form} name="regionOfBirth"  label="Region of Birth"          placeholder="Enter region"   maxLength={30} disabled={isPending} />
                <FieldWithCounter form={form} name="countryOfBirth" label="Country of Birth"         placeholder="Enter country"  maxLength={30} disabled={isPending} />
              </div>

              <SmartRadioGroup form={form} name="regDisability" label="Registered Disability" options={REG_DISABILITY_OPTIONS} disabled={isPending} />
            </div>

            <SheetFormFooter onCancel={handleAttemptClose} isPending={isPending} />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}