import {
  MoreHorizontal,
  Text,
  FileText,
  Calendar,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataTable } from "@/hooks/use-data-table";
import { format } from "date-fns";
import { useDeletePersonType, usePersonTypes } from "./queries";

export function PersonTypesList() {
  const { data: personTypesData, isLoading, isError } = usePersonTypes();
  const deletePersonType = useDeletePersonType();

  // Query state keys must match column IDs exactly
  const [personType] = useQueryState("PERSON_TYPE", parseAsString.withDefault(""));
  const [description] = useQueryState("DESCRIPTION", parseAsString.withDefault(""));

  // Filter out soft-deleted items and apply search filters
  const filteredData = React.useMemo(() => {
    if (!personTypesData) return [];
    
    return personTypesData
      .filter((type) => type.STATUS === 1) // Only show active items
      .filter((type) => {
        const matchesPersonType =
          personType === "" ||
          type.PERSON_TYPE.toLowerCase().includes(personType.toLowerCase());
        const matchesDescription =
          description === "" ||
          (type.DESCRIPTION &&
            type.DESCRIPTION.toLowerCase().includes(description.toLowerCase()));

        return matchesPersonType && matchesDescription;
      });
  }, [personTypesData, personType, description]);

  const handleDelete = React.useCallback(
    (id) => {
      if (window.confirm("Are you sure you want to delete this person type?")) {
        deletePersonType.mutate(id);
      }
    },
    [deletePersonType]
  );

  const columns = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 32,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "PERSON_TYPE",
      accessorKey: "PERSON_TYPE",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Person Type" />
      ),
      cell: ({ cell }) => (
        <div className="font-medium">{cell.getValue()}</div>
      ),
      meta: {
        label: "Person Type",
        placeholder: "Search person types...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "DESCRIPTION",
      accessorKey: "DESCRIPTION",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Description" />
      ),
      cell: ({ cell }) => {
        const description = cell.getValue();
        return (
          <div className="text-muted-foreground">
            {description || "—"}
          </div>
        );
      },
      meta: {
        label: "Description",
        placeholder: "Search descriptions...",
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "EFFECTIVE_START_DATE",
      accessorKey: "EFFECTIVE_START_DATE",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Start Date" />
      ),
      cell: ({ cell }) => {
        const date = cell.getValue();
        return (
          <div className="flex items-center gap-1">
            <Calendar className="size-4 text-muted-foreground" />
            {date ? format(new Date(date), "MMM dd, yyyy") : "—"}
          </div>
        );
      },
    },
    {
      id: "EFFECTIVE_END_DATE",
      accessorKey: "EFFECTIVE_END_DATE",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="End Date" />
      ),
      cell: ({ cell }) => {
        const date = cell.getValue();
        return (
          <div className="flex items-center gap-1">
            <Calendar className="size-4 text-muted-foreground" />
            {date ? format(new Date(date), "MMM dd, yyyy") : "—"}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const personType = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem 
                variant="destructive"
                onClick={() => handleDelete(personType.PERSON_TYPE_ID)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 32,
    },
  ], [handleDelete]);

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "PERSON_TYPE", desc: false }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.PERSON_TYPE_ID.toString(),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading person types...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-destructive">Error loading person types</div>;
  }

  return (
    <div className="data-table-container">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}