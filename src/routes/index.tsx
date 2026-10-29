import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppShell } from "@/components/app-shell";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { customersListQuery } from "@/lib/customers.queries";
import { deleteCustomer } from "@/lib/customers.functions";
import { toUserMessage } from "@/lib/errors";
import {
  exportCustomersCsv,
  exportCustomersJson,
  exportCustomersPdf,
  withSerialNumbers,
} from "@/lib/customer-export";

import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Pencil,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";



export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(customersListQuery),
  component: CustomersPage,
  pendingComponent: CustomersPending,
  pendingMs: 200,
  errorComponent: RouteErrorBoundary,
});

function TableRowSkeleton() {
  return (
    <TableRow className="border-b border-white/40 dark:border-white/5">
      <TableCell><Skeleton className="h-4 w-6" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </TableCell>
    </TableRow>
  );
}

function CardSkeleton() {
  return (
    <div className="glass-surface rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <>
      <div className="grid gap-3 sm:hidden">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="glass-surface hidden overflow-hidden rounded-2xl sm:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/50 bg-white/40 hover:bg-white/40 dark:border-white/10 dark:bg-white/5">
              <TableHead className="w-14 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">S. No</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">VC No</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Address</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Phone</TableHead>
              <TableHead className="w-20 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Image</TableHead>
              <TableHead className="w-40 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function CustomersPending() {
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <CustomersSkeleton />
    </AppShell>
  );
}

