import { z } from "zod";

/**
 * ECP-023 AC4: there is no field for `user_id` anywhere in this schema - Zod strips unknown
 * keys by default, so even a client that sends `user_id` directly to the API gets it silently
 * discarded before the service layer ever sees it (see user.schema.test.ts).
 */
export const createUserSchema = z.object({
  username: z.string().min(1, "กรุณากรอก username"),
  fullName: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  roleId: z.number().int().positive("กรุณาเลือก role"),
  status: z.enum(["Active", "Inactive"]).default("Active")
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  roleId: z.number().int().positive().optional(),
  status: z.enum(["Active", "Inactive"]).optional()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
