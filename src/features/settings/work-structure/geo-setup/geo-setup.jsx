/**
 * geo-setup-page.jsx
 *
 * Replaces the 4 separate pages (Country, Region, District, Upazilla)
 * with a single drill-down page under one "Geo Setup" sidebar item.
 *
 * Drill stack:
 *   []                → showing all Countries
 *   [country]         → showing Regions inside that country
 *   [country, region] → showing Districts inside that region
 *   [country, region, district] → showing Upazillas inside that district
 */

import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Trash2,
  AlertCircle,
  RefreshCw,
  Globe,
  Map,
  Landmark,
  Building2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router";

import { useCountries, useDeleteCountry } from "../country/queries";
import { useRegions, useDeleteRegion } from "../region/queries";
import { useDistricts, useDeleteDistrict } from "../district/queries";
import { useUpazillas, useDeleteUpazilla } from "../upazilla/queries";


import UpdateCountryDialog from "../country/update-country-dialog";
import AddRegionDialog from "./region/add-region-dialog";
import UpdateRegionDialog from "./region/update-region-dialog";
import AddDistrictDialog from "./district/add-district-dialog";
import UpdateDistrictDialog from "./district/update-district-dialog";
import AddUpazillaDialog from "./upazilla/add-upazilla-dialog";
import UpdateUpazillaDialog from "./upazilla/update-upazilla-dialog";

import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";
import AddCountryDialog from "./country/add-country-dialog";


// ─── Level config ────────────────────────────────────────────────────────────
const LEVELS = {
  country: {
    label: "Countries",
    singular: "Country",
    icon: Globe,
    emptyTitle: "No Countries Found",
    nameKey: "COUNTRY_NAME",
    idKey: "COUNTRY_ID",
    loadingText: "Loading countries...",
  },
  region: {
    label: "Regions",
    singular: "Region",
    icon: Map,
    emptyTitle: "No Regions Found",
    nameKey: "REGION_NAME",
    idKey: "REGION_ID",
    loadingText: "Loading regions...",
  },
  district: {
    label: "Districts",
    singular: "District",
    icon: Landmark,
    emptyTitle: "No Districts Found",
    nameKey: "DISTRICT_NAME",
    idKey: "DISTRICT_ID",
    loadingText: "Loading districts...",
  },
  upazilla: {
    label: "Upazillas",
    singular: "Upazilla",
    icon: Building2,
    emptyTitle: "No Upazillas Found",
    nameKey: "UPAZILLA_NAME",
    idKey: "UPAZILLA_ID",
    loadingText: "Loading upazillas...",
  },
};

const LEVEL_ORDER = ["country", "region", "district", "upazilla"];

