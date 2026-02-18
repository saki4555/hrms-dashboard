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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Briefcase } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdatePosition } from "./queries";
import { useGrades } from "../hr-grade/queries";

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Position title is required")
    .max(200, "Title cannot exceed 200 characters"),
  grade: z
    .string()
    .max(50, "Grade cannot exceed 50 characters")
    .optional()
    .or(z.literal("")),
  levels: z
    .string()
    .max(50, "Levels cannot exceed 50 characters")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(4000, "Notes cannot exceed 4000 characters")
    .optional()
    .or(z.literal("")),
});

export default function UpdateHRPositionDialog({
  open,
  onOpenChange,
  showConfirmation,
  position,
}) {

  
  const { data: grades = [], isLoading: isGradesLoading } = useGrades();
  // if(isGradesLoading) return <p>hello</p>
  const updatePositionMutation = useUpdatePosition();
  console.log("grades:", grades, "position.GRADE:", position?.GRADE);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      grade: "",
      levels: "",
      notes: "",
    },
  });

  const {
    formState: { isDirty },
  } = form;

  // Populate form when position data changes
  useEffect(() => {
    if (position && !isGradesLoading) {
      form.reset({
        title: position.TITLE || "",
        grade: position.GRADE || "",
        levels: position.LEVELS || "",
        notes: position.NOTES || "",
      });
    }
  }, [position,  form]);

  const onSubmit = async (data) => {
    if (!position?.POSITION_ID) {
      toast.error("Position ID is missing");
      return;
    }

    try {
      const backendData = {
        TITLE: data.title,
        GRADE: data.grade || null,
        LEVELS: data.levels || null,
        NOTES: data.notes || null,
        UPDATED_BY: "admin", // TODO: replace with logged-in user
        // UPDATED_DATE auto-filled by DB
      };

      await updatePositionMutation.mutateAsync({
        id: position.POSITION_ID,
        data: backendData,
      });

      toast.success("HR position updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error?.message || "Failed to update HR position. Please try again.",
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

  const isSubmitting = updatePositionMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update HR Position</DialogTitle>
              <DialogDescription>
                Edit position details for "{position?.TITLE}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title - full width */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Position Title <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Senior Software Engineer"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grade */}
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isGradesLoading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              isGradesLoading
                                ? "Loading grades..."
                                : "Select a grade"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade.ID} value={grade.GRADE}>
                            {grade.GRADE}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Levels */}
              <FormField
                control={form.control}
                name="levels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Levels</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. L3"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes - full width */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes about this position..."
                        className="resize-none min-h-[100px]"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  "Update Position"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
