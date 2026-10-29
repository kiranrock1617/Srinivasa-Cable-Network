import { z } from "zod";

export const customerInputSchema = z.object({
  serialNo: z
    .union([z.number(), z.string()])
    .transform((v) => {
      if (v === undefined || v === null || v === "") return NaN;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : NaN;
    })
    .pipe(z.number({ invalid_type_error: "Serial No is required" }).int("Serial No must be a whole number").positive("Serial No must be greater than 0")),

  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be at most 200 characters"),
  vcNo: z
    .string()
    .trim()
    .length(11, "VC No must be exactly 11 characters"),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must be at most 500 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),

  image: z.string().max(2_000_000).optional().default(""),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export type Customer = {
  id: string;
  serialNo: number | null;
  name: string;
  vcNo: string;
  address: string;
  phone: string;
  image: string;
  createdAt: string;
  updatedAt: string;
};
