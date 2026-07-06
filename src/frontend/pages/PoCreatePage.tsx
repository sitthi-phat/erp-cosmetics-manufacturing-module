import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, SelectField, NumberField, DateField, SubmitButton, Button, Notify } from "../ui";
import { useCreatePO, useBomCheck } from "../hooks/usePo";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import { ApiError } from "../lib/apiClient";

export function PoCreatePage() {
  const navigate = useNavigate();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const createPO = useCreatePO();
  const bomCheck = useBomCheck();
  const [lines, setLines] = useState<Array<{ productId: number; quantity: number; unitPrice: number; uom: string }>>([]);

  function addLine(values: Record<string, unknown>) {
    setLines((prev) => [
      ...prev,
      {
        productId: Number(values.productId),
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice),
        uom: "unit"
      }
    ]);
  }

  async function checkStock() {
    if (lines.length === 0) {
      Notify.error("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการก่อนยืนยัน");
      return;
    }
    for (const line of lines) {
      try {
        const result = await bomCheck.mutateAsync({ productId: line.productId, orderQty: line.quantity });
        if (result.sufficient) {
          Notify.success("stock เพียงพอ");
        } else {
          const first = result.shortages[0];
          Notify.error(`วัตถุดิบ ${first.materialName} ไม่เพียงพอ ขาดอยู่ ${first.shortQty} หน่วย`);
        }
      } catch (err) {
        if (err instanceof ApiError) Notify.error(err.message);
      }
    }
  }

  async function handleSubmit(values: Record<string, unknown>) {
    if (lines.length === 0) {
      Notify.error("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการก่อนยืนยัน");
      return;
    }
    try {
      const result = await createPO.mutateAsync({
        customerId: Number(values.customerId),
        requestedDeliveryDate: String(values.requestedDeliveryDate),
        lines
      });
      Notify.success("สร้าง PO สำเร็จ (สถานะ Draft)");
      navigate(`/pos/${(result as any).data.id}`);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <Card title="สร้างคำสั่งซื้อ (PO) ใหม่" testId="po-create-card">
      <Form onSubmit={handleSubmit}>
        {/* QA DEF-03 note: demoFlow.spec.ts assumes an autocomplete (`po-customer-search` +
            `po-customer-result-0`); this is a plain searchable <Select> dropdown instead (still
            type-to-filter via antd's built-in search) - same testid on the select control so a
            selector update on QA's side (fill+click vs select) should be enough to reconcile. */}
        <SelectField
          name="customerId"
          label="ลูกค้า"
          required
          testId="po-customer-search"
          options={(customers ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.customerId})` }))}
        />
        <DateField name="requestedDeliveryDate" label="วันที่ต้องการส่งมอบ" required />
        <SubmitButton loading={createPO.isPending} testId="po-create-submit">
          สร้าง PO
        </SubmitButton>
      </Form>

      <Card title="เพิ่มรายการสินค้า">
        <Form onSubmit={addLine}>
          <SelectField
            name="productId"
            label="สินค้า"
            required
            testId="po-line-product-0"
            options={(products ?? []).map((p) => ({ value: p.id, label: `${p.name}${p.hasBom ? "" : " (ยังไม่มีสูตร)"}` }))}
          />
          <NumberField name="quantity" label="จำนวน" required min={0.001} testId="po-line-qty-0" />
          <NumberField name="unitPrice" label="ราคาต่อหน่วย" required min={0} />
          <SubmitButton testId="po-add-line">+ เพิ่มรายการ</SubmitButton>
        </Form>
        <ul>
          {lines.map((l, i) => (
            <li key={i}>
              product #{l.productId} x {l.quantity} @ {l.unitPrice}
            </li>
          ))}
        </ul>
        <Button onClick={checkStock}>ตรวจสอบ stock ก่อนยืนยัน</Button>
      </Card>
    </Card>
  );
}
