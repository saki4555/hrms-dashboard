// src/features/payroll/pay-structure/pay-structure-form-sheet.jsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useCreatePayStructure, useUpdatePayStructure } from "./queries";

const schema = z.object({
  name:        z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
});

export default function PayStructureFormSheet({ open, onOpenChange, structure, showConfirmation }) {
  const isEdit = !!structure;
  const { mutate: create, isPending: isCreating } = useCreatePayStructure();
  const { mutate: update, isPending: isUpdating } = useUpdatePayStructure();
  const isPending = isCreating || isUpdating;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) {
      form.reset(isEdit
        ? { name: structure.NAME, description: structure.DESCRIPTION ?? "" }
        : { name: "", description: "" }
      );
    }
  }, [open, structure]);

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title:       "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText:  "Keep Editing",
        variant:     "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data) => {
    if (isEdit) {
      update(
        { id: structure.PAY_STRUCTURE_ID, ...data },
        {
          onSuccess: () => { toast.success("Pay structure updated."); form.reset(); onOpenChange(false); },
          onError:   (err) => toast.error(err.message),
        }
      );
    } else {
      create(data, {
        onSuccess: () => { toast.success("Pay structure created."); form.reset(); onOpenChange(false); },
        onError:   (err) => toast.error(err.message),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-md w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>{isEdit ? "Edit Pay Structure" : "Add Pay Structure"}</SheetTitle>
              <SheetDescription>
                {isEdit ? "Update structure details" : "Create a new salary pay structure"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Standard Staff, Management Grade" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" rows={3} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <><Spinner className="mr-2 h-4 w-4" />{isEdit ? "Saving..." : "Creating..."}</>
                  : isEdit ? "Save Changes" : "Create Structure"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}