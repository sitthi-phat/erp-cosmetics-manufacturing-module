/**
 * AppError + Thai-facing error catalogue (ECP-036: no technical jargon/stack traces surfaced
 * to the user; errorHandler middleware converts every thrown error into
 * `{ error: { code, message, fields? } }`).
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  fields?: Record<string, string>;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    fields?: Record<string, string>
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static validation(message: string, fields?: Record<string, string>): AppError {
    return new AppError("VALIDATION_ERROR", message, 400, fields);
  }

  static notFound(message: string): AppError {
    return new AppError("NOT_FOUND", message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError("CONFLICT", message, 409);
  }

  static forbidden(message = "คุณไม่มีสิทธิ์เข้าถึงหน้านี้"): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }

  static unauthorized(message = "กรุณาเข้าสู่ระบบก่อนใช้งาน"): AppError {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static internal(message = "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"): AppError {
    return new AppError("INTERNAL_ERROR", message, 500);
  }
}
