/**
 * geo-setup.jsx
 *
 * Replaces the 4 separate pages (Country, Region, District, Upazilla)
 * with a single drill-down page under one "Geo Setup" sidebar item.
 *
 * Drill stack:
 *   []                          → showing all Countries
 *   [country]                   → showing Regions inside that country
 *   [country, region]           → showing Districts inside that region
 *   [country, region, district] → showing Upazillas inside that district
 *
 * Data strategy:
 *   Uses lookup queries (filtered by parent ID) instead of fetching all data
 *   and filtering on the client. Only the current level's data is fetched.
 *
 * Dialog strategy:
 *   isDialogOpen     → Add (item=null) or Edit (item=object)
 *   isMoveDialogOpen → Move to different parent (region/district/upazilla only)
 *                      Country has no parent, so no Move action at level 0.
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
  FolderInput,
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
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router";

import { useDeleteCountry } from "./country/queries";
import { useDeleteRegion } from "./region/queries";
import { useDeleteDistrict } from "./district/queries";
import { useDeleteUpazilla } from "./upazilla/queries";
import {
  useCountriesLookup,
  useRegionsLookup,
  useDistrictsLookup,
  useUpazillasLookup,
} from "@/api/location-lookup-queries";

import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

import CountryFormDialog  from "./country/country-form-dialog";
import RegionFormDialog   from "./region/region-form-dialog";
import DistrictFormDialog from "./district/district-form-dialog";
import UpazillaFormDialog from "./upazilla/upazilla-form-dialog";

import RegionMoveDialog   from "./region/region-move-dialog";
import DistrictMoveDialog from "./district/district-move-dialog";
import UpazillaMoveDialog from "./upazilla/upazilla-move-dialog";


// ─── Level config ─────────────────────────────────────────────────────────────
const LEVELS = {
  country: {
    label: "Countries",
    singular: "Country",
    icon: Globe,
    emptyTitle: "No Countries Found",
    nameKey: "COUNTRY_NAME",
    idKey: "COUNTRY_ID",
    loadingText: "Loading countries...",
    canMove: false, // no parent to move to
  },
  region: {
    label: "Regions",
    singular: "Region",
    icon: Map,
    emptyTitle: "No Regions Found",
    nameKey: "REGION_NAME",
    idKey: "REGION_ID",
    loadingText: "Loading regions...",
    canMove: true,
  },
  district: {
    label: "Districts",
    singular: "District",
    icon: Landmark,
    emptyTitle: "No Districts Found",
    nameKey: "DISTRICT_NAME",
    idKey: "DISTRICT_ID",
    loadingText: "Loading districts...",
    canMove: true,
  },
  upazilla: {
    label: "Upazillas",
    singular: "Upazilla",
    icon: Building2,
    emptyTitle: "No Upazillas Found",
    nameKey: "UPAZILLA_NAME",
    idKey: "UPAZILLA_ID",
    loadingText: "Loading upazillas...",
    canMove: true,
  },
};

const LEVEL_ORDER = ["country", "region", "district", "upazilla"];


// ─── Component ────────────────────────────────────────────────────────────────
export default function GeoSetup() {
  const [drillStack, setDrillStack] = useState([]);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Form dialog — Add (item=null) or Edit (item=object)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Move dialog — separate state
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [moveItem, setMoveItem] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // ── Current level ─────────────────────────────────────────────────────────
  const currentLevelKey = LEVEL_ORDER[drillStack.length];
  const currentLevel    = LEVELS[currentLevelKey];
  const isLastLevel     = drillStack.length === LEVEL_ORDER.length - 1;

  // ── Parent IDs from drill stack ───────────────────────────────────────────
  const currentCountryId  = drillStack[0]?.COUNTRY_ID  ?? null;
  const currentRegionId   = drillStack[1]?.REGION_ID   ?? null;
  const currentDistrictId = drillStack[2]?.DISTRICT_ID ?? null;

  // ── Fetch only current level data ─────────────────────────────────────────
  const {
    data: countries = [],
    isLoading: isLoadingCountries,
    isError: isErrorCountries,
    error: errorCountries,
    refetch: refetchCountries,
    isFetching: isFetchingCountries,
  } = useCountriesLookup();

  const {
    data: regions = [],
    isLoading: isLoadingRegions,
    isError: isErrorRegions,
    error: errorRegions,
    refetch: refetchRegions,
    isFetching: isFetchingRegions,
  } = useRegionsLookup(currentCountryId);

  const {
    data: districts = [],
    isLoading: isLoadingDistricts,
    isError: isErrorDistricts,
    error: errorDistricts,
    refetch: refetchDistricts,
    isFetching: isFetchingDistricts,
  } = useDistrictsLookup(currentRegionId);

  const {
    data: upazillas = [],
    isLoading: isLoadingUpazillas,
    isError: isErrorUpazillas,
    error: errorUpazillas,
    refetch: refetchUpazillas,
    isFetching: isFetchingUpazillas,
  } = useUpazillasLookup(currentDistrictId);

  // ── Delete mutations ──────────────────────────────────────────────────────
  const deleteCountryMutation  = useDeleteCountry();
  const deleteRegionMutation   = useDeleteRegion();
  const deleteDistrictMutation = useDeleteDistrict();
  const deleteUpazillaMutation = useDeleteUpazilla();

  // ── Index lookups by drill depth ──────────────────────────────────────────
  const currentData    = [countries,          regions,          districts,          upazillas         ][drillStack.length];
  const isLoading      = [isLoadingCountries,  isLoadingRegions,  isLoadingDistricts,  isLoadingUpazillas ][drillStack.length];
  const isError        = [isErrorCountries,    isErrorRegions,    isErrorDistricts,    isErrorUpazillas   ][drillStack.length];
  const error          = [errorCountries,      errorRegions,      errorDistricts,      errorUpazillas     ][drillStack.length];
  const refetch        = [refetchCountries,    refetchRegions,    refetchDistricts,    refetchUpazillas   ][drillStack.length];
  const isFetching     = [isFetchingCountries, isFetchingRegions, isFetchingDistricts, isFetchingUpazillas][drillStack.length];
  const deleteMutation = [deleteCountryMutation, deleteRegionMutation, deleteDistrictMutation, deleteUpazillaMutation][drillStack.length];

  // ── Drill navigation ──────────────────────────────────────────────────────
  const drillInto = (item) => {
    if (isLastLevel) return;
    setDrillStack((prev) => [...prev, item]);
    setGlobalFilter("");
    setRowSelection({});
  };

  const navigateTo = (stackIndex) => {
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
    if (drillStack.length === 1) return `Add Region to ${drillStack[0].COUNTRY_NAME}`;
    if (drillStack.length === 2) return `Add District to ${drillStack[1].REGION_NAME}`;
    if (drillStack.length === 3) return `Add Upazilla to ${drillStack[2].DISTRICT_NAME}`;
  }, [drillStack]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleMove = (item) => {
    setMoveItem(item);
    setIsMoveDialogOpen(true);
  };

  const handleDelete = async (item) => {
    const name = item[currentLevel.nameKey];
    const id   = item[currentLevel.idKey];

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

  // ── Table columns ─────────────────────────────────────────────────────────
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
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
              {/* Edit */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(item)}
              >
                <IconEdit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>

              {/* Move — region / district / upazilla only, not country */}
              {currentLevel.canMove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-500 hover:text-amber-600"
                  onClick={() => handleMove(item)}
                >
                  <FolderInput className="h-4 w-4" />
                  <span className="sr-only">Move</span>
                </Button>
              )}

              {/* Delete */}
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

  // ── React Table ───────────────────────────────────────────────────────────
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

  // ── Page header ───────────────────────────────────────────────────────────
  const PageHeader = ({ disabled = false }) => (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
            Geo Setup
          </h1>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />

              <BreadcrumbItem>
                {drillStack.length > 0 ? (
                  <BreadcrumbLink className="cursor-pointer" onClick={() => navigateTo(-1)}>
                    Geo Setup
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>Geo Setup</BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {drillStack.map((item, idx) => {
                const levelKey = LEVEL_ORDER[idx];
                const nameKey  = LEVELS[levelKey].nameKey;
                const isLast   = idx === drillStack.length - 1;

                return (
                  <span key={idx} className="flex items-center gap-1.5">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {!isLast ? (
                        <BreadcrumbLink className="cursor-pointer" onClick={() => navigateTo(idx)}>
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
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh data</span>
          </Button>

          <Button
            onClick={() => {
              setSelectedItem(null);
              setIsDialogOpen(true);
            }}
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
                  <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" />Retry</>
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
                          : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><EmptyIcon /></EmptyMedia>
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

      {/* ── FORM DIALOGS — Add (item=null) or Edit (item=object) ─────────── */}

      {isDialogOpen && drillStack.length === 0 && (
        <CountryFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          showConfirmation={showConfirmation}
          item={selectedItem}
        />
      )}

      {isDialogOpen && drillStack.length === 1 && (
        <RegionFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          showConfirmation={showConfirmation}
          item={selectedItem}
          prefilledCountry={drillStack[0]}
        />
      )}

      {isDialogOpen && drillStack.length === 2 && (
        <DistrictFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          showConfirmation={showConfirmation}
          item={selectedItem}
          prefilledCountry={drillStack[0]}
          prefilledRegion={drillStack[1]}
        />
      )}

      {isDialogOpen && drillStack.length === 3 && (
        <UpazillaFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          showConfirmation={showConfirmation}
          item={selectedItem}
          prefilledCountry={drillStack[0]}
          prefilledRegion={drillStack[1]}
          prefilledDistrict={drillStack[2]}
        />
      )}

      {/* ── MOVE DIALOGS — change parent only ───────────────────────────── */}
      {/* Country (level 0) has no parent — no move dialog needed           */}

      {isMoveDialogOpen && drillStack.length === 1 && moveItem && (
        <RegionMoveDialog
          open={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          item={moveItem}
        />
      )}

      {isMoveDialogOpen && drillStack.length === 2 && moveItem && (
        <DistrictMoveDialog
          open={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          item={moveItem}
        />
      )}

      {isMoveDialogOpen && drillStack.length === 3 && moveItem && (
        <UpazillaMoveDialog
          open={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          item={moveItem}
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}