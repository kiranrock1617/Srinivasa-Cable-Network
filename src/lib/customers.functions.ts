import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { customerInputSchema, type Customer } from "./customers.schema";
import { toServerError } from "./errors";

type CustomerRow = {
  id: string;
  serial_no: number | null;
  name: string;
  vc_no: string;
  address: string;
  phone: string;
  image: string | null;
  created_at: string;
  updated_at: string;
};

export function serializeCustomer(row: CustomerRow): Customer {
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

const idSchema = z.object({ id: z.string().min(1, "Missing customer id") });

// Helper so these functions work whether called directly OR passed into useServerFn()
function makeClientFn<TInput, TOutput>(fn: (arg: TInput) => Promise<TOutput>) {
  const wrapped: any = async (arg?: TInput) => fn(arg as TInput);
  wrapped.url = "/_client_fn";
  wrapped.__executeServer = async (opts: any) => fn(opts);
  return wrapped as (arg?: TInput) => Promise<TOutput>;
}

export const listCustomers = makeClientFn(async () => {
  try {
    const { data, error } = await supabase
      .from("customers" as any)
      .select("*")
      .order("serial_no", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as CustomerRow[]).map(serializeCustomer);
  } catch (e) {
    console.error("[listCustomers]", e);
    throw toServerError(e, "Could not load customers");
  }
});

export const getCustomer = makeClientFn(async (opts: { data: { id: string } }) => {
  try {
    const parsed = idSchema.parse(opts?.data ?? opts);
    const { data: row, error } = await supabase
      .from("customers" as any)
      .select("*")
      .eq("id", parsed.id)
      .maybeSingle();
    if (error) throw error;
    return row ? serializeCustomer(row as unknown as CustomerRow) : null;
  } catch (e) {
    console.error("[getCustomer]", e);
    throw toServerError(e, "Could not load customer");
  }
});

export const createCustomer = makeClientFn(async (opts: { data: z.infer<typeof customerInputSchema> }) => {
  try {
    const data = customerInputSchema.parse(opts?.data ?? opts);
    const { data: clash } = await supabase
      .from("customers" as any)
      .select("id")
      .eq("serial_no", data.serialNo)
      .maybeSingle();
    if (clash) throw new Error(`Serial No ${data.serialNo} is already in use`);

    const { data: row, error } = await supabase
      .from("customers" as any)
      .insert({
        serial_no: data.serialNo,
        name: data.name,
        vc_no: data.vcNo,
        address: data.address,
        phone: data.phone,
        image: data.image ?? "",
      } as any)
      .select("*")
      .single();
    if (error) throw error;
    return serializeCustomer(row as unknown as CustomerRow);
  } catch (e: any) {
    if (e?.code === "23505") throw new Error("A customer with this Serial No or VC No already exists");
    console.error("[createCustomer]", e);
    throw toServerError(e, "Could not add customer");
  }
});

export const updateCustomer = makeClientFn(
  async (opts: { data: { id: string; input: z.infer<typeof customerInputSchema> } }) => {
    try {
      const data = z
        .object({ id: z.string().min(1, "Missing customer id"), input: customerInputSchema })
        .parse(opts?.data ?? opts);

      const { data: clash } = await supabase
        .from("customers" as any)
        .select("id")
        .eq("serial_no", data.input.serialNo)
        .neq("id", data.id)
        .maybeSingle();
      if (clash) throw new Error(`Serial No ${data.input.serialNo} is already in use`);

      const { data: row, error } = await supabase
        .from("customers" as any)
        .update({
          serial_no: data.input.serialNo,
          name: data.input.name,
          vc_no: data.input.vcNo,
          address: data.input.address,
          phone: data.input.phone,
          image: data.input.image ?? "",
        } as any)
        .eq("id", data.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!row) throw new Error("Customer not found");
      return serializeCustomer(row as unknown as CustomerRow);
    } catch (e: any) {
      if (e?.code === "23505") throw new Error("A customer with this Serial No or VC No already exists");
      if (e instanceof Error && /not found/i.test(e.message)) throw e;
      console.error("[updateCustomer]", e);
      throw toServerError(e, "Could not update customer");
    }
  },
);

export const deleteCustomer = makeClientFn(async (opts: { data: { id: string } }) => {
  try {
    const data = idSchema.parse(opts?.data ?? opts);
    const { error, count } = await supabase
      .from("customers" as any)
      .delete({ count: "exact" })
      .eq("id", data.id);
    if (error) throw error;
    if ((count ?? 0) === 0) throw new Error("Customer not found");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && /not found/i.test(e.message)) throw e;
    console.error("[deleteCustomer]", e);
    throw toServerError(e, "Could not delete customer");
  }
});