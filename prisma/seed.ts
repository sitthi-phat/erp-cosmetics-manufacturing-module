import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nextNumberInTx } from "../src/backend/lib/numberSequence";

const prisma = new PrismaClient();

// Demo credential only. Username/password below intentionally match QA's
// tests/helpers/fixtures.ts (SEED_USERS/DEFAULT_PASSWORD) reconciled during QA verify phase
// (defects.md DEF-02) so integration/e2e specs can log in against the real seeded users.
const SEED_PASSWORD = "Password123!";

/**
 * Seed strategy (architecture.md §8). Fully idempotent: every run wipes and recreates the
 * demo dataset in FK-safe order, so `npm run db:seed` can be re-run any time during the
 * user-journey exploration phase without leaving stale/duplicated rows behind.
 */
async function reset(): Promise<void> {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceLine.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.qCInspection.deleteMany(),
    prisma.batchLotUsage.deleteMany(),
    prisma.batch.deleteMany(),
    prisma.productionOrder.deleteMany(),
    prisma.pOStatusEvent.deleteMany(),
    prisma.pOLine.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.stockTransaction.deleteMany(),
    prisma.stockBalance.deleteMany(),
    prisma.lot.deleteMany(),
    prisma.bOMLine.deleteMany(),
    prisma.bOM.deleteMany(),
    prisma.rawMaterial.deleteMany(),
    prisma.product.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.vATConfig.deleteMany(),
    prisma.user.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.role.deleteMany(),
    prisma.numberSequence.deleteMany()
  ]);
}

const ROLE_DEFS = [
  { code: "SA", name: "Sales/CS" },
  { code: "WH", name: "Warehouse" },
  { code: "PR", name: "Production" },
  { code: "QA", name: "QA/QC" },
  { code: "LO", name: "Logistics" },
  { code: "FI", name: "Finance" },
  { code: "AD", name: "Admin" }
] as const;

// Permission matrix (architecture.md §7). AD gets every tuple below implicitly (added separately).
const MATRIX: Array<{ role: string; resource: string; action: string }> = [
  { role: "SA", resource: "customer", action: "view" },
  { role: "SA", resource: "customer", action: "create" },
  { role: "SA", resource: "customer", action: "update" },
  { role: "SA", resource: "po", action: "view" },
  { role: "SA", resource: "po", action: "create" },
  { role: "SA", resource: "po", action: "confirm" },
  { role: "SA", resource: "po", action: "cancel" },
  { role: "SA", resource: "stock", action: "view" },
  { role: "SA", resource: "stock", action: "check_bom" },
  { role: "SA", resource: "shipping", action: "view" },
  { role: "SA", resource: "invoice", action: "view" },
  { role: "SA", resource: "dashboard", action: "sales" },

  { role: "WH", resource: "stock", action: "view" },
  { role: "WH", resource: "stock", action: "check_bom" },
  { role: "WH", resource: "stock", action: "goods_receipt" },
  { role: "WH", resource: "stock", action: "adjust" },
  { role: "WH", resource: "stock", action: "view_reconciliation" },
  { role: "WH", resource: "traceability", action: "view" },
  { role: "WH", resource: "dashboard", action: "warehouse" },

  { role: "PR", resource: "po", action: "view" },
  { role: "PR", resource: "stock", action: "view" },
  { role: "PR", resource: "stock", action: "check_bom" },
  { role: "PR", resource: "traceability", action: "view" },
  { role: "PR", resource: "production", action: "view_queue" },
  { role: "PR", resource: "production", action: "assign" },
  { role: "PR", resource: "production", action: "produce" },
  { role: "PR", resource: "qc", action: "view_batches" },
  { role: "PR", resource: "dashboard", action: "production" },

  { role: "QA", resource: "traceability", action: "view" },
  { role: "QA", resource: "qc", action: "inspect_batch" },
  { role: "QA", resource: "qc", action: "inspect_incoming_lot" },
  { role: "QA", resource: "qc", action: "view_batches" },
  { role: "QA", resource: "dashboard", action: "qc" },

  { role: "LO", resource: "shipping", action: "view" },
  { role: "LO", resource: "shipping", action: "create" },
  { role: "LO", resource: "shipping", action: "update_status" },
  { role: "LO", resource: "dashboard", action: "logistics" },

  { role: "FI", resource: "po", action: "view" },
  { role: "FI", resource: "invoice", action: "view" },
  { role: "FI", resource: "invoice", action: "create" },
  { role: "FI", resource: "invoice", action: "revise" },
  { role: "FI", resource: "invoice", action: "record_payment" },
  { role: "FI", resource: "dashboard", action: "finance" }
];

