import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, SelectField, NumberField, DateField, SubmitButton, Button, Notify, normalizeSelectValues } from "../ui";
import { useCreatePO, useBomCheck } from "../hooks/usePo";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import { ApiError } from "../lib/apiClient";

interface DraftLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  uom: string;
}

export function PoCreatePage() {
  const navigate = useNavigate();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const createPO = useCreatePO();
  const bomCheck = useBomCheck();
  const [lines, setLines] = useState<DraftLine[]>([]);

  // ECP-004 AC1 (root cause fix, feedback item 1): keep the product NAME alongside its id when a
  // line is added, so the table can render "ชื่อสินค้า / จำนวน / ราคา / ยอดรวม" instead of the raw
  // `Product #<id> x <qty> @ <price>` string pond reported as unreadable.
  function addLine(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    const productId = Number(values.productId);
    const product = (products ?? []).find((p) => p.id === productId);
    setLines((prev) => [
      ...prev,
      {
        productId,
        productName: product?.name ?? `สินค้า #${productId}`,
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice),
        uom: "unit"
      }
    ]);
  }

  // ECP-004 AC2: remove a line from this NOT-YET-SUBMITTED draft before "สร้าง PO" is clicked -
  // purely local state, no API call needed since the PO doesn't exist yet at this point.
  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
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

  async function handleSubmit(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    if (lines.length === 0) {
      Notify.error("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการก่อนยืนยัน");
      return;
    }
    try {
      const result = await createPO.mutateAsync({
        customerId: Number(values.customerId),
        requestedDeliveryDate: String(values.requestedDeliveryDate),
        // Only send the fields the API actually expects - `productName` is FE-only display state.
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice, uom: l.uom }))
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
        {/* ECP-004 AC1 (regression guard): render ชื่อสินค้า/จำนวน/ราคา/ยอดรวม - never a raw
            `Product #<id> x <qty> @ <price>` string or any internal id on screen. */}
        {lines.length > 0 && (
          <table style={{ width: "100%", marginBottom: 12 }} data-testid="po-draft-lines-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>ชื่อสินค้า</th>
                <th style={{ textAlign: "right" }}>จำนวน</th>
                <th style={{ textAlign: "right" }}>ราคาต่อหน่วย (บาท)</th>
                <th style={{ textAlign: "right" }}>ยอดรวมบรรทัด (บาท)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} data-testid={`po-draft-line-${i}`}>
                  <td data-testid={`po-draft-line-name-${i}`}>{l.productName}</td>
                  <td style={{ textAlign: "right" }}>{l.quantity}</td>
                  <td style={{ textAlign: "right" }}>{l.unitPrice.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{(l.quantity * l.unitPrice).toFixed(2)}</td>
                  <td>
                    <Button variant="danger" onClick={() => removeLine(i)} testId={`po-draft-line-remove-${i}`}>
                      ลบ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Button onClick={checkStock}>ตรวจสอบ stock ก่อนยืนยัน</Button>
      </Card>
    </Card>
  );
}
