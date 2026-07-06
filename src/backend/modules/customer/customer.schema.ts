import { z } from "zod";

/** ECP-001 AC1/AC4: no `customer_id` field here - Zod strips any client-supplied id. */
export const createCustomerSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อลูกค้า"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  contactPerson: z.string().optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().min(1, "กรุณากรอกอีเมล").optional(),
  contactPerson: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional()
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
