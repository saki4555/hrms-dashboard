import { useState, useMemo } from "react";
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import {
  Trash2, AlertCircle, RefreshCw, Users,
  KeyRound, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
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

import { useUsers, useDeleteUser } from "./queries";
import AddUserDialog from "./add-user-dialog";
import UpdateUserDialog from "./update-user-dialog";
import ChangePasswordDialog from "./change-password-dialog";

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM dd, yyyy"); } catch { return "—"; }
};

export default function UserList() {
  const navigate = useNavigate();
  const [sorting, setSorting]                   = useState([]);
  const [columnFilters, setColumnFilters]       = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection]         = useState({});
  const [globalFilter, setGlobalFilter]         = useState("");
  const [isAddOpen, setIsAddOpen]               = useState(false);
  const [isUpdateOpen, setIsUpdateOpen]         = useState(false);
  const [isPasswordOpen, setIsPasswordOpen]     = useState(false);
  const [selectedUser, setSelectedUser]         = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const { data: users = [], isLoading, isError, error, refetch, isFetching } = useUsers();
  const deleteMutation = useDeleteUser();

  const handleEdit = (user) => { setSelectedUser(user); setIsUpdateOpen(true); };
  const handlePassword = (user) => { setSelectedUser(user); setIsPasswordOpen(true); };

  const handleDelete = async (user) => {
    const confirmed = await showConfirmation({
      title: "Deactivate user?",
      description: `Are you sure you want to deactivate "${user.USERNAME}"?`,
      confirmText: "Deactivate", cancelText: "Cancel", variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(user.ID);
      toast.success("User deactivated successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to deactivate user.");
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
      id: "user",
      accessorFn: (row) => row.USERNAME,
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const u = row.original;
        const fullName = [u.FIRST_NAME, u.LAST_NAME].filter(Boolean).join(" ");
        const initials = [u.FIRST_NAME?.[0], u.LAST_NAME?.[0]].filter(Boolean).join("").toUpperCase() || u.USERNAME?.[0]?.toUpperCase();
        const avatarColor = getAvatarColor(u.USERNAME);
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColor)}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-medium leading-tight">{u.USERNAME}</span>
              {fullName && <span className="text-xs text-muted-foreground truncate">{fullName} · {u.EMP_NO}</span>}
              {u.LOCATION_NAME && <span className="text-xs text-muted-foreground/70">{u.LOCATION_NAME}</span>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "STATUS",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("STATUS");
        return (
          <Badge variant={status === "ACTIVE" ? "default" : "secondary"}
            className={cn(
              status === "ACTIVE"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-muted text-muted-foreground"
            )}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "CREATED_AT",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <div className="ps-2 font-light text-sm">{formatDate(row.getValue("CREATED_AT"))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false, enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => navigate(`/user-management/users/${user.ID}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => handleEdit(user)}>
                    <IconEdit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit User</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                    onClick={() => handlePassword(user)}>
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Change Password</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(user)}
                    disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending
                      ? <Spinner data-icon="inline-start" />
                      : <Trash2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Deactivate</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        );
      },
    },
  ], [deleteMutation.isPending]);

  const table = useReactTable({
    data: users, columns,
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
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    </div>
  );

  if (isError) return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAddOpen(true)} />
      <div className="bg-card rounded-md shadow-sm p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Users</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>{error?.message || "Failed to load users."}</p>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="w-fit">
              {isFetching ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</> : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAddOpen(true)} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar table={table} searchPlaceholder="Search users..." />

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
                          <EmptyMedia variant="icon"><Users /></EmptyMedia>
                          <EmptyTitle>No Users Found</EmptyTitle>
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

      {isAddOpen && <AddUserDialog open={isAddOpen} onOpenChange={setIsAddOpen} showConfirmation={showConfirmation} />}
      {isUpdateOpen && <UpdateUserDialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen} showConfirmation={showConfirmation} user={selectedUser} />}
      {isPasswordOpen && <ChangePasswordDialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen} user={selectedUser} />}
      <ConfirmationDialog />
    </div>
  );
}

function PageHeader({ isFetching, onRefetch, onAdd, disabled }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Users</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>User Management</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Users</BreadcrumbPage></BreadcrumbItem>
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
            <IconPlus size={18} className="mr-1" />Add User
          </Button>
        </div>
      </div>
    </div>
  );
}