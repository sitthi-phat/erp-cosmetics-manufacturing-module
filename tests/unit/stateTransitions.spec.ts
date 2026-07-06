/**
 * Q1 — Unit: forbidden state transitions guarded purely at the state-machine level
 * (ECP-005 AC2, ECP-019 AC2, ECP-020 AC3, architecture.md §5.1-§5.4).
 * DB-level enforcement (that the API actually blocks these) is verified in integration specs;
 * this file tests the pure transition-table logic in isolation.
 *
 * ASSUMED API (`src/backend/lib/stateMachines.ts`):
 *   canTransition(machine: "PO"|"ProductionOrder"|"Batch"|"Shipment"|"Invoice",
 *                 from: string, to: string) => boolean
 */
import { canTransition } from "../../src/backend/lib/stateMachines"; // TODO(Engineer): confirm path

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

  test("Batch: QCPending can only go to QCApproved or QCRejected, never directly to ReadyToShip/Shipped", () => {
    expect(canTransition("Batch", "QCPending", "ReadyToShip")).toBe(false);
    expect(canTransition("Batch", "QCPending", "Shipped")).toBe(false);
    expect(canTransition("Batch", "QCPending", "QCApproved")).toBe(true);
    expect(canTransition("Batch", "QCPending", "QCRejected")).toBe(true);
  });

  test("exploratory: an unknown/typo'd state name must not silently return true", () => {
    expect(canTransition("PO", "Draft", "TotallyMadeUpState")).toBe(false);
  });

  test("exploratory: self-transition (from === to) must be explicitly false unless a machine documents it as valid (defensive default)", () => {
    expect(canTransition("PO", "Confirmed", "Confirmed")).toBe(false);
  });
});
