import { useState, useMemo, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import {
  Trash2, AlertCircle, RefreshCw, Users,
  KeyRound, Eye, ArrowUp, ArrowDown, ChevronDown,
} from "lucide-react";
import { IconColumns3Filled, IconEdit, IconPlus, IconSelector, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";

import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input }    from "@/components/ui/input";
import {
  Combobox, ComboboxContent, ComboboxEmpty,
  ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn }             from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

import { useUsers, useDeleteUser, useRoles, useModules, usePermissions } from "./queries";
import AddUserDialog        from "./add-user-dialog";
import UpdateUserDialog     from "./update-user-dialog";
import ChangePasswordDialog from "./change-password-dialog";
import { SearchInput } from "@/components/shared/search-input";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SORT_COLUMN_MAP = {
  user:       "USERNAME",
  CREATED_AT: "CREATED_AT",
};

const REVERSE_SORT_MAP = {
  USERNAME:   "user",
  CREATED_AT: "CREATED_AT",
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM dd, yyyy"); } catch { return "—"; }
};

// ─────────────────────────────────────────────────────────────────────────────
//  SORT HEADER
// ─────────────────────────────────────────────────────────────────────────────

function SortHeader({ column, children, className }) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{children}</div>;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className,
        )}
      >
        {children}
        {column.getIsSorted() === "desc" ? <ArrowDown /> :
         column.getIsSorted() === "asc"  ? <ArrowUp />   :
                                           <IconSelector />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-28">
        <DropdownMenuCheckboxItem
          className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
          checked={column.getIsSorted() === "asc"}
          onClick={() => column.toggleSorting(false)}
        >
          <ArrowUp /> Asc
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
          checked={column.getIsSorted() === "desc"}
          onClick={() => column.toggleSorting(true)}
        >
          <ArrowDown /> Desc
        </DropdownMenuCheckboxItem>
        {column.getIsSorted() && (
          <DropdownMenuItem
            className="pl-2 [&_svg]:text-muted-foreground"
            onClick={() => column.clearSorting()}
          >
            <IconX /> Reset
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FILTER COMBOBOX  (same pattern as EmployeeList)
// ─────────────────────────────────────────────────────────────────────────────

function FilterCombobox({ placeholder, options, value, onValueChange }) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const hasValue = !!value;

  return (
    <Combobox
      items={options.map((o) => o.label)}
      value={selectedLabel}
      onValueChange={(label) => {
        if (!label) { onValueChange(""); return; }
        const opt = options.find((o) => o.label === label);
        onValueChange(opt?.value ?? "");
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        showTrigger={!hasValue}
        showClear={hasValue}
      />
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(label) => (
            <ComboboxItem key={label} value={label}>
              {label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function UserList() {
  const navigate = useNavigate();

  // ── URL state via nuqs ──────────────────────────────────────────────────────
  const [page,         setPage]         = useQueryState("page",         parseAsInteger.withDefault(1));
  const [limit,        setLimit]        = useQueryState("limit",        parseAsInteger.withDefault(20));
  const [search,       setSearch]       = useQueryState("search",       parseAsString.withDefault(""));
  const [roleId,       setRoleId]       = useQueryState("roleId",       parseAsString.withDefault(""));
  const [moduleId,     setModuleId]     = useQueryState("moduleId",     parseAsString.withDefault(""));
  const [permissionId, setPermissionId] = useQueryState("permissionId", parseAsString.withDefault(""));
  const [sortBy,       setSortBy]       = useQueryState("sortBy",       parseAsString.withDefault("CREATED_AT"));
  const [sortOrder,    setSortOrder]    = useQueryState("sortOrder",    parseAsString.withDefault("DESC"));

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [columnVisibility, setColumnVisibility] = useState({});
  const [isAddOpen,        setIsAddOpen]        = useState(false);
  const [isUpdateOpen,     setIsUpdateOpen]     = useState(false);
  const [isPasswordOpen,   setIsPasswordOpen]   = useState(false);
  const [selectedUser,     setSelectedUser]     = useState(null);

  // Local search input — debounced before hitting the URL/backend
  const [searchInput, setSearchInput] = useState(search);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // ── Filter data ─────────────────────────────────────────────────────────────
  const { data: roles       = [] } = useRoles();
  const { data: modules     = [] } = useModules();
  const { data: permissions = [] } = usePermissions();

  // ── Combobox options ────────────────────────────────────────────────────────
  const roleOptions = roles.map((r) => ({
    label: r.ROLE_NAME,
    value: String(r.ID),
  }));
  const moduleOptions = modules.map((m) => ({
    label: m.MODULE_NAME,
    value: String(m.ID),
  }));
  const permissionOptions = permissions.map((p) => ({
    label: p.PERMISSION_NAME,
    value: String(p.ID),
  }));

  // ── Backend params ──────────────────────────────────────────────────────────
  const backendParams = useMemo(() => ({
    page, limit, search, roleId, moduleId, permissionId, sortBy, sortOrder,
  }), [page, limit, search, roleId, moduleId, permissionId, sortBy, sortOrder]);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const {
    data: response,
    isLoading, isError, error, refetch, isFetching,
  } = useUsers(backendParams);

  const deleteMutation = useDeleteUser();

  // ── Derived ─────────────────────────────────────────────────────────────────
  const rows      = response?.data                  ?? [];
  const total     = response?.pagination?.total     ?? 0;
  const pageCount = response?.pagination?.totalPages ?? 1;

  // ── Debounced search ────────────────────────────────────────────────────────
  const debouncedSearch = useDebouncedCallback((val) => {
    setSearch(val || null);
    setPage(1);
  }, 300);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  // ── Sorting bridge ──────────────────────────────────────────────────────────
  const sorting = useMemo(() => {
    if (!sortBy) return [];
    const columnId = REVERSE_SORT_MAP[sortBy] ?? sortBy;
    return [{ id: columnId, desc: sortOrder === "DESC" }];
  }, [sortBy, sortOrder]);

  const onSortingChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function"
      ? updaterOrValue(sorting)
      : updaterOrValue;
    if (next.length === 0) {
      setSortBy("CREATED_AT");
      setSortOrder("DESC");
    } else {
      const col = SORT_COLUMN_MAP[next[0].id] ?? "CREATED_AT";
      setSortBy(col);
      setSortOrder(next[0].desc ? "DESC" : "ASC");
      setPage(1);
    }
  }, [sorting, setSortBy, setSortOrder, setPage]);

  // ── Pagination bridge ───────────────────────────────────────────────────────
  const pagination = useMemo(() => ({
    pageIndex: page - 1,
    pageSize:  limit,
  }), [page, limit]);

  const onPaginationChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function"
      ? updaterOrValue(pagination)
      : updaterOrValue;
    setPage(next.pageIndex + 1);
    setLimit(next.pageSize);
  }, [pagination, setPage, setLimit]);

  // ── Filter helpers ──────────────────────────────────────────────────────────
  const hasActiveFilters = search || roleId || moduleId || permissionId;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch(null);
    setRoleId(null);
    setModuleId(null);
    setPermissionId(null);
    setPage(1);
  };

  // ── Dialog helpers ──────────────────────────────────────────────────────────
  const handleEdit     = (user) => { setSelectedUser(user); setIsUpdateOpen(true); };
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

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      id: "user",
      accessorFn: (row) => row.USERNAME,
      header: ({ column }) => <SortHeader column={column}>User</SortHeader>,
      cell: ({ row }) => {
        const u        = row.original;
        const fullName = [u.FIRST_NAME, u.LAST_NAME].filter(Boolean).join(" ");
        const initials = (
          [u.FIRST_NAME?.[0], u.LAST_NAME?.[0]].filter(Boolean).join("").toUpperCase()
          || u.USERNAME?.[0]?.toUpperCase()
        );
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className={cn("text-xs font-semibold text-white", getAvatarColor(u.USERNAME))}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-medium leading-tight">{u.USERNAME}</span>
              {fullName && (
                <span className="text-xs text-muted-foreground truncate">
                  {fullName} · {u.EMP_NO}
                </span>
              )}
              {u.LOCATION_NAME && (
                <span className="text-xs text-muted-foreground/70">{u.LOCATION_NAME}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "STATUS",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.getValue("STATUS");
        return (
          <Badge
            variant="outline"
            className={cn(
              status === "ACTIVE"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-muted text-muted-foreground border-border",
            )}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "CREATED_AT",
      header: ({ column }) => <SortHeader column={column}>Created</SortHeader>,
      cell: ({ row }) => (
        <div className="text-sm font-light">{formatDate(row.getValue("CREATED_AT"))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding:  false,
      enableSorting: false,
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

  // ── TanStack table ──────────────────────────────────────────────────────────
  const table = useReactTable({
    data:     rows,
    columns,
    pageCount,
    state:    { pagination, columnVisibility, sorting },
    onPaginationChange,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel:          getCoreRowModel(),
    manualPagination: true,
    manualSorting:    true,
    manualFiltering:  true,
  });

  // ── Loading state ───────────────────────────────────────────────────────────
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

  // ── Error state ─────────────────────────────────────────────────────────────
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
              {isFetching
                ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAddOpen(true)} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">

          {/* ── Filter Bar ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Search — debounced 300ms */}
            <SearchInput
  placeholder="Search username..."
  value={searchInput}
  onChange={handleSearchChange}
  onClear={() => { setSearchInput(""); debouncedSearch(""); }}
/>

            {/* Role — Combobox */}
            <FilterCombobox
              placeholder="Role"
              options={roleOptions}
              value={roleId}
              onValueChange={(v) => { setRoleId(v || null); setPage(1); }}
            />

            {/* Module — Combobox */}
            <FilterCombobox
              placeholder="Module"
              options={moduleOptions}
              value={moduleId}
              onValueChange={(v) => { setModuleId(v || null); setPage(1); }}
            />

            {/* Permission — Combobox */}
            <FilterCombobox
              placeholder="Permission"
              options={permissionOptions}
              value={permissionId}
              onValueChange={(v) => { setPermissionId(v || null); setPage(1); }}
            />

            {/* Reset all */}
            {hasActiveFilters && (
              <Button
                variant="ghost" size="sm"
                className="h-9 border border-dashed text-muted-foreground hover:text-foreground"
                onClick={clearAllFilters}
              >
                Reset <IconX className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Columns — pushed right */}
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 font-medium shadow-sm">
                  <IconColumns3Filled className="size-3.5"/>  Columns 
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  {table.getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        className="capitalize"
                        checked={col.getIsVisible()}
                        onCheckedChange={(v) => col.toggleVisibility(!!v)}
                      >
                        {col.id.replace(/_/g, " ")}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Record count */}
          <p className="text-sm font-medium text-muted-foreground">
            {isFetching
              ? "Loading records..."
              : `${total.toLocaleString()} user${total !== 1 ? "s" : ""} found`}
          </p>

          {/* ── Table ──────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-md border">
            {isFetching && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 rounded-md">
                <div className="flex items-center gap-2.5 rounded-lg bg-background/90 px-4 py-2.5 shadow-md border text-sm font-medium">
                  <Spinner className="h-4 w-4" />
                  Loading users…
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} className="font-medium">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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

      {isAddOpen      && <AddUserDialog        open={isAddOpen}      onOpenChange={setIsAddOpen}      showConfirmation={showConfirmation} />}
      {isUpdateOpen   && <UpdateUserDialog     open={isUpdateOpen}   onOpenChange={setIsUpdateOpen}   showConfirmation={showConfirmation} user={selectedUser} />}
      {isPasswordOpen && <ChangePasswordDialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen} user={selectedUser} />}
      <ConfirmationDialog />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ isFetching, onRefetch, onAdd, disabled }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Users</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>User Management</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
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
            <IconPlus size={18} className="mr-1" /> Add User
          </Button>
        </div>
      </div>
    </div>
  );
}