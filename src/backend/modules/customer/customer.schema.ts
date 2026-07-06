import { z } from "zod";
import { isValidTaxId } from "../../../shared/taxId";

/**
 * Gate 2 rework (E23, ECP-001 AC5-7): taxId is OPTIONAL at creation (AC7 - not required to save
 * a customer) but must be exactly 13 numeric digits WHEN a value is actually provided (AC6).
 * registeredAddress is optional too (falls back to `address` at print time per §"open items" #4).
 */
const taxIdSchema = z
  .string()
  .optional()
  // Treat an explicitly-empty string the same as "not provided" (untouched form field) -
  // only a genuinely non-empty value is subject to the 13-digit format check.
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => v === undefined || isValidTaxId(v), {
    message: "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลักเท่านั้น"
  });

/** ECP-001 AC1/AC4: no `customer_id` field here - Zod strips any client-supplied id. */
export const createCustomerSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อลูกค้า"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  contactPerson: z.string().optional(),
  taxId: taxIdSchema,
  registeredAddress: z.string().optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().min(1, "กรุณากรอกอีเมล").optional(),
  contactPerson: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  taxId: taxIdSchema,
  registeredAddress: z.string().optional()
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
