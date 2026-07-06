import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, TextField, PasswordField, SubmitButton, Notify } from "../ui";
import { apiClient, ApiError } from "../lib/apiClient";
import { useInvalidateMe } from "../lib/authContext";

export function LoginPage() {
  const navigate = useNavigate();
  const invalidateMe = useInvalidateMe();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: Record<string, unknown>) {
    setLoading(true);
    try {
      await apiClient.post("/auth/login", values);
      invalidateMe();
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        Notify.error(err.message);
      } else {
        Notify.error("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Card title="เข้าสู่ระบบ ERP Cosmetics Factory">
        <div style={{ width: 320 }}>
          <Form onSubmit={handleSubmit}>
            <TextField name="username" label="ชื่อผู้ใช้ (username)" required testId="login-username" />
            <PasswordField name="password" label="รหัสผ่าน" required testId="login-password" />
            <SubmitButton loading={loading} testId="login-submit">
              เข้าสู่ระบบ
            </SubmitButton>
          </Form>
        </div>
      </Card>
    </div>
  );
}
