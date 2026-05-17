// src/features/payroll/pay-structure/index.jsx
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Plus, RefreshCw, AlertCircle, Pencil, Trash2,
  Layers, Building2, ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { DataTablePagination } from "@/components/DataTablePagination";
import { cn } from "@/lib/utils";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

import {
  usePayComponents, useDeletePayComponent,
  usePayStructures, useDeletePayStructure,
} from "./queries";
import PayComponentDialog      from "./pay-component-dialog";
import PayStructureFormSheet   from "./pay-structure-form-sheet";
import PayStructureDetailSheet from "./pay-structure-detail-sheet";

// ─────────────────────────────────────────────────────────────────────────────
// TYPE BADGE
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  EARNING:   { label: "Earning",   class: "bg-green-500/10 text-green-600 border-green-500/20" },
  DEDUCTION: { label: "Deduction", class: "bg-red-500/10 text-red-500 border-red-500/20" },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.EARNING;
  return <Badge variant="outline" className={cn("text-xs", cfg.class)}>{cfg.label}</Badge>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAY COMPONENTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function PayComponentsTab({ showConfirmation }) {
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [sorting, setSorting]             = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection]   = useState({});
  const [globalFilter, setGlobalFilter]   = useState("");

  const { data: components = [], isLoading, isError, error, refetch, isFetching } = usePayComponents();
  const { mutate: deleteComp, isPending: isDeleting } = useDeletePayComponent();

  const handleDelete = async (component) => {
    const confirmed = await showConfirmation({
      title:       "Delete Component?",
      description: `Delete "${component.NAME}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText:  "Cancel",
      variant:     "destructive",
    });
    if (!confirmed) return;
    deleteComp(component.COMPONENT_ID, {
      onSuccess: () => toast.success("Component deleted."),
      onError:   (err) => toast.error(err.message),
    });
  };

  const columns = [
    {
      accessorKey: "CODE",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Code" />,
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.getValue("CODE")}</code>
      ),
    },
    {
      accessorKey: "NAME",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium text-sm">{row.getValue("NAME")}</span>,
    },
    {
      accessorKey: "TYPE",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <TypeBadge type={row.getValue("TYPE")} />,
    },
    {
      accessorKey: "CALCULATION_FORMULA",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Formula" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">
          {row.getValue("CALCULATION_FORMULA")}
        </span>
      ),
    },
    {
      accessorKey: "TAXABLE",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Taxable" />,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">{row.getValue("TAXABLE") ?? "YES"}</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => { setEditTarget(c); setSheetOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(c)}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: components,
    columns,
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

  if (isLoading)
    return <div className="flex items-center justify-center py-16"><Spinner className="h-8 w-8" /></div>;

  if (isError)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message}</AlertDescription>
      </Alert>
    );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {components.length} component{components.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refetch} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setEditTarget(null); setSheetOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Component
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <CustomDataTableToolbar table={table} searchPlaceholder="Search components..." />

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                    <Layers className="h-8 w-8 opacity-30 mx-auto mb-2" />
                    <p>No components yet. Add your first one.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </div>

      <PayComponentDialog
        open={sheetOpen}
        onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditTarget(null); }}
        component={editTarget}
        showConfirmation={showConfirmation}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAY STRUCTURES TAB
// ─────────────────────────────────────────────────────────────────────────────
function PayStructuresTab({ showConfirmation }) {
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailId, setDetailId]     = useState(null);
  const [sorting, setSorting]             = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection]   = useState({});
  const [globalFilter, setGlobalFilter]   = useState("");

  const { data: structures = [], isLoading, isError, error, refetch, isFetching } = usePayStructures();
  const { mutate: deleteStructure, isPending: isDeleting } = useDeletePayStructure();

  const handleDelete = async (structure) => {
    const confirmed = await showConfirmation({
      title:       "Delete Pay Structure?",
      description: `Delete "${structure.NAME}"? All linked components will be removed too.`,
      confirmText: "Delete",
      cancelText:  "Cancel",
      variant:     "destructive",
    });
    if (!confirmed) return;
    deleteStructure(structure.PAY_STRUCTURE_ID, {
      onSuccess: () => toast.success("Pay structure deleted."),
      onError:   (err) => toast.error(err.message),
    });
  };

  const columns = [
    {
      accessorKey: "NAME",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium text-sm">{row.getValue("NAME")}</span>,
    },
    {
      accessorKey: "DESCRIPTION",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("DESCRIPTION") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "COMPONENT_COUNT",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Components" />,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {row.getValue("COMPONENT_COUNT") ?? 0} components
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); setEditTarget(s); setFormOpen(true); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); handleDelete(s); }}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: structures,
    columns,
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

  if (isLoading)
    return <div className="flex items-center justify-center py-16"><Spinner className="h-8 w-8" /></div>;

  if (isError)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message}</AlertDescription>
      </Alert>
    );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {structures.length} structure{structures.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refetch} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setEditTarget(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Structure
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <CustomDataTableToolbar table={table} searchPlaceholder="Search structures..." />

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => setDetailId(row.original.PAY_STRUCTURE_ID)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-8 w-8 opacity-30 mx-auto mb-2" />
                    <p>No pay structures yet. Add your first one.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </div>

      <PayStructureFormSheet
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditTarget(null); }}
        structure={editTarget}
        showConfirmation={showConfirmation}
      />

      <PayStructureDetailSheet
        open={!!detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        structureId={detailId}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function PayStructurePage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  return (
    <div>
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Pay Structure</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Payroll</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Pay Structure</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-sm p-4">
        <Tabs defaultValue="structures">
          <TabsList className="mb-4">
            <TabsTrigger value="structures" className="gap-1.5">
              <Building2 className="h-4 w-4" /> Pay Structures
            </TabsTrigger>
            <TabsTrigger value="components" className="gap-1.5">
              <Layers className="h-4 w-4" /> Pay Components
            </TabsTrigger>
          </TabsList>
          <TabsContent value="structures">
            <PayStructuresTab showConfirmation={showConfirmation} />
          </TabsContent>
          <TabsContent value="components">
            <PayComponentsTab showConfirmation={showConfirmation} />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmationDialog />
    </div>
  );
}