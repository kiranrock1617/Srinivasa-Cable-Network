import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { customerQuery } from "@/lib/customers.queries";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, UserRound } from "lucide-react";

export const Route = createFileRoute("/customers/$id/")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(customerQuery(params.id));
    if (!data) throw notFound();
  },
  component: CustomerDetailPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <h1 className="text-xl font-semibold">Customer not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The record you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/">Back to customers</Link>
        </Button>
      </div>
    </AppShell>
  ),
});

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const { data: customer } = useSuspenseQuery(customerQuery(id));
  if (!customer) return null;

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to customers
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">VC No {customer.vcNo}</p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/customers/$id/edit" params={{ id: customer.id }}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          {customer.image ? (
            <img
              src={customer.image}
              alt={customer.name}
              className="aspect-square w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
              <UserRound className="h-16 w-16" />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Serial No" value={customer.serialNo != null ? String(customer.serialNo) : ""} mono />
            <Field label="Name" value={customer.name} />
            <Field label="VC No" value={customer.vcNo} mono />
            <Field label="Phone" value={customer.phone} />

            <div className="sm:col-span-2">
              <Field label="Address" value={customer.address} block />
            </div>
          </dl>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  mono,
  block,
}: {
  label: string;
  value: string;
  mono?: boolean;
  block?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={
          "mt-1 text-sm text-foreground " +
          (mono ? "font-mono " : "") +
          (block ? "whitespace-pre-wrap" : "")
        }
      >
        {value || "—"}
      </dd>
    </div>
  );
}
