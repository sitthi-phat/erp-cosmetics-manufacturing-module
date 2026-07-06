import { useMemo, useState } from "react";
import { Card, DataTable, StatusTag, Button, Modal, Form, SelectField, NumberField, TextField, SubmitButton, Notify, EmptyState, normalizeSelectValues } from "../ui";
import { useStock, useReceiveStock, StockRow } from "../hooks/useStock";
import { useAuth } from "../lib/authContext";
import { ApiError } from "../lib/apiClient";

const LOW_STOCK_THRESHOLD = 100;

export function StockPage() {
  const { data: rows, isLoading, isError, dataUpdatedAt } = useStock();
  const { hasPermission } = useAuth();
  const receiveStock = useReceiveStock();
  const [q, setQ] = useState("");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  async function handleReceive(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    try {
      await receiveStock.mutateAsync({
        materialId: Number(values.materialId),
        lotNumber: String(values.lotNumber),
        quantity: Number(values.quantity),
        supplierName: values.supplierName ? String(values.supplierName) : undefined
      });
      Notify.success("บันทึกรับวัตถุดิบเข้าคลังสำเร็จ");
      setReceiptModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  // ECP-007 AC4/AC5 (root cause fix, feedback item 2 - "ไม่มีช่องค้นหาเลย"): client-side filter
  // by material name/id, case-insensitive - prototype scale (a few dozen materials) makes a
  // server round-trip unnecessary, matches the AC's own <=2s expectation trivially.
  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows ?? [];
    return (rows ?? []).filter(
      (r) => r.materialName.toLowerCase().includes(term) || String(r.materialId).includes(term)
    );
  }, [rows, q]);

  return (
    <Card title="สต็อกวัตถุดิบ (real-time)" testId="stock-page-card">
      {isError && (
        <p style={{ color: "red" }}>
          ไม่สามารถโหลดข้อมูล stock ได้ในขณะนี้ กรุณาลองใหม่ (ข้อมูลล่าสุดที่เคยอัปเดตสำเร็จ:{" "}
          {new Date(dataUpdatedAt).toLocaleString("th-TH")})
        </p>
      )}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="ค้นหาชื่อ/รหัสวัตถุดิบ..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="stock-search-input"
          style={{ padding: 6, width: 280 }}
        />
        {q && (
          <Button onClick={() => setQ("")} testId="stock-search-clear">
            ล้างการค้นหา
          </Button>
        )}
        {hasPermission("stock", "goods_receipt") && (
          <Button variant="primary" onClick={() => setReceiptModalOpen(true)} testId="open-goods-receipt">
            + รับวัตถุดิบเข้าคลัง
          </Button>
        )}
      </div>
      {q && filteredRows.length === 0 ? (
        <EmptyState description="ไม่พบวัตถุดิบที่ตรงกับคำค้นหา" testId="stock-search-empty" />
      ) : (
        <DataTable<StockRow>
          loading={isLoading}
          rows={filteredRows}
          rowKey={(r) => r.materialId}
          getRowTestId={(r) => `stock-row-${r.materialName}`}
          columns={[
            {
              key: "materialName",
              title: "วัตถุดิบ",
              render: (r) => (
                <>
                  {r.materialName}
                  {r.physicalQty > 0 && r.physicalQty < LOW_STOCK_THRESHOLD && (
                    <span data-testid="low-stock-material-row" style={{ display: "none" }} />
                  )}
                </>
              )
            },
            { key: "uom", title: "หน่วย", dataIndex: "uom" },
            {
              key: "physicalQty",
              title: "ยอดจริง (physical)",
              render: (r) => <span data-testid="stock-physical">{r.physicalQty}</span>
            },
            { key: "reservedQty", title: "ยอดจอง (reserved)", dataIndex: "reservedQty" },
            { key: "availableQty", title: "ยอดพร้อมใช้ (available)", dataIndex: "availableQty" },
            {
              key: "status",
              title: "สถานะ",
              render: (r) =>
                r.outOfStock ? (
                  <StatusTag status="Cancelled" label="หมดสต็อก" testId="status-badge" />
                ) : (
                  <StatusTag status="Active" label="ปกติ" testId="status-badge" />
                )
            }
          ]}
        />
      )}

      <Modal
        open={receiptModalOpen}
        title="รับวัตถุดิบเข้าคลัง (Goods Receipt)"
        onCancel={() => setReceiptModalOpen(false)}
        testId="goods-receipt-modal"
      >
        <Form onSubmit={handleReceive}>
          <SelectField
            name="materialId"
            label="วัตถุดิบ"
            required
            testId="receipt-material-select"
            options={(rows ?? []).map((r) => ({ value: r.materialId, label: r.materialName }))}
          />
          <TextField name="lotNumber" label="เลข Lot" required testId="receipt-lot-number" />
          <NumberField name="quantity" label="จำนวนที่รับเข้า" required min={0.001} testId="receipt-quantity" />
          <TextField
            name="supplierName"
            label="ผู้จำหน่าย (สำหรับ QC ตรวจสอบขาเข้า)"
            testId="receipt-supplier-name"
          />
          <SubmitButton loading={receiveStock.isPending} testId="receipt-submit">
            บันทึกรับเข้า
          </SubmitButton>
        </Form>
      </Modal>
    </Card>
  );
}
