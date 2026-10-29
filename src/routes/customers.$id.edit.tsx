import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CustomerForm } from "@/components/customer-form";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { customerQuery } from "@/lib/customers.queries";
import { updateCustomer } from "@/lib/customers.functions";
import { toUserMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/customers/$id/edit")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(customerQuery(params.id));
    if (!data) throw notFound();
  },
  component: EditCustomerPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <h1 className="text-xl font-semibold">Customer not found</h1>
        <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/">Back to customers</Link>
        </Button>
      </div>
    </AppShell>
  ),
});

function EditCustomerPage() {
  const { id } = Route.useParams();
  const { data: customer } = useSuspenseQuery(customerQuery(id));
  const navigate = useNavigate();
  const qc = useQueryClient();
  const updateFn = useServerFn(updateCustomer);

  const mutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      toast.success("Customer updated");
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customers", id] });
      navigate({ to: "/customers/$id", params: { id } });
    },
    onError: (e) => toast.error(toUserMessage(e, "Could not update customer")),
  });

  if (!customer) return null;

  return (
    <AppShell>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
          <Link to="/customers/$id" params={{ id }}>
            <ArrowLeft className="h-4 w-4" />
            Back to customer
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Edit customer</h1>
        <p className="text-sm text-muted-foreground">Update {customer.name}'s details.</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <CustomerForm
          key={`${customer.id}-${customer.updatedAt}`}
          submitLabel="Save changes"
          submitting={mutation.isPending}
          initial={{ ...customer, serialNo: customer.serialNo ?? undefined }}
          onSubmit={(values) => mutation.mutate({ data: { id, input: values } })}
          onCancel={() => navigate({ to: "/customers/$id", params: { id } })}
        />
      </div>
    </AppShell>
  );
}
