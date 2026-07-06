import { useMemo, useState } from "react";
import { Card, DataTable, Button, Modal, Form, SelectField, NumberField, SubmitButton, Notify, EmptyState, normalizeSelectValues } from "../ui";
import {
  useProductionQueue,
  useAssignedProductionOrders,
  useAssignProduction,
  useProduceBatch,
  useMaterialPlan
} from "../hooks/useProduction";
import { useBasicUsers } from "../hooks/useAdmin";
import { ApiError } from "../lib/apiClient";

export function ProductionPage() {
  const { data: queue, isLoading } = useProductionQueue();
  const { data: assignedOrders, isLoading: assignedLoading } = useAssignedProductionOrders();
  const { data: users } = useBasicUsers();
  const assign = useAssignProduction();
  const produce = useProduceBatch();

  const [assignTarget, setAssignTarget] = useState<number | null>(null);
  const [produceTarget, setProduceTarget] = useState<number | null>(null);
  const [lotSelections, setLotSelections] = useState<Array<{ materialId: number; lotId: number; qtyUsed: number }>>([]);
  const [lastBatchNumber, setLastBatchNumber] = useState<string | null>(null);

  // ECP-013 AC1/AC2/AC3 - root cause fix (defect D): the system computes required material qty
  // from the BOM + proposes a real, usable Lot (by lot NUMBER) instead of Production having to
  // search/type an internal Lot database id with zero guidance (which is exactly what produced
  // the "L-SEED-1 not found" error pond reported - that id never even existed).
  const { data: plan, isLoading: planLoading, isError: planError } = useMaterialPlan(produceTarget);

  const allProposedLotOptions = useMemo(
    () =>
      (plan ?? []).flatMap((line) =>
        line.proposedLots.map((l) => ({
          value: l.lotId,
          label: `${l.lotNumber} (${line.materialName}, เสนอ ${l.allocQty})`,
          materialId: line.materialId
        }))
      ),
    [plan]
  );

  async function handleAssign(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    if (assignTarget === null) return;
    try {
      await assign.mutateAsync({ poLineId: assignTarget, assignedTo: Number(values.assignedTo) });
      Notify.success("มอบหมายงานผลิตสำเร็จ");
      setAssignTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  /** ECP-013 AC2: accept the WHOLE system-proposed FIFO plan in one click, without editing. */
  function acceptProposedPlan() {
    if (!plan) return;
    const selections = plan.flatMap((line) =>
      line.proposedLots.map((l) => ({ materialId: line.materialId, lotId: l.lotId, qtyUsed: l.allocQty }))
    );
    setLotSelections(selections);
    Notify.success("ใช้แผน Lot ที่ระบบเสนอแล้ว - ตรวจสอบรายการด้านล่างก่อนบันทึกผลิต");
  }

  /** ECP-013 AC3: adjust/supplement the proposal by picking an ADDITIONAL lot (by lot number,
   * never a typed internal id) and a quantity, e.g. when the proposed lot alone isn't enough. */
  function addLotSelection(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    const lotId = Number(values.lotId);
    const option = allProposedLotOptions.find((o) => o.value === lotId);
    if (!option) {
      Notify.error("กรุณาเลือก Lot จากรายการที่ระบบเสนอ");
      return;
    }
    setLotSelections((prev) => [...prev, { materialId: option.materialId, lotId, qtyUsed: Number(values.qtyUsed) }]);
  }

  function removeLotSelection(index: number) {
    setLotSelections((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleProduce(values: Record<string, unknown>) {
    if (produceTarget === null) return;
    if (lotSelections.length === 0) {
      Notify.error("กรุณาระบุ Lot วัตถุดิบที่ใช้ในการผลิตอย่างน้อย 1 Lot ต่อวัตถุดิบแต่ละชนิดตามสูตร");
      return;
    }
    try {
      const result: any = await produce.mutateAsync({
        productionOrderId: produceTarget,
        producedQty: Number(values.producedQty),
        lotSelections
      });
      Notify.success("บันทึกผลิตสำเร็จ - สร้าง Batch แล้ว");
      setLastBatchNumber(result?.data?.batchNumber ?? null);
      setProduceTarget(null);
      setLotSelections([]);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  function lotName(lotId: number) {
    return allProposedLotOptions.find((o) => o.value === lotId)?.label ?? `Lot #${lotId}`;
  }

  return (
    <div>
      {lastBatchNumber && (
        <p>
          สร้าง Batch สำเร็จ: <strong data-testid="batch-number">{lastBatchNumber}</strong>
        </p>
      )}
      <Card title="คิวงานผลิตที่รอ assign (PO Confirmed, เรียงตามวันที่ต้องการส่งมอบ)">
        <DataTable
          loading={isLoading}
          rows={queue ?? []}
          rowKey={(p: any) => p.id}
          emptyText="ไม่มีงานผลิตที่รอดำเนินการในขณะนี้"
          getRowTestId={(p: any) => `queue-row-${p.poNumber}`}
          columns={[
            { key: "poNumber", title: "เลขที่ PO", dataIndex: "poNumber" },
            { key: "customer", title: "ลูกค้า", render: (p: any) => p.customer?.name },
            {
              key: "requestedDeliveryDate",
              title: "วันที่ต้องการส่งมอบ",
              render: (p: any) => new Date(p.requestedDeliveryDate).toLocaleDateString("th-TH")
            },
            {
              key: "actions",
              title: "",
              render: (p: any) => (
                <Button onClick={() => setAssignTarget(p.lines?.[0]?.id)} testId="assign-button">
                  มอบหมายงาน
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Card title="งานที่ assign แล้ว รอบันทึกผลิต (Batch)">
        <DataTable
          loading={assignedLoading}
          rows={assignedOrders ?? []}
          rowKey={(o: any) => o.id}
          emptyText="ยังไม่มีงานที่ assign ให้ผลิต"
          getRowTestId={(o: any) => `assigned-row-${o.id}`}
          columns={[
            { key: "poNumber", title: "เลขที่ PO", render: (o: any) => o.po?.poNumber },
            { key: "product", title: "สินค้า", render: (o: any) => o.poLine?.product?.name },
            { key: "assignee", title: "ผู้รับผิดชอบ", render: (o: any) => o.assignee?.fullName },
            {
              key: "actions",
              title: "",
              render: (o: any) => (
                <Button onClick={() => setProduceTarget(o.id)} testId="produce-button">
                  บันทึกผลิต
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Modal open={assignTarget !== null} title="มอบหมายงานผลิต" onCancel={() => setAssignTarget(null)}>
        <Form onSubmit={handleAssign}>
          <SelectField
            name="assignedTo"
            label="ผู้ปฏิบัติงาน"
            required
            testId="assign-worker-select"
            options={(users ?? []).map((u: any) => ({ value: u.id, label: u.fullName }))}
          />
          <SubmitButton loading={assign.isPending} testId="assign-confirm">
            มอบหมาย
          </SubmitButton>
        </Form>
      </Modal>

      <Modal
        open={produceTarget !== null}
        title="บันทึกผลการผลิต (สร้าง Batch)"
        onCancel={() => {
          setProduceTarget(null);
          setLotSelections([]);
        }}
        testId="produce-modal"
      >
        <Card title="แผนวัตถุดิบที่ต้องใช้ (คำนวณจาก BOM อัตโนมัติ)" testId="material-plan-card">
          {planLoading && <p>กำลังคำนวณแผนวัตถุดิบ...</p>}
          {planError && <EmptyState description="สินค้านี้ยังไม่มีสูตรการผลิต (BOM) ในระบบ กรุณาติดต่อผู้ดูแลระบบ" />}
          {plan && plan.length > 0 && (
            <>
              <table style={{ width: "100%", marginBottom: 12 }} data-testid="material-plan-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>วัตถุดิบ</th>
                    <th style={{ textAlign: "right" }}>ต้องใช้</th>
                    <th style={{ textAlign: "left" }}>Lot ที่เสนอ (FIFO)</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((line) => (
                    <tr key={line.materialId} data-testid={`material-plan-row-${line.materialId}`}>
                      <td>{line.materialName}</td>
                      <td style={{ textAlign: "right" }}>{line.requiredQty}</td>
                      <td>
                        {line.proposedLots.length === 0
                          ? "ไม่มี Lot ที่พร้อมใช้"
                          : line.proposedLots.map((l) => `${l.lotNumber} (${l.allocQty})`).join(", ")}
                        {line.shortfall > 0 && (
                          <span style={{ color: "#cf1322" }}> - ขาดอีก {line.shortfall}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button variant="primary" onClick={acceptProposedPlan} testId="accept-material-plan">
                ยืนยันใช้ Lot ที่เสนอ
              </Button>
            </>
          )}
        </Card>

        <Card title="ปรับ/เพิ่ม Lot ที่ใช้ (review ก่อนบันทึก)">
          <Form onSubmit={addLotSelection}>
            <SelectField
              name="lotId"
              label="เลือก Lot (จากรายการที่ระบบเสนอ)"
              required
              testId="produce-lot-select-0"
              options={allProposedLotOptions}
            />
            <NumberField name="qtyUsed" label="จำนวนที่ใช้" required min={0.001} testId="produce-lot-qty-0" />
            <SubmitButton>+ เพิ่ม Lot</SubmitButton>
          </Form>
          <ul data-testid="lot-selection-list">
            {lotSelections.map((l, i) => (
              <li key={i}>
                {lotName(l.lotId)} x {l.qtyUsed}{" "}
                <a
                  data-testid={`remove-lot-selection-${i}`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    removeLotSelection(i);
                  }}
                >
                  ลบ
                </a>
              </li>
            ))}
          </ul>
        </Card>
        <Form onSubmit={handleProduce}>
          <NumberField name="producedQty" label="จำนวนสินค้าสำเร็จรูปที่ได้" required min={0.001} testId="produce-output-qty" />
          <SubmitButton loading={produce.isPending} testId="produce-submit">
            บันทึกผลิตเสร็จสิ้น
          </SubmitButton>
        </Form>
      </Modal>
    </div>
  );
}
