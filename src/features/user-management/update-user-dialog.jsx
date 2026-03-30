import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateUser } from "./queries";

const formSchema = z.object({
  username:   z.string().min(1, "Username is required").max(100),
  employeeId: z.coerce.number().optional().nullable(),
  locationId: z.coerce.number().optional().nullable(),
  status:     z.string(),
});

export default function UpdateUserDialog({ open, onOpenChange, showConfirmation, user }) {
  const updateMutation = useUpdateUser();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", employeeId: "", locationId: "", status: "ACTIVE" },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (user) {
      form.reset({
        username:   user.USERNAME    || "",
        employeeId: user.EMPLOYEE_ID ?? "",
        locationId: user.LOCATION_ID ?? "",
        status:     user.STATUS      || "ACTIVE",
      });
    }
  }, [user]);

  const onSubmit = async (data) => {
    if (!user?.ID) return toast.error("User ID is missing");
    try {
      await updateMutation.mutateAsync({
        id: user.ID,
        data: {
          USERNAME:    data.username,
          EMPLOYEE_ID: data.employeeId || null,
          LOCATION_ID: data.locationId || null,
          STATUS:      data.status,
        },
      });
      toast.success("User updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update user.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Discard", cancelText: "Keep Editing", variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update User</DialogTitle>
              <DialogDescription>Editing "{user?.USERNAME}"</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField control={form.control} name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. john.doe" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Link to employee" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location ID</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Location" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField control={form.control} name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Updating...</> : "Update User"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}