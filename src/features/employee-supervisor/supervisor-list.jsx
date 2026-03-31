import { useState, useMemo } from "react";
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { Trash2, AlertCircle, RefreshCw, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";

import { useSupervisorAssignments, useRemoveSupervisor } from "./queries";
import AssignSupervisorDialog from "./assign-supervisor-dialog";
import UpdateSupervisorDialog from "./update-supervisor-dialog";

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM dd, yyyy"); } catch { return "—"; }
};

function EmployeeCell({ firstName, lastName, empNo, title }) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase();
  const avatarColor = getAvatarColor(fullName);
  return (
    <div className="flex items-center gap-3 py-1">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColor)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="font-medium leading-tight truncate">
          {title && <span className="text-muted-foreground mr-1">{title}</span>}
          {fullName || "—"}
        </span>
        <span className="text-xs text-muted-foreground">{empNo}</span>
      </div>
    </div>
  );
}

export default function SupervisorList() {
  const [sorting, setSorting]                   = useState([]);
  const [columnFilters, setColumnFilters]       = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection]         = useState({});
  const [globalFilter, setGlobalFilter]         = useState("");
  const [isAssignOpen, setIsAssignOpen]         = useState(false);
  const [isUpdateOpen, setIsUpdateOpen]         = useState(false);
  const [selected, setSelected]                 = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const { data: assignments = [], isLoading, isError, error, refetch, isFetching } = useSupervisorAssignments();
  const removeMutation = useRemoveSupervisor();

  const handleEdit = (row) => { setSelected(row); setIsUpdateOpen(true); };

  const handleRemove = async (row) => {
    const empName = `${row.EMP_FIRST_NAME} ${row.EMP_LAST_NAME}`;
    const confirmed = await showConfirmation({
      title: "Remove supervisor?",
      description: `Remove supervisor assignment for "${empName}"? This cannot be undone.`,
      confirmText: "Remove", cancelText: "Cancel", variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await removeMutation.mutateAsync(row.ID);
      toast.success("Supervisor removed successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to remove supervisor.");
    }
  };

  const columns = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
      ),
      enableSorting: false, enableHiding: false,
    },
    {
      id: "employee",
      accessorFn: (row) => `${row.EMP_FIRST_NAME} ${row.EMP_LAST_NAME}`,
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Employee" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <EmployeeCell
            firstName={r.EMP_FIRST_NAME}
            lastName={r.EMP_LAST_NAME}
            empNo={r.EMP_NO}
            title={r.EMP_TITLE}
          />
        );
      },
    },
    {
      id: "supervisor",
      accessorFn: (row) => `${row.SUP_FIRST_NAME} ${row.SUP_LAST_NAME}`,
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Supervisor" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <EmployeeCell
            firstName={r.SUP_FIRST_NAME}
            lastName={r.SUP_LAST_NAME}
            empNo={r.SUP_EMP_NO}
            title={r.SUP_TITLE}
          />
        );
      },
    },
    {
      accessorKey: "STATUS",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const active = row.getValue("STATUS") === 1;
        return (
          <Badge variant={active ? "default" : "secondary"}
            className={cn(
              active
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-muted text-muted-foreground"
            )}>
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "CREATED_DATE",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Assigned On" />,
      cell: ({ row }) => (
        <div className="ps-2 font-light text-sm">{formatDate(row.getValue("CREATED_DATE"))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false, enableSorting: false,
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => handleEdit(assignment)}>
                    <IconEdit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Change Supervisor</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(assignment)}
                    disabled={removeMutation.isPending}>
                    {removeMutation.isPending
                      ? <Spinner data-icon="inline-start" />
                      : <Trash2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        );
      },
    },
  ], [removeMutation.isPending]);

  const table = useReactTable({
    data: assignments, columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
  });

  if (isLoading) return (
    <div>
      <PageHeader disabled />
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    </div>
  );

  if (isError) return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAssignOpen(true)} />
      <div className="bg-card rounded-md shadow-sm p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Supervisor Assignments</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>{error?.message || "Failed to load data."}</p>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="w-fit">
              {isFetching
                ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAssignOpen(true)} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar table={table} searchPlaceholder="Search employees or supervisors..." />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><UserCog /></EmptyMedia>
                          <EmptyTitle>No Supervisor Assignments Found</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </div>

      {isAssignOpen && (
        <AssignSupervisorDialog
          open={isAssignOpen}
          onOpenChange={setIsAssignOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateOpen && (
        <UpdateSupervisorDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          showConfirmation={showConfirmation}
          assignment={selected}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}

function PageHeader({ isFetching, onRefetch, onAdd, disabled }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Supervisor Assignments</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Core HR</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Supervisor Assignments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {onRefetch && (
            <Button variant="outline" size="icon" onClick={onRefetch} disabled={isFetching || disabled}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          )}
          <Button onClick={onAdd} disabled={disabled}>
            <IconPlus size={18} className="mr-1" />
            Assign Supervisor
          </Button>
        </div>
      </div>
    </div>
  );
}
