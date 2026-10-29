import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CustomerForm } from "@/components/customer-form";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { createCustomer } from "@/lib/customers.functions";
import type { Customer } from "@/lib/customers.schema";
import { toUserMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/customers/new")({
  component: NewCustomerPage,
  errorComponent: RouteErrorBoundary,
});

function NewCustomerPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createCustomer);

  const mutation = useMutation({
    mutationFn: createFn,
    onSuccess: (created) => {
      // Push the new customer straight into the cache so the list renders
      // instantly on navigation — no need to wait for a refetch round-trip.
      qc.setQueryData<Customer[]>(["customers"], (prev) => {
        const next = Array.isArray(prev) ? [...prev, created] : [created];
        next.sort((a, b) => {
          const sa = typeof a.serialNo === "number" ? a.serialNo : Number.POSITIVE_INFINITY;
          const sb = typeof b.serialNo === "number" ? b.serialNo : Number.POSITIVE_INFINITY;
          if (sa !== sb) return sa - sb;
          return a.createdAt.localeCompare(b.createdAt);
        });
        return next;
      });
      toast.success("Customer added");
      navigate({ to: "/" });
      // Background reconcile — don't block navigation on it.
      void qc.invalidateQueries({ queryKey: ["customers"], refetchType: "active" });
    },
    onError: (e) => toast.error(toUserMessage(e, "Could not add customer")),
  });


  return (
    <AppShell>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Add customer</h1>
        <p className="text-sm text-muted-foreground">Create a new customer record.</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <CustomerForm
          submitLabel="Save customer"
          submitting={mutation.isPending}
          onSubmit={(values) => mutation.mutate({ data: values })}
          onCancel={() => navigate({ to: "/" })}
        />
      </div>
    </AppShell>
  );
}
