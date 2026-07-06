import { useMemo, useState } from "react";
import { Card, DataTable, Button, Modal, Form, TextField, PasswordField, SelectField, NumberField, SubmitButton, StatusTag, Notify } from "../../ui";
import {
  useUsers,
  useRoles,
  useCreateUser,
  useUpdateUser,
  useVatConfig,
  useUpdateVatConfig,
  useUpdateRolePermissions
} from "../../hooks/useAdmin";
import { ApiError } from "../../lib/apiClient";

interface PermissionTuple {
  resource: string;
  action: string;
}

/**
 * ECP-024: lets Admin toggle permission per (resource, action) for a chosen role, without
 * touching code/deploy. The guardrail against removing the last `manage_permission` grant is
 * enforced server-side (rbac.rules.ts) - this UI just surfaces whatever error comes back.
 */
function RolePermissionEditor({ roles }: { roles: any[] }) {
  const updateRolePermissions = useUpdateRolePermissions();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(roles[0]?.id ?? null);

  // Canonical tuple list = union of every (resource, action) pair seen across all roles
  // (Admin's seeded permissions already cover the full matrix - architecture.md §7).
  const canonicalTuples: PermissionTuple[] = useMemo(() => {
    const seen = new Map<string, PermissionTuple>();
    for (const role of roles) {
      for (const p of role.permissions ?? []) {
        seen.set(`${p.resource}::${p.action}`, { resource: p.resource, action: p.action });
      }
    }
    return [...seen.values()].sort((a, b) => (a.resource + a.action).localeCompare(b.resource + b.action));
  }, [roles]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const [draft, setDraft] = useState<Record<string, boolean>>({});

  function tupleKey(t: PermissionTuple) {
    return `${t.resource}::${t.action}`;
  }

  function isChecked(t: PermissionTuple): boolean {
    const key = tupleKey(t);
    if (key in draft) return draft[key];
    return Boolean(selectedRole?.permissions?.some((p: any) => p.resource === t.resource && p.action === t.action && p.allow));
  }

  function toggle(t: PermissionTuple) {
    setDraft((prev) => ({ ...prev, [tupleKey(t)]: !isChecked(t) }));
  }

  async function handleSave() {
    if (!selectedRoleId) return;
    const permissions = canonicalTuples.map((t) => ({ resource: t.resource, action: t.action, allow: isChecked(t) }));
    try {
      await updateRolePermissions.mutateAsync({ roleId: selectedRoleId, permissions });
      Notify.success("บันทึกสิทธิ์สำเร็จ - มีผลภายใน 5 นาที หรือทันทีสำหรับ session ใหม่");
      setDraft({});
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <Card title="กำหนดสิทธิ์ (Permission) ต่อ Role (ECP-024)">
      <select
        value={selectedRoleId ?? ""}
        onChange={(e) => {
          setSelectedRoleId(Number(e.target.value));
          setDraft({});
        }}
        style={{ marginBottom: 16 }}
      >
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.roleName}
          </option>
        ))}
      </select>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {canonicalTuples.map((t) => (
          <label key={tupleKey(t)}>
            <input type="checkbox" checked={isChecked(t)} onChange={() => toggle(t)} /> {t.resource}.{t.action}
          </label>
        ))}
      </div>
      <Button variant="primary" onClick={handleSave}>
        บันทึกสิทธิ์ของ role นี้
      </Button>
    </Card>
  );
}

/**
 * ECP-038 AC1: the VAT settings section lives on the SAME page as user management.
 */
export function AdminPage() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: vatConfig } = useVatConfig();
  const updateVat = useUpdateVatConfig();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  async function handleCreateUser(values: Record<string, unknown>) {
    try {
      await createUser.mutateAsync({
        username: String(values.username),
        fullName: String(values.fullName),
        password: String(values.password),
        roleId: Number(values.roleId)
      });
      Notify.success("สร้างผู้ใช้งานสำเร็จ");
      setCreateModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function changeRole(userId: number, roleId: number) {
    try {
      await updateUser.mutateAsync({ id: userId, input: { roleId } });
      Notify.success("เปลี่ยน role สำเร็จ - มีผลภายใน 5 นาที หรือเมื่อเข้าใช้งานครั้งถัดไป");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleUpdateVat(values: Record<string, unknown>) {
    try {
      await updateVat.mutateAsync(Number(values.rate));
      Notify.success("บันทึกอัตรา VAT สำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <div>
      <Card title="จัดการผู้ใช้งาน" extra={<Button variant="primary" onClick={() => setCreateModalOpen(true)}>+ สร้างผู้ใช้ใหม่</Button>}>
        <DataTable
          loading={usersLoading}
          rows={users ?? []}
          rowKey={(u: any) => u.id}
          columns={[
            { key: "userId", title: "รหัสผู้ใช้", dataIndex: "userId" },
            { key: "username", title: "username", dataIndex: "username" },
            { key: "fullName", title: "ชื่อ-นามสกุล", dataIndex: "fullName" },
            { key: "roleName", title: "Role", dataIndex: "roleName" },
            { key: "status", title: "สถานะ", render: (u: any) => <StatusTag status={u.status} /> },
            {
              key: "actions",
              title: "เปลี่ยน role",
              render: (u: any) => (
                <select defaultValue={u.roleId} onChange={(e) => changeRole(u.id, Number(e.target.value))}>
                  {(roles ?? []).map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
              )
            }
          ]}
        />
        <Modal open={createModalOpen} title="สร้างผู้ใช้ใหม่" onCancel={() => setCreateModalOpen(false)}>
          <Form onSubmit={handleCreateUser}>
            <TextField name="username" label="username" required />
            <TextField name="fullName" label="ชื่อ-นามสกุล" required />
            <PasswordField name="password" label="รหัสผ่านตั้งต้น" required />
            <SelectField
              name="roleId"
              label="Role"
              required
              options={(roles ?? []).map((r: any) => ({ value: r.id, label: r.roleName }))}
            />
            <SubmitButton loading={createUser.isPending}>สร้าง</SubmitButton>
          </Form>
        </Modal>
      </Card>

      {roles && roles.length > 0 && <RolePermissionEditor roles={roles} />}

      <Card title="ตั้งค่า VAT (ECP-038)">
        <p>อัตรา VAT ปัจจุบัน: {vatConfig?.rate}%</p>
        <Form onSubmit={handleUpdateVat} initialValues={{ rate: vatConfig?.rate }}>
          <NumberField name="rate" label="อัตรา VAT ใหม่ (%)" required min={0} max={100} step={0.01} />
          <SubmitButton loading={updateVat.isPending}>บันทึก</SubmitButton>
        </Form>
        <p style={{ color: "#888" }}>ค่าใหม่มีผลกับ invoice ที่ออกใหม่เท่านั้น - invoice เดิมยังคง snapshot อัตราเดิมไว้เสมอ</p>
      </Card>
    </div>
  );
}
