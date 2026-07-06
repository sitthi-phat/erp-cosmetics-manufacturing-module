import { useState } from "react";
import { Card, DataTable, Button, Modal, Form, TextField, SubmitButton, StatusTag, Notify, EmptyState } from "../ui";
import { useCreateCustomer, useCustomers, useUpdateCustomer, useCustomerPOs, Customer } from "../hooks/useCustomers";

/** ECP-001 AC5/AC7: a customer with no tax_id yet cannot be used to print a tax invoice later. */
function TaxIdWarning({ customer }: { customer: Customer }) {
  if (customer.taxId) return null;
  return (
    <span data-testid="no-tax-id-warning" style={{ color: "#ad6800" }}>
      ยังไม่มีเลขประจำตัวผู้เสียภาษี (จะออกใบกำกับภาษีไม่ได้จนกว่าจะเพิ่มข้อมูลนี้)
    </span>
  );
}

export function CustomersPage() {
  const [q, setQ] = useState("");
  const { data: customers, isLoading } = useCustomers(q);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const [modalOpen, setModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Customer | null>(null);
  const { data: customerPOs } = useCustomerPOs(historyTarget?.id ?? null);

  async function handleCreate(values: Record<string, unknown>) {
    try {
      const result = await createCustomer.mutateAsync(values as any);
      if (result.warning) Notify.warning(result.warning);
      else Notify.success("สร้างลูกค้าใหม่สำเร็จ");
      setModalOpen(false);
    } catch (err: any) {
      Notify.error(err?.message ?? "เกิดข้อผิดพลาด");
    }
  }

  async function toggleStatus(c: Customer) {
    const nextStatus = c.status === "Active" ? "Inactive" : "Active";
    const result = await updateCustomer.mutateAsync({ id: c.id, input: { status: nextStatus } });
    if (result.warning) Notify.warning(result.warning);
  }

  return (
    <Card
      title="จัดการลูกค้า"
      extra={<Button variant="primary" onClick={() => setModalOpen(true)}>+ สร้างลูกค้าใหม่</Button>}
    >
      <input
        placeholder="ค้นหาชื่อลูกค้า..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 16, padding: 6, width: 320 }}
      />
      <DataTable<Customer>
        loading={isLoading}
        rows={customers ?? []}
        rowKey={(c) => c.id}
        emptyText="ไม่พบลูกค้าที่ตรงกับคำค้นหา"
        columns={[
          { key: "customerId", title: "รหัสลูกค้า", dataIndex: "customerId" },
          { key: "name", title: "ชื่อลูกค้า", dataIndex: "name" },
          { key: "phone", title: "เบอร์โทร", dataIndex: "phone" },
          { key: "email", title: "อีเมล", dataIndex: "email" },
          { key: "taxId", title: "เลขผู้เสียภาษี", render: (c) => c.taxId ?? <TaxIdWarning customer={c} /> },
          { key: "status", title: "สถานะ", render: (c) => <StatusTag status={c.status} /> },
          {
            key: "actions",
            title: "",
            render: (c) => (
              <>
                <Button onClick={() => toggleStatus(c)}>{c.status === "Active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}</Button>{" "}
                <Button onClick={() => setHistoryTarget(c)}>ประวัติ PO</Button>
              </>
            )
          }
        ]}
      />
      <Modal open={modalOpen} title="สร้างลูกค้าใหม่" onCancel={() => setModalOpen(false)} onOk={undefined}>
        <Form onSubmit={handleCreate}>
          <TextField name="name" label="ชื่อลูกค้า" required errorMessage="กรุณากรอกชื่อลูกค้า" />
          <TextField name="address" label="ที่อยู่" />
          <TextField name="phone" label="เบอร์โทร" />
          <TextField name="email" label="อีเมล" />
          <TextField name="contactPerson" label="ผู้ติดต่อ" />
          <TextField
            name="taxId"
            label="เลขประจำตัวผู้เสียภาษี (13 หลัก, ไม่บังคับตอนสร้าง)"
            placeholder="0105558000001"
            testId="customer-tax-id"
          />
          <TextField
            name="registeredAddress"
            label="ที่อยู่จดทะเบียน (สำหรับใบกำกับภาษี - ถ้าไม่กรอกจะใช้ที่อยู่หลัก)"
            testId="customer-registered-address"
          />
          <SubmitButton loading={createCustomer.isPending}>บันทึก</SubmitButton>
        </Form>
      </Modal>
      <Modal open={historyTarget !== null} title={`ประวัติ PO ของ ${historyTarget?.name ?? ""}`} onCancel={() => setHistoryTarget(null)}>
        {(customerPOs ?? []).length === 0 ? (
          <EmptyState description="ลูกค้ารายนี้ยังไม่มี PO ในระบบ" />
        ) : (
          <ul>
            {(customerPOs ?? []).map((po: any) => (
              <li key={po.id}>
                {po.poNumber} - {po.status}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </Card>
  );
}