const AD_EXTRA: Array<{ resource: string; action: string }> = [
  { resource: "customer", action: "view" },
  { resource: "customer", action: "create" },
  { resource: "customer", action: "update" },
  { resource: "po", action: "view" },
  { resource: "po", action: "create" },
  { resource: "po", action: "confirm" },
  { resource: "po", action: "cancel" },
  { resource: "stock", action: "view" },
  { resource: "stock", action: "check_bom" },
  { resource: "stock", action: "goods_receipt" },
  { resource: "stock", action: "adjust" },
  { resource: "stock", action: "view_reconciliation" },
  { resource: "traceability", action: "view" },
  { resource: "production", action: "view_queue" },
  { resource: "production", action: "assign" },
  { resource: "production", action: "produce" },
  { resource: "qc", action: "inspect_batch" },
  { resource: "qc", action: "inspect_incoming_lot" },
  { resource: "qc", action: "view_batches" },
  { resource: "shipping", action: "view" },
  { resource: "shipping", action: "create" },
  { resource: "shipping", action: "update_status" },
  { resource: "invoice", action: "view" },
  { resource: "invoice", action: "create" },
  { resource: "invoice", action: "revise" },
  { resource: "invoice", action: "record_payment" },
  { resource: "user_management", action: "view_users" },
  { resource: "user_management", action: "manage_users" },
  { resource: "user_management", action: "manage_permission" },
  { resource: "admin", action: "manage_vat_config" },
  { resource: "audit", action: "view" },
  { resource: "dashboard", action: "sales" },
  { resource: "dashboard", action: "warehouse" },
  { resource: "dashboard", action: "production" },
  { resource: "dashboard", action: "qc" },
  { resource: "dashboard", action: "logistics" },
  { resource: "dashboard", action: "finance" },
  { resource: "dashboard", action: "admin" }
];