export default function GeoSetup() {
  // drillStack: array of selected items as we go deeper
  // []                          → country level
  // [{ COUNTRY_ID, COUNTRY_NAME }]  → region level
  // [..., { REGION_ID, REGION_NAME }]   → district level
  // [..., ..., { DISTRICT_ID, DISTRICT_NAME }] → upazilla level
  const [drillStack, setDrillStack] = useState([]);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // Determine current level key
  const currentLevelKey = LEVEL_ORDER[drillStack.length];
  const currentLevel = LEVELS[currentLevelKey];
  const isLastLevel = drillStack.length === LEVEL_ORDER.length - 1;

  // ── Fetch all data (queries are cheap — already cached) ───────────────────
  const {
    data: allCountries = [],
    isLoading: isLoadingCountries,
    isError: isErrorCountries,
    error: errorCountries,
    refetch: refetchCountries,
    isFetching: isFetchingCountries,
  } = useCountries();

  const {
    data: allRegions = [],
    isLoading: isLoadingRegions,
    isError: isErrorRegions,
    error: errorRegions,
    refetch: refetchRegions,
    isFetching: isFetchingRegions,
  } = useRegions();

  const {
    data: allDistricts = [],
    isLoading: isLoadingDistricts,
    isError: isErrorDistricts,
    error: errorDistricts,
    refetch: refetchDistricts,
    isFetching: isFetchingDistricts,
  } = useDistricts();

  const {
    data: allUpazillas = [],
    isLoading: isLoadingUpazillas,
    isError: isErrorUpazillas,
    error: errorUpazillas,
    refetch: refetchUpazillas,
    isFetching: isFetchingUpazillas,
  } = useUpazillas();

  // ── Delete mutations ──────────────────────────────────────────────────────
  const deleteCountryMutation = useDeleteCountry();
  const deleteRegionMutation = useDeleteRegion();
  const deleteDistrictMutation = useDeleteDistrict();
  const deleteUpazillaMutation = useDeleteUpazilla();

  // ── Derive current data based on drill stack ──────────────────────────────
  const currentData = useMemo(() => {
    if (drillStack.length === 0) return allCountries;

    if (drillStack.length === 1) {
      const countryId = drillStack[0].COUNTRY_ID;
      return allRegions.filter((r) => r.COUNTRY_ID === countryId);
    }

    if (drillStack.length === 2) {
      const regionId = drillStack[1].REGION_ID;
      return allDistricts.filter((d) => d.REGION_ID === regionId);
    }

    if (drillStack.length === 3) {
      const districtId = drillStack[2].DISTRICT_ID;
      return allUpazillas.filter((u) => u.DISTRICT_ID === districtId);
    }

    return [];
  }, [drillStack, allCountries, allRegions, allDistricts, allUpazillas]);

  // ── Loading / error state for current level ───────────────────────────────
  const isLoading = [
    isLoadingCountries,
    isLoadingRegions,
    isLoadingDistricts,
    isLoadingUpazillas,
  ][drillStack.length];

  const isError = [
    isErrorCountries,
    isErrorRegions,
    isErrorDistricts,
    isErrorUpazillas,
  ][drillStack.length];

  const error = [
    errorCountries,
    errorRegions,
    errorDistricts,
    errorUpazillas,
  ][drillStack.length];

  const refetch = [
    refetchCountries,
    refetchRegions,
    refetchDistricts,
    refetchUpazillas,
  ][drillStack.length];

  const isFetching = [
    isFetchingCountries,
    isFetchingRegions,
    isFetchingDistricts,
    isFetchingUpazillas,
  ][drillStack.length];

  const deleteMutation = [
    deleteCountryMutation,
    deleteRegionMutation,
    deleteDistrictMutation,
    deleteUpazillaMutation,
  ][drillStack.length];

  // ── Drill navigation ──────────────────────────────────────────────────────
  const drillInto = (item) => {
    if (isLastLevel) return; // Upazilla has no children
    setDrillStack((prev) => [...prev, item]);
    setGlobalFilter("");
    setRowSelection({});
  };

  const navigateTo = (stackIndex) => {
    // stackIndex = -1 means go back to root (Geo Setup)
    // stackIndex = 0 means go back to country level (show all countries)
    if (stackIndex < 0) {
      setDrillStack([]);
    } else {
      setDrillStack((prev) => prev.slice(0, stackIndex + 1));
    }
    setGlobalFilter("");
    setRowSelection({});
  };

  // ── Add button label ──────────────────────────────────────────────────────
  const addButtonLabel = useMemo(() => {
    if (drillStack.length === 0) return "Add Country";
    if (drillStack.length === 1)
      return `Add Region to ${drillStack[0].COUNTRY_NAME}`;
    if (drillStack.length === 2)
      return `Add District to ${drillStack[1].REGION_NAME}`;
    if (drillStack.length === 3)
      return `Add Upazilla to ${drillStack[2].DISTRICT_NAME}`;
  }, [drillStack]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (item) => {
    const name = item[currentLevel.nameKey];
    const id = item[currentLevel.idKey];

    const confirmed = await showConfirmation({
      title: `Delete ${currentLevel.singular.toLowerCase()}?`,
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success(`${currentLevel.singular} deleted successfully!`);
      } catch (error) {
        toast.error(
          error?.message ||
            `Failed to delete ${currentLevel.singular.toLowerCase()}. Please try again.`
        );
      }
    }
  };

  // ── Table columns (dynamic per level) ────────────────────────────────────
  const columns = useMemo(() => {
    const nameKey = currentLevel.nameKey;

    return [
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
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: nameKey,
        header: ({ column }) => (
          <CustomDataTableColumnHeader
            column={column}
            title={`${currentLevel.singular} Name`}
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const name = row.getValue(nameKey);

          // Countries, Regions, Districts are drillable (not Upazillas)
          if (!isLastLevel) {
            return (
              <button
                onClick={() => drillInto(item)}
                className="flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors ps-2 text-left"
              >
                {name}
                <ChevronRight className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
              </button>
            );
          }

          return <div className="font-medium ps-2">{name}</div>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(item)}
              >
                <IconEdit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(item)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          );
        },
      },
    ];
  }, [currentLevelKey, isLastLevel, deleteMutation.isPending]);

  // ── React Table instance ──────────────────────────────────────────────────
  const table = useReactTable({
    data: currentData,
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // ── Shared header (used in loading/error states too) ──────────────────────
  const PageHeader = ({ disabled = false }) => (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
            Geo Setup
          </h1>

          {/* ── BREADCRUMB ── */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />

              {/* Root: "Geo Setup" — clickable if we're drilled in */}
              <BreadcrumbItem>
                {drillStack.length > 0 ? (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => navigateTo(-1)}
                  >
                    Geo Setup
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>Geo Setup</BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {/* Dynamic drill-down breadcrumb items */}
              {drillStack.map((item, idx) => {
                const levelKey = LEVEL_ORDER[idx];
                const nameKey = LEVELS[levelKey].nameKey;
                const isLast = idx === drillStack.length - 1;

                return (
                  <span key={idx} className="flex items-center gap-1.5">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {!isLast ? (
                        <BreadcrumbLink
                          className="cursor-pointer"
                          onClick={() => navigateTo(idx)}
                        >
                          {item[nameKey]}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item[nameKey]}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </span>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching || disabled}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refresh data</span>
          </Button>

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            disabled={disabled}
          >
            <IconPlus />
            {addButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <PageHeader disabled />
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">{currentLevel.loadingText}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div>
        <PageHeader />
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading {currentLevel.label}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>
                {error?.message ||
                  `Failed to load ${currentLevel.label.toLowerCase()}. Please try again.`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-fit"
              >
                {isFetching ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  const EmptyIcon = currentLevel.icon;

  return (
    <div>
      <PageHeader />

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar
            table={table}
            searchPlaceholder={`Search ${currentLevel.label.toLowerCase()}...`}
          />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
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
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <EmptyIcon />
                          </EmptyMedia>
                          <EmptyTitle>{currentLevel.emptyTitle}</EmptyTitle>
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

      {/* ── ADD DIALOGS ── */}

      {/* Country */}
      {isAddDialogOpen && drillStack.length === 0 && (
        <AddCountryDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          showConfirmation={showConfirmation}
        />
      )}

      {/* Region — pass prefilledCountry so modal shows context header */}
      {isAddDialogOpen && drillStack.length === 1 && (
        <AddRegionDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          showConfirmation={showConfirmation}
          prefilledCountry={drillStack[0]}
        />
      )}

      {/* District — pass prefilledRegion */}
      {isAddDialogOpen && drillStack.length === 2 && (
        <AddDistrictDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          showConfirmation={showConfirmation}
          prefilledRegion={drillStack[1]}
          prefilledCountry={drillStack[0]}
        />
      )}

      {/* Upazilla — pass prefilledDistrict */}
      {isAddDialogOpen && drillStack.length === 3 && (
        <AddUpazillaDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          showConfirmation={showConfirmation}
          prefilledDistrict={drillStack[2]}
          prefilledRegion={drillStack[1]}
          prefilledCountry={drillStack[0]}
        />
      )}

      {/* ── UPDATE DIALOGS ── */}

      {isUpdateDialogOpen && drillStack.length === 0 && selectedItem && (
        <UpdateCountryDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          showConfirmation={showConfirmation}
          country={selectedItem}
        />
      )}

      {isUpdateDialogOpen && drillStack.length === 1 && selectedItem && (
        <UpdateRegionDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          showConfirmation={showConfirmation}
          region={selectedItem}
        />
      )}

      {isUpdateDialogOpen && drillStack.length === 2 && selectedItem && (
        <UpdateDistrictDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          showConfirmation={showConfirmation}
          district={selectedItem}
        />
      )}

      {isUpdateDialogOpen && drillStack.length === 3 && selectedItem && (
        <UpdateUpazillaDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          showConfirmation={showConfirmation}
          upazilla={selectedItem}
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}