import { useState } from "react";
import { Card, DataTable, Button, Modal, Form, SelectField, NumberField, SubmitButton, Notify, EmptyState, normalizeSelectValues } from "../ui";
import { useBoms, useBom, useCreateBom, useUpdateBom, useDeleteBomLine } from "../hooks/useBom";
import { useProducts, useMaterials } from "../hooks/useProducts";
import { ApiError } from "../lib/apiClient";

/**
 * ECP-039: BOM Management - create/view/edit/delete a product's recipe through a real screen
 * instead of only seed data (feedback item 2/6). In-place edit, no version history (AC2).
 */
export function BomManagementPage() {
  const { data: boms, isLoading } = useBoms();
  const { data: products } = useProducts();
  const { data: materials } = useMaterials();
  const createBom = useCreateBom();
  const updateBom = useUpdateBom();
  const deleteBomLine = useDeleteBomLine();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const { data: selectedBom } = useBom(selectedProductId);

  const productsWithoutBom = (products ?? []).filter((p) => !p.hasBom);

  async function handleCreate(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    try {
      await createBom.mutateAsync({
        productId: Number(values.productId),
        lines: [{ materialId: Number(values.materialId), qtyPerUnit: Number(values.qtyPerUnit) }]
      });
      Notify.success("สร้าง BOM สำเร็จ - สินค้านี้พร้อมตรวจสอบ stock แล้ว");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleAddLine(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    if (!selectedBom) return;
    const nextLines = [
      ...selectedBom.lines.map((l) => ({ id: l.id, materialId: l.materialId, qtyPerUnit: l.qtyPerUnit })),
      { materialId: Number(values.materialId), qtyPerUnit: Number(values.qtyPerUnit) }
    ];
    try {
      await updateBom.mutateAsync({ productId: selectedBom.productId, lines: nextLines });
      Notify.success("เพิ่มบรรทัดสูตรสำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleUpdateQty(lineId: number, materialId: number, qtyPerUnit: number) {
    if (!selectedBom) return;
    const nextLines = selectedBom.lines.map((l) => (l.id === lineId ? { id: l.id, materialId, qtyPerUnit } : { id: l.id, materialId: l.materialId, qtyPerUnit: l.qtyPerUnit }));
    try {
      await updateBom.mutateAsync({ productId: selectedBom.productId, lines: nextLines });
      Notify.success("แก้ไขปริมาณสำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleDeleteLine(lineId: number) {
    if (!selectedBom) return;
    // ECP-039 AC3: confirm before removing a recipe line.
    if (!window.confirm("ยืนยันการลบวัตถุดิบนี้ออกจากสูตร?")) return;
    try {
      await deleteBomLine.mutateAsync({ productId: selectedBom.productId, lineId });
      Notify.success("ลบบรรทัดสูตรสำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <div>
      <Card title="จัดการ BOM (สูตรการผลิต)" testId="bom-management-card">
        <DataTable
          loading={isLoading}
          rows={boms ?? []}
          rowKey={(b: any) => b.id}
          emptyText="ยังไม่มี BOM ในระบบ"
          getRowTestId={(b: any) => `bom-row-${b.productId}`}
          columns={[
            { key: "productName", title: "สินค้า", dataIndex: "productName" },
            { key: "lineCount", title: "จำนวนวัตถุดิบในสูตร", render: (b: any) => b.lines.length },
            {
              key: "actions",
              title: "",
              render: (b: any) => (
                <Button onClick={() => setSelectedProductId(b.productId)} testId={`bom-edit-${b.productId}`}>
                  ดู/แก้ไข
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Card title="สร้าง BOM ใหม่ (สำหรับสินค้าที่ยังไม่มีสูตร)" testId="bom-create-card">
        {productsWithoutBom.length === 0 ? (
          <EmptyState description="ทุกสินค้ามี BOM ครบแล้ว" />
        ) : (
          <Form onSubmit={handleCreate}>
            <SelectField
              name="productId"
              label="สินค้า"
              required
              testId="bom-create-product"
              options={productsWithoutBom.map((p) => ({ value: p.id, label: p.name }))}
            />
            <SelectField
              name="materialId"
              label="วัตถุดิบ"
              required
              testId="bom-create-material"
              options={(materials ?? []).map((m: any) => ({ value: m.id, label: m.name }))}
            />
            <NumberField name="qtyPerUnit" label="ปริมาณต่อหน่วย" required min={0.0001} testId="bom-create-qty" />
            <SubmitButton loading={createBom.isPending} testId="bom-create-submit">
              สร้าง BOM
            </SubmitButton>
          </Form>
        )}
      </Card>

      <Modal
        open={selectedProductId !== null}
        title={`แก้ไข BOM: ${selectedBom?.productName ?? ""}`}
        onCancel={() => setSelectedProductId(null)}
        testId="bom-edit-modal"
      >
        {selectedBom && (
          <>
            <table style={{ width: "100%", marginBottom: 12 }} data-testid="bom-lines-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>วัตถุดิบ</th>
                  <th style={{ textAlign: "right" }}>ปริมาณต่อหน่วย</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {selectedBom.lines.map((l) => (
                  <tr key={l.id} data-testid={`bom-line-${l.id}`}>
                    <td>{l.materialName}</td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        type="number"
                        step="0.0001"
                        defaultValue={l.qtyPerUnit}
                        data-testid={`bom-line-qty-${l.id}`}
                        style={{ width: 100, textAlign: "right" }}
                        onBlur={(e) => {
                          const next = Number(e.target.value);
                          if (next > 0 && next !== l.qtyPerUnit) handleUpdateQty(l.id, l.materialId, next);
                        }}
                      />
                    </td>
                    <td>
                      <Button variant="danger" onClick={() => handleDeleteLine(l.id)} testId={`bom-line-delete-${l.id}`}>
                        ลบ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Form onSubmit={handleAddLine}>
              <SelectField
                name="materialId"
                label="เพิ่มวัตถุดิบ"
                required
                testId="bom-add-material"
                options={(materials ?? []).map((m: any) => ({ value: m.id, label: m.name }))}
              />
              <NumberField name="qtyPerUnit" label="ปริมาณต่อหน่วย" required min={0.0001} testId="bom-add-qty" />
              <SubmitButton loading={updateBom.isPending} testId="bom-add-line-submit">
                + เพิ่มวัตถุดิบเข้าสูตร
              </SubmitButton>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}
