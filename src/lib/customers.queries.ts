import { queryOptions } from "@tanstack/react-query";
import { getCustomer, listCustomers } from "./customers.functions";

export const customersListQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: () => listCustomers(),
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
    queryFn: () => getCustomer({ data: { id } }),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
    retry: 1,
  });