async function main(): Promise<void> {
  console.log("[seed] resetting demo dataset...");
  await reset();

  console.log("[seed] roles + permission matrix...");
  const roleByCode = new Map<string, { id: number }>();
  for (const def of ROLE_DEFS) {
    const role = await prisma.role.create({ data: { roleName: def.code, isSystem: def.code === "AD" } });
    roleByCode.set(def.code, role);
  }
  for (const tuple of MATRIX) {
    await prisma.permission.create({
      data: { roleId: roleByCode.get(tuple.role)!.id, resource: tuple.resource, action: tuple.action, allow: true }
    });
  }
  for (const tuple of AD_EXTRA) {
    await prisma.permission.create({
      data: { roleId: roleByCode.get("AD")!.id, resource: tuple.resource, action: tuple.action, allow: true }
    });
  }

  console.log("[seed] users (1 per role)...");
  // Usernames match tests/helpers/fixtures.ts#SEED_USERS exactly (QA verify reconciliation, DEF-02).
  const USERNAME_BY_CODE: Record<string, string> = {
    SA: "sales_demo",
    WH: "warehouse_demo",
    PR: "production_demo",
    QA: "qc_demo",
    LO: "logistics_demo",
    FI: "finance_demo",
    AD: "admin"
  };
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const userByCode = new Map<string, { id: number }>();
  for (const def of ROLE_DEFS) {
    const userId = await prisma.$transaction((tx) => nextNumberInTx(tx, "USER"));
    const user = await prisma.user.create({
      data: {
        userId,
        username: USERNAME_BY_CODE[def.code],
        fullName: `${def.name} Demo`,
        passwordHash,
        roleId: roleByCode.get(def.code)!.id,
        status: "Active"
      }
    });
    userByCode.set(def.code, user);
  }
  const adminUser = userByCode.get("AD")!;
  const financeUser = userByCode.get("FI")!;
  const qcUser = userByCode.get("QA")!;

  console.log("[seed] VATConfig (7.00%)...");
  await prisma.vATConfig.create({ data: { rate: 7.0, updatedById: adminUser.id } });

  console.log("[seed] customers...");
  const customerNames = [
    "บริษัท ABC จำกัด",
    "บริษัท Beauty Plus จำกัด",
    "ร้านค้าปลีก สยามคอสเมติกส์",
    "บริษัท Glow Cosmetics จำกัด",
    "บริษัท Fresh Skin Trading จำกัด"
  ];
  const customers = [];
  for (const name of customerNames) {
    const customerId = await prisma.$transaction((tx) => nextNumberInTx(tx, "CUSTOMER"));
    const customer = await prisma.customer.create({
      data: { customerId, name, address: "123 ถนนสุขุมวิท กรุงเทพฯ", phone: "0812345678", email: `contact@${name.length}.example.com`, status: "Active" }
    });
    customers.push(customer);
  }

  console.log("[seed] raw materials + stock...");
  const materialDefs = [
    { name: "น้ำมันมะพร้าว", uom: "kg" },
    { name: "แอลกอฮอล์", uom: "liter" },
    { name: "น้ำหอม", uom: "kg" },
    { name: "สารกันเสีย", uom: "kg" },
    { name: "ไขผึ้ง", uom: "kg" },
    { name: "กลีเซอรีน", uom: "liter" },
    { name: "วิตามินอี", uom: "kg" },
    { name: "สี", uom: "kg" },
    { name: "บรรจุภัณฑ์ขวด", uom: "pcs" },
    { name: "บรรจุภัณฑ์กล่อง", uom: "pcs" }
  ];
  const materials = [];
  for (const def of materialDefs) {
    const material = await prisma.rawMaterial.create({ data: { name: def.name, uom: def.uom, status: "Active" } });
    materials.push(material);
  }

  // Goods receipt for every material - happy flow amounts, except 1 low-stock and 1 zero-stock (ECP-004/007/028).
  for (let i = 0; i < materials.length; i += 1) {
    const material = materials[i];
    let qty = 1000;
    if (i === materials.length - 1) qty = 0; // last material: zero stock (ECP-007 AC2)
    else if (i === materials.length - 2) qty = 50; // second-to-last: low stock (ECP-004 AC2/ECP-028)

    if (qty > 0) {
      await prisma.lot.create({
        data: {
          materialId: material.id,
          lotNumber: `L-SEED-${material.id}`,
          receivedQty: qty,
          remainingQty: qty,
          receivedDate: new Date(),
          incomingQcStatus: "Passed"
        }
      });
      await prisma.stockBalance.create({ data: { materialId: material.id, physicalQty: qty, reservedQty: 0 } });
      await prisma.stockTransaction.create({
        data: { materialId: material.id, type: "Receipt", qty, refDocType: "Seed", refDocId: material.id }
      });
    } else {
      await prisma.stockBalance.create({ data: { materialId: material.id, physicalQty: 0, reservedQty: 0 } });
    }
  }

  console.log("[seed] products + BOM (1 product intentionally has no BOM - ECP-009 AC3)...");
  const productDefs = [
    { name: "ครีมบำรุงผิวหน้า 50ml", uom: "bottle" },
    { name: "เซรั่มวิตามินซี 30ml", uom: "bottle" },
    { name: "โลชั่นบำรุงผิวกาย 200ml", uom: "bottle" },
    { name: "สบู่เหลวอาบน้ำ 250ml", uom: "bottle" },
    { name: "ลิปมันบำรุงริมฝีปาก", uom: "pcs" } // intentionally no BOM
  ];
  const products = [];
  for (const def of productDefs) {
    const product = await prisma.product.create({ data: { name: def.name, uom: def.uom, status: "Active" } });
    products.push(product);
  }
  for (let i = 0; i < products.length - 1; i += 1) {
    const bom = await prisma.bOM.create({ data: { productId: products[i].id, status: "Active" } });
    // every product uses the first 3 materials in different ratios to exercise multi-line PO aggregation
    await prisma.bOMLine.createMany({
      data: [
        { bomId: bom.id, materialId: materials[0].id, qtyPerUnit: 0.05 },
        { bomId: bom.id, materialId: materials[1].id, qtyPerUnit: 0.02 },
        { bomId: bom.id, materialId: materials[2].id, qtyPerUnit: 0.01 }
      ]
    });
  }

  console.log("[seed] happy-path flow: PO -> Production -> QC -> Shipment -> Invoice v1 -> Payment...");
  const poNumber = await prisma.$transaction((tx) => nextNumberInTx(tx, "PO"));
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      customerId: customers[0].id,
      requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "Confirmed",
      lines: {
        create: [{ productId: products[0].id, quantity: 100, uom: "bottle", unitPrice: 250 }]
      }
    }
  });
  await prisma.stockBalance.update({ where: { materialId: materials[0].id }, data: { reservedQty: { increment: 5 } } });
  await prisma.stockTransaction.create({
    data: { materialId: materials[0].id, type: "Reservation", qty: 5, refDocType: "PurchaseOrder", refDocId: po.id }
  });
  await prisma.pOStatusEvent.createMany({
    data: [
      { poId: po.id, status: "Draft" },
      { poId: po.id, status: "Confirmed" }
    ]
  });

  const productionOrder = await prisma.productionOrder.create({
    data: {
      poLineId: (await prisma.pOLine.findFirstOrThrow({ where: { poId: po.id } })).id,
      poId: po.id,
      assignedTo: userByCode.get("PR")!.id,
      status: "Completed",
      plannedQty: 100
    }
  });

  const batchNumber = await prisma.$transaction((tx) => nextNumberInTx(tx, "BATCH"));
  const seedLot = await prisma.lot.findFirstOrThrow({ where: { materialId: materials[0].id } });
  const batch = await prisma.batch.create({
    data: {
      batchNumber,
      productionOrderId: productionOrder.id,
      productId: products[0].id,
      producedQty: 100,
      status: "QCApproved"
    }
  });
  await prisma.batchLotUsage.create({
    data: { batchId: batch.id, lotId: seedLot.id, materialId: materials[0].id, qtyUsed: 5 }
  });
  await prisma.qCInspection.create({
    data: { batchId: batch.id, inspectorId: qcUser.id, result: "Approved", remarks: "ผ่านตามมาตรฐาน" }
  });

  const shipmentNumber = await prisma.$transaction((tx) => nextNumberInTx(tx, "SHIPMENT"));
  await prisma.shipment.create({
    data: {
      shipmentNumber,
      poId: po.id,
      batchId: batch.id,
      shippedDate: new Date(),
      status: "Shipped"
    }
  });
  await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: "Shipped" } });
  await prisma.pOStatusEvent.createMany({ data: [{ poId: po.id, status: "Shipped" }] });

  const invoiceNo = await prisma.$transaction((tx) => nextNumberInTx(tx, "INVOICE"));
  const subtotal = 100 * 250;
  const vatRate = 7.0;
  const vatAmount = Number((subtotal * (vatRate / 100)).toFixed(2));
  const totalAmount = Number((subtotal + vatAmount).toFixed(2));
  const invoiceV1 = await prisma.invoice.create({
    data: {
      invoiceNo,
      version: 1,
      parentInvoiceId: null,
      poId: po.id,
      issuedById: financeUser.id,
      subtotal,
      vatRateApplied: vatRate,
      vatAmount,
      totalAmount,
      status: "Issued",
      lines: {
        create: [
          { productId: products[0].id, description: productDefs[0].name, quantity: 100, unitPrice: 250, lineTotal: subtotal }
        ]
      }
    }
  });
  await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: "Invoiced" } });
  await prisma.pOStatusEvent.createMany({ data: [{ poId: po.id, status: "Invoiced" }] });
  await prisma.payment.create({
    data: {
      invoiceChainKey: invoiceNo,
      amount: 10000,
      paymentDate: new Date(),
      method: "bank_transfer",
      recordedById: financeUser.id
    }
  });
  await prisma.invoice.update({ where: { id: invoiceV1.id }, data: { status: "PartiallyPaid" } });

  console.log("[seed] demo invoice revision -> v2 with payment carry-over (ECP-037)...");
  await prisma.invoice.update({ where: { id: invoiceV1.id }, data: { status: "Superseded" } });
  const revisedSubtotal = 110 * 250;
  const revisedVat = Number((revisedSubtotal * (vatRate / 100)).toFixed(2));
  const revisedTotal = Number((revisedSubtotal + revisedVat).toFixed(2));
  await prisma.invoice.create({
    data: {
      invoiceNo,
      version: 2,
      parentInvoiceId: invoiceV1.id,
      poId: po.id,
      issuedById: financeUser.id,
      subtotal: revisedSubtotal,
      vatRateApplied: vatRate,
      vatAmount: revisedVat,
      totalAmount: revisedTotal,
      status: "PartiallyPaid", // 10,000 already paid < revisedTotal
      lines: {
        create: [
          { productId: products[0].id, description: `${productDefs[0].name} (revised qty)`, quantity: 110, unitPrice: 250, lineTotal: revisedSubtotal }
        ]
      }
    }
  });

  console.log("[seed] done.");
  console.log(
    `[seed] demo login: username=<sales_demo|warehouse_demo|production_demo|qc_demo|logistics_demo|finance_demo|admin>  password=${SEED_PASSWORD}`
  );
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
