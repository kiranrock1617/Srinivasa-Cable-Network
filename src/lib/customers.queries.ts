import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Customer } from "./customers.schema";

function serialize(row: any): Customer {
  return {
    id: row.id,
    serialNo: typeof row.serial_no === "number" ? row.serial_no : null,
    name: row.name ?? "",
    vcNo: row.vc_no ?? "",
    address: row.address ?? "",
    phone: row.phone ?? "",
    image: row.image ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

export const customersListQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("customers" as any)
      .select("*")
      .order("serial_no", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(serialize);
  },
  refetchOnWindowFocus: true,
  refetchOnMount: "always",
  refetchInterval: 15_000,
  staleTime: 0,
  retry: 1,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5_000),
});

export const customerQuery = (id: string) =>
  queryOptions({
    queryKey: ["customers", id],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("customers" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return row ? serialize(row) : null;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
    retry: 1,
  });