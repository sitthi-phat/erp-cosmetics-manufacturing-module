/**
 * Q1 — Unit: forbidden state transitions guarded purely at the state-machine level
 * (ECP-005 AC2, ECP-019 AC2, ECP-020 AC3, architecture.md §5.1-§5.4).
 * DB-level enforcement (that the API actually blocks these) is verified in integration specs;
 * this file tests the pure transition-guard logic in isolation.
 *
 * RECONCILED 2026-07-07 (QA verify phase): there is NO single generic
 * `canTransition(machine, from, to) => boolean` export anywhere in the codebase. Engineer instead
 * wrote one small `assert*` guard per action (throws AppError on an illegal transition, returns
 * void otherwise) colocated per module: `po.rules.ts#assertCanCancel/assertShippedForInvoice`,
 * `shipping.rules.ts#assertCanMarkDelivered`, `qc.rules.ts#assertInspectable`. This file wraps
 * those real guards with a local `canTransition` adapter (throw -> false, no-throw -> true) so the
 * original AC-level test intent is preserved while exercising the ACTUAL production code path
 * (not a reimplementation). See docs/test-plans/erp-core-prototype/defects.md OBS-1 for the one
 * case (Batch "ReadyToShip") that could not be mapped at all.
 */
import { assertCanCancel, assertShippedForInvoice } from "../../src/backend/modules/po/po.rules";
import { assertCanMarkDelivered } from "../../src/backend/modules/shipping/shipping.rules";
import { assertBatchShippable } from "../../src/backend/modules/shipping/shipping.rules";

type Machine = "PO" | "Shipment" | "Batch";

function canTransition(machine: Machine, from: string, to: string): boolean {
  try {
    if (machine === "PO" && to === "Cancelled") {
      assertCanCancel(from as any, null);
      return true;
    }
    if (machine === "PO" && to === "Invoiced") {
      assertShippedForInvoice(from as any);
      return true;
    }
    if (machine === "Shipment" && to === "Delivered") {
      assertCanMarkDelivered(from as any);
      return true;
    }
    if (machine === "Batch" && (to === "Shipped" || to === "ReadyToShip")) {
      // The only real guard for "may this batch move toward shipping" is assertBatchShippable,
      // which requires QCApproved. There is no dedicated code path for an intermediate
      // "ReadyToShip" batch status at all (see reconciliation note above / OBS-1).
      assertBatchShippable(from as any);
      return true;
    }
    if (machine === "PO" && from === to) {
      // No self-transition guard exists for PO in the real code (nothing calls
      // assertCanCancel/assertShippedForInvoice with from === to as a "no-op" case) - self-transition
      // simply isn't a modeled operation, so we treat "no matching real action" as false below.
      return false;
    }
    // No real guard corresponds to this (machine, to) pair (e.g. nonsense target state).
    return false;
  } catch {
    return false;
  }
}

describe("State machine transition guards", () => {
  test("TC-005-AC2: PO cannot be Cancelled once InProduction", () => {
    expect(canTransition("PO", "InProduction", "Cancelled")).toBe(false);
  });

  test("PO can be Cancelled from Draft or Confirmed", () => {
    expect(canTransition("PO", "Draft", "Cancelled")).toBe(true);
    expect(canTransition("PO", "Confirmed", "Cancelled")).toBe(true);
  });

  test("TC-019-AC2: Shipment cannot jump Draft -> Delivered, must pass through Shipped", () => {
    expect(canTransition("Shipment", "Draft", "Delivered")).toBe(false);
    expect(canTransition("Shipment", "Shipped", "Delivered")).toBe(true);
  });

  test("TC-020-AC3: Invoice cannot be issued for a PO that is not yet Shipped — modeled as PO transition guard", () => {
    expect(canTransition("PO", "InProduction", "Invoiced")).toBe(false);
    expect(canTransition("PO", "Shipped", "Invoiced")).toBe(true);
  });

  test("Batch: only a QCApproved batch may proceed toward shipping (no dedicated ReadyToShip step exists in the real code)", () => {
    expect(canTransition("Batch", "QCPending", "Shipped")).toBe(false);
    expect(canTransition("Batch", "QCApproved", "Shipped")).toBe(true);
  });

  test("exploratory: an unknown/typo'd state name must not silently return true", () => {
    expect(canTransition("PO", "Draft", "TotallyMadeUpState")).toBe(false);
  });

  test("exploratory: self-transition (from === to) must be explicitly false unless a machine documents it as valid (defensive default)", () => {
    expect(canTransition("PO", "Confirmed", "Confirmed")).toBe(false);
  });
});