function CustomersPage() {
  const { data: customers } = useSuspenseQuery(customersListQuery);
  const [query, setQuery] = useState("");
  const [filterBy, setFilterBy] = useState<"default" | "name" | "serialNo" | "vcNo" | "phone" | "address">("default");
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const qc = useQueryClient();
  const deleteFn = useServerFn(deleteCustomer);

  const copyVc = async (vc: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(vc);
      } else {
        const ta = document.createElement("textarea");
        ta.value = vc;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success(`VC ${vc} copied`);
    } catch {
      toast.error("Failed to copy");
    }
  };


  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Customer deleted");
      qc.invalidateQueries({ queryKey: ["customers"] });
      setToDelete(null);
    },
    onError: (e) => toast.error(toUserMessage(e, "Failed to delete")),
  });


  // Ascending serial numbers assigned from the stored order (createdAt ASC)
  const numbered = useMemo(() => withSerialNumbers(customers), [customers]);

  // Search — default: name + serial (substring). Phone/VC: exact match. Others: substring on chosen field.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return numbered;
    return numbered.filter((c) => {
      switch (filterBy) {
        case "name":
          return c.name.toLowerCase().includes(q);
        case "serialNo":
          return String(c.serialNo ?? "") === q;
        case "vcNo":
          return String(c.vcNo ?? "").toLowerCase() === q;
        case "phone":
          return String(c.phone ?? "").replace(/\D/g, "") === q.replace(/\D/g, "");
        case "address":
          return String(c.address ?? "").toLowerCase().includes(q);
        default:
          return (
            c.name.toLowerCase().includes(q) ||
            String(c.serialNo ?? "").includes(q)
          );
      }
    });
  }, [numbered, query, filterBy]);



  const handleCsv = () => {
    if (filtered.length === 0) {
      toast.info("No customers to export");
      return;
    }
    exportCustomersCsv(filtered);
    toast.success(`Exported ${filtered.length} rows to CSV`);
  };

  const handlePdf = async () => {
    if (filtered.length === 0) {
      toast.info("No customers to export");
      return;
    }
    try {
      await exportCustomersPdf(filtered);
      toast.success(`Exported ${filtered.length} rows to PDF`);
    } catch (e) {
      console.error(e);
      toast.error(toUserMessage(e, "Could not build PDF"));
    }
  };

  const handleJson = () => {
    if (filtered.length === 0) {
      toast.info("No customers to export");
      return;
    }
    exportCustomersJson(filtered);
    toast.success(`Exported ${filtered.length} rows to JSON`);
  };



  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        {/* Left: heading + search */}
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-[30px]">
              Customers
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {customers.length.toLocaleString()}
              </span>
              <span>total {customers.length === 1 ? "customer" : "customers"}</span>
            </p>
          </div>
          <div className="relative flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  filterBy === "default"
                    ? "Search by name or S. No"
                    : filterBy === "phone"
                    ? "Exact phone number"
                    : filterBy === "vcNo"
                    ? "Exact VC number"
                    : filterBy === "serialNo"
                    ? "Exact serial number"
                    : filterBy === "name"
                    ? "Search by name"
                    : "Search by address"
                }
                inputMode={filterBy === "phone" || filterBy === "serialNo" ? "numeric" : "text"}
                aria-label={`Search customers by ${filterBy === "default" ? "name or serial number" : filterBy}`}
                className="glass-surface h-12 w-full rounded-2xl border-transparent pl-11 pr-10 text-sm shadow-[0_4px_20px_-8px_oklch(0.62_0.19_256/0.25)] placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Choose which field to search"
                  title="Filter by field"
                  className="glass-surface relative h-12 w-12 shrink-0 rounded-2xl border-transparent shadow-[0_4px_20px_-8px_oklch(0.62_0.19_256/0.25)] hover:bg-white dark:hover:bg-white/10"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  {filterBy !== "default" && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" aria-hidden="true" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong w-52">
                {([
                  { id: "default", label: "Name or S. No", hint: "default" },
                  { id: "name", label: "Name only", hint: "contains" },
                  { id: "serialNo", label: "S. No", hint: "exact" },
                  { id: "vcNo", label: "VC number", hint: "exact" },
                  { id: "phone", label: "Phone number", hint: "exact" },
                  { id: "address", label: "Address", hint: "contains" },
                ] as const).map((opt) => {
                  const active = filterBy === opt.id;
                  return (
                    <DropdownMenuItem key={opt.id} onClick={() => setFilterBy(opt.id)}>
                      <span className="flex-1">{opt.label}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{opt.hint}</span>
                      {active && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="glass-surface h-11 rounded-2xl border-white/60 px-4 shadow-sm hover:bg-white dark:hover:bg-white/10"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Export</span>
                <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong">
              <DropdownMenuItem onClick={handleCsv}>
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePdf}>
                <FileText className="h-4 w-4" aria-hidden="true" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleJson}>
                <FileText className="h-4 w-4" aria-hidden="true" />
                Download JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            asChild
            className="h-11 rounded-2xl bg-primary px-5 font-semibold shadow-[0_10px_30px_-10px_oklch(0.62_0.19_256/0.7)] transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Link to="/customers/new" aria-label="Add customer">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add customer</span>
            </Link>
          </Button>
        </div>
      </div>



      <>
      {/* Mobile card list */}
      <div className="grid gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <div className="glass-surface rounded-2xl p-8 text-center text-sm text-muted-foreground">
            {customers.length === 0
              ? "No customers yet. Tap + to add one."
              : "No customers match your search."}
          </div>
        ) : (
          filtered.map((c) => (
            <article
              key={c.id}
              className="glass-surface overflow-hidden rounded-2xl shadow-[0_4px_20px_-12px_oklch(0.62_0.19_256/0.4)] ring-1 ring-white/60 transition active:scale-[0.99] dark:ring-white/10"
            >
              <div className="flex items-start gap-3 p-4">
                {c.image ? (
                  <img
                    src={c.image}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-white/60"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-white/60"
                  >
                    <UserRound className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-[10px] font-semibold tabular-nums text-primary">
                      {c.serialNo}
                    </span>
                    <h3 className="truncate text-[15px] font-semibold leading-tight">
                      {c.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyVc(c.vcNo)}
                    aria-label={`Copy VC number ${c.vcNo}`}
                    className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 font-mono text-xs font-medium text-foreground/80 transition active:scale-95 active:bg-primary/15"
                  >
                    <span className="truncate">{c.vcNo}</span>
                    <Copy className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
                  </button>

                  <div className="mt-2.5 flex items-start gap-2 text-sm text-foreground/80">
                    <svg aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <p className="line-clamp-2 leading-snug">{c.address}</p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-muted-foreground hover:text-primary"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {c.phone}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 border-t border-white/40 bg-white/30 p-2 dark:border-white/5 dark:bg-white/[0.02]">
                <Button asChild variant="ghost" size="sm" className="h-10 rounded-xl text-primary hover:bg-primary/10">
                  <Link to="/customers/$id" params={{ id: c.id }} aria-label={`View ${c.name}`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-semibold">View</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="h-10 rounded-xl text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                  <Link
                    to="/customers/$id/edit"
                    params={{ id: c.id }}
                    aria-label={`Edit ${c.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-semibold">Edit</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${c.name}`}
                  className="h-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setToDelete({ id: c.id, name: c.name })}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold">Delete</span>
                </Button>
              </div>
            </article>
          ))

        )}
      </div>


      {/* Desktop table */}
      <div className="glass-surface hidden overflow-hidden rounded-2xl shadow-[0_10px_40px_-20px_oklch(0.62_0.19_256/0.3)] ring-1 ring-white/60 sm:block dark:ring-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/50 bg-white/50 hover:bg-white/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/5">
              <TableHead className="w-14 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                S. No
              </TableHead>
              <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                VC No
              </TableHead>
              <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Address
              </TableHead>
              <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Phone
              </TableHead>
              <TableHead className="w-20 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Image
              </TableHead>
              <TableHead className="w-40 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                  {customers.length === 0
                    ? "No customers yet. Click 'Add customer' to get started."
                    : "No customers match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="group border-b border-white/40 transition-colors hover:bg-primary/[0.04] dark:border-white/5 dark:hover:bg-white/[0.04]"
                >
                  <TableCell className="py-4 font-semibold tabular-nums text-muted-foreground">
                    {c.serialNo}
                  </TableCell>
                  <TableCell className="py-4 font-semibold text-foreground">{c.name}</TableCell>
                  <TableCell className="py-4">
                    <button
                      type="button"
                      onClick={() => copyVc(c.vcNo)}
                      aria-label={`Copy VC number ${c.vcNo}`}
                      title="Click to copy"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-foreground/80 transition hover:bg-primary/10 hover:text-primary"
                    >
                      {c.vcNo}
                      <Copy className="h-3 w-3 opacity-50 transition group-hover:opacity-100" aria-hidden="true" />
                    </button>
                  </TableCell>

                  <TableCell className="max-w-xs truncate py-4 text-sm text-foreground/80">{c.address}</TableCell>
                  <TableCell className="py-4 text-sm font-medium tabular-nums text-foreground/80">{c.phone}</TableCell>
                  <TableCell className="py-4">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-white/70"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-2 ring-white shadow-sm dark:ring-white/70"
                      >
                        <UserRound className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <Link
                          to="/customers/$id"
                          params={{ id: c.id }}
                          aria-label={`View ${c.name}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                      >
                        <Link
                          to="/customers/$id/edit"
                          params={{ id: c.id }}
                          aria-label={`Edit ${c.name}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${c.name}`}
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setToDelete({ id: c.id, name: c.name })}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      </>



      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{toDelete?.name}</span> from your
              database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) deleteMut.mutate(toDelete.id);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
