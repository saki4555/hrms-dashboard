import { useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  AlertCircle,
  RefreshCw,
  Building2Icon,
} from "lucide-react";
import { parseAsString, parseAsArrayOf, useQueryState } from "nuqs";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useDataTable } from "@/hooks/use-data-table";
import { useDeleteOrganization, useOrganizations } from "./queries";
import { Spinner } from "@/components/ui/spinner";

import AddOrganizationDialog from "./AddOrganizationDialog";
import { IconPlus } from "@tabler/icons-react";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import UpdateOrganizationDialog from "./update-organization-dialog";

const ORGANIZATION_TYPES = [
  { id: 1, name: "Headquarters" },
  { id: 2, name: "Branch Office" },
  { id: 3, name: "Department" },
  { id: 4, name: "Division" },
  { id: 5, name: "Subsidiary" },
  { id: 6, name: "Regional Office" },
];

const getOrgTypeName = (id) => {
  const type = ORGANIZATION_TYPES.find((t) => t.id === id);
  return type ? type.name : "Unknown";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return format(date, "MMM d, yyyy 'at' h:mm a");
};

export default function OrganizationListThree() {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Query states for filtering - parameter names must match column IDs
  const [nameFilter] = useQueryState("NAME", parseAsString.withDefault(""));
  const [orgTypeFilter] = useQueryState(
    "ORG_TYPE_ID",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: organizationData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useOrganizations();

  const deleteOrganizationMutation = useDeleteOrganization();

  // Calculate counts for organization types from ORIGINAL data (not filtered)
  // This mimics faceted row model behavior - showing total available items per type
  // Note: We can't use table.getColumn().getFacetedUniqueValues() because
  // the useDataTable hook has manualFiltering: true (for server-side filtering support)
  const orgTypeCounts = useMemo(() => {
    const counts = new Map();
    organizationData.forEach((org) => {
      const typeId = org.ORG_TYPE_ID;
      counts.set(typeId, (counts.get(typeId) || 0) + 1);
    });
    return counts;
  }, [organizationData]);

  // Filter data based on query states
  const filteredData = useMemo(() => {
    return organizationData.filter((org) => {
      const matchesName =
        nameFilter === "" ||
        org.NAME.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesOrgType =
        orgTypeFilter.length === 0 ||
        orgTypeFilter.includes(org.ORG_TYPE_ID.toString());

      return matchesName && matchesOrgType;
    });
  }, [organizationData, nameFilter, orgTypeFilter]);

  const handleEdit = (organization) => {
    setSelectedOrganization(organization);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (organization) => {
    const confirmed = await showConfirmation({
      title: "Delete organization?",
      description: `Are you sure you want to delete "${organization.NAME}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteOrganizationMutation.mutateAsync(organization.ID);
        toast.success("Organization deleted successfully!");
      } catch (error) {
        console.error("Error deleting organization:", error);
        toast.error(
          error?.message || "Failed to delete organization. Please try again."
        );
      }
    }
  };

  const handleRefetch = () => {
    refetch();
  };

  // Define columns using Dice UI pattern
  const columns = useMemo(
    () => [
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
        id: "NAME",
        accessorKey: "NAME",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Organization Name" />
        ),
        cell: ({ cell }) => (
          <div className="font-medium">{cell.getValue()}</div>
        ),
        meta: {
          label: "Organization Name",
          placeholder: "Search organizations...",
          variant: "text",
        },
        enableColumnFilter: true,
      },
      {
        id: "ORG_TYPE_ID",
        accessorKey: "ORG_TYPE_ID",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Type" />
        ),
        cell: ({ cell }) => (
          <div className="capitalize">
            {getOrgTypeName(cell.getValue())}
          </div>
        ),
        meta: {
          label: "Organization Type",
          variant: "multiSelect",
          options: ORGANIZATION_TYPES.map((type) => ({
            label: type.name,
            value: type.id.toString(),
            count: orgTypeCounts.get(type.id) || 0,
            icon: Building2Icon,
          })),
        },
        enableColumnFilter: true,
      },
      {
        id: "LOCATION",
        accessorKey: "LOCATION",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Location" />
        ),
        cell: ({ cell }) => (
          <div className="max-w-xs truncate">
            {cell.getValue() || "N/A"}
          </div>
        ),
      },
      {
        id: "CREATED_DATE",
        accessorKey: "CREATED_DATE",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Created Date" />
        ),
        cell: ({ cell }) => {
          const date = cell.getValue();
          return <div>{formatDate(date)}</div>;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const organization = row.original;

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(organization)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(organization)}
                disabled={deleteOrganizationMutation.isPending}
              >
                {deleteOrganizationMutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          );
        },
        size: 32,
        enableHiding: false,
      },
    ],
    [deleteOrganizationMutation.isPending, orgTypeCounts]
  );

  // Initialize data table using Dice UI hook
  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: Math.ceil(filteredData.length / 10),
    initialState: {
      sorting: [{ id: "NAME", desc: false }],
      columnPinning: { right: ["actions"] },
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    getRowId: (row) => row.ID?.toString() || row.id,
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="">
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-bold">Organization</h1>
              <p className="text-muted-foreground mt-1">
                Manage organization information and records
              </p>
            </div>
            <Button disabled>
              <IconPlus size={20} className="mr-2" />
              Add Organization
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="">
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-bold">Organization</h1>
              <p className="text-muted-foreground mt-1">
                Manage organization information and records
              </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus size={20} className="mr-2" />
              Add Organization
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Organizations</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>
                {error?.message ||
                  "Failed to load organizations. Please try again."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefetch}
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

  // Main Table View
  return (
    <div className="">
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-2xl font-bold">Organization</h1>
            <p className="text-muted-foreground mt-1">
              Manage organization information and records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefetch}
              disabled={isFetching}
              title="Refresh data"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus size={20} className="mr-2" />
              Add Organization
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-sm p-4">
        <DataTable table={table}>
          <DataTableToolbar table={table} />
          
        </DataTable>

        {table.getRowModel().rows?.length === 0 && (
          <div className="py-16">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2Icon />
                </EmptyMedia>
                <EmptyTitle>No Organizations Found</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </div>

      <AddOrganizationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        showConfirmation={showConfirmation}
      />
      <UpdateOrganizationDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        showConfirmation={showConfirmation}
        organization={selectedOrganization}
      />
      <ConfirmationDialog />
    </div>
  );
}