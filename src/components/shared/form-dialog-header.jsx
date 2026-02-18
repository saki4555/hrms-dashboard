import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function FormDialogHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <DialogHeader className="border-b pb-2">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            className="h-6 w-6 text-primary/80 mt-1"
            strokeWidth={1.5}
          />
        )}

        <div>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </div>
      </div>
    </DialogHeader>
  );
}
