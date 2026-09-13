// Residential Wiring Simulator
// Electrical Core - Breaker Panel System
//
// Responsibilities:
// - Panel service information
// - Physical breaker slots
// - Breaker installation
// - Breaker removal
// - Breaker replacement
// - Single-pole placement
// - Two-pole placement
// - Physical slot occupancy
//
// IMPORTANT:
// The panel owns PHYSICAL placement.
// The breaker owns ELECTRICAL characteristics.
//
// A two-pole breaker is one Breaker object occupying
// two physical BreakerSlot objects.

import {
  createBreaker,
  assignBreakerSlot,
} from "./breaker";

import type {
  Breaker,
} from "./breaker";

import type {
  BreakerPoles,
} from "./types";


// ============================================================
// BREAKER SLOT
// ============================================================

export interface BreakerSlot {

  id: string;

  slot: number;

  installed: boolean;

  breaker: Breaker | null;

  /**
   * Present on secondary physical positions of
   * multi-pole breakers.
   *
   * Example:
   *
   * slot 5:
   *   breaker = breakerA
   *   occupiedBy = breakerA.id
   *
   * slot 6:
   *   breaker = breakerA
   *   occupiedBy = breakerA.id
   */
  occupiedBy?: string;

}


// ============================================================
// BREAKER PANEL
// ============================================================

export interface BreakerPanel {

  id: string;

  name: string;

  manufacturer?: string;

  model?: string;

  mainBreaker: number;

  voltage: 240;

  spaces: number;

  serviceConnected: boolean;

  grounded: boolean;

  breakers: BreakerSlot[];

}


// ============================================================
// CREATE PANEL
// ============================================================

export function createBreakerPanel(
  id: string,
  name: string,
  mainBreaker: number,
  slots: number,
): BreakerPanel {

  if (
    !Number.isInteger(slots) ||
    slots <= 0
  ) {

    throw new Error(
      "Breaker panel must have at least one physical slot.",
    );

  }

  return {

    id,

    name,

    manufacturer: "Generic",

    model: "Residential Load Center",

    mainBreaker,

    voltage: 240,

    spaces: slots,

    serviceConnected: true,

    grounded: true,

    breakers:
      Array.from(
        {
          length: slots,
        },
        (_, index) => ({

          id:
            `slot-${index + 1}`,

          slot:
            index + 1,

          installed: false,

          breaker: null,

          occupiedBy: undefined,

        }),
      ),

  };

}


// ============================================================
// GET BREAKER OCCUPIED SLOTS
// ============================================================

export function getBreakerOccupiedSlots(
  breaker: Breaker,
): number[] {

  if (
    breaker.poles === 2
  ) {

    return [
      breaker.slot,
      breaker.slot + 1,
    ];

  }

  return [
    breaker.slot,
  ];

}


// ============================================================
// FIND BREAKER AT PHYSICAL SLOT
// ============================================================
//
// This is the authoritative resolver.
//
// It handles:
//
// 1. Primary slot
// 2. Secondary pole
// 3. Legacy occupiedBy data
//
// A caller should NEVER need to manually calculate
// "slot - 1" for a two-pole breaker.

export function getBreakerAtSlot(
  panel: BreakerPanel,
  slotNumber: number,
): Breaker | null {

  const slot =
    panel.breakers.find(
      item =>
        item.slot === slotNumber,
    );

  if (!slot) {
    return null;
  }

  /*
   * Preferred representation.
   */
  if (
    slot.breaker
  ) {

    return slot.breaker;

  }

  /*
   * Legacy / compatibility representation.
   */
  if (
    slot.occupiedBy
  ) {

    const owner =
      panel.breakers.find(
        item =>
          item.breaker?.id ===
          slot.occupiedBy,
      );

    if (
      owner?.breaker
    ) {

      return owner.breaker;

    }

  }

  return null;

}


// ============================================================
// FIND BREAKER START SLOT
// ============================================================
//
// Returns the first physical slot of the breaker.
//
// For:
//
//   slot 5 -> 5
//
//   slot 6 -> 5 if slot 6 is the second pole
//
//   slot 5 -> 5 if slot 5 is the first pole

export function getBreakerStartSlot(
  panel: BreakerPanel,
  breaker: Breaker,
  fallbackSlot?: number,
): number {

  /*
   * First use the physical panel representation.
   */
  const ownerSlot =
    panel.breakers.find(
      slot =>
        slot.breaker?.id ===
        breaker.id,
    );

  if (
    ownerSlot
  ) {

    return ownerSlot.slot;

  }

  /*
   * If legacy data only tells us that the
   * selected physical position is occupied,
   * infer the first slot.
   */
  const selected =
    fallbackSlot ??
    breaker.slot;

  if (
    breaker.poles === 2
  ) {

    /*
     * If the selected position equals the
     * breaker's stored starting slot, use it.
     */
    if (
      breaker.slot === selected
    ) {

      return selected;

    }

    /*
     * Otherwise the selected position is
     * assumed to be the second pole.
     */
    if (
      breaker.slot !== -1 &&
      breaker.slot < selected
    ) {

      return breaker.slot;

    }

    const previous =
      selected - 1;

    if (
      previous >= 1
    ) {

      return previous;

    }

  }

  return selected;

}


// ============================================================
// FIND BREAKER STARTING AT SLOT
// ============================================================

export function getBreakerStartingAtSlot(
  panel: BreakerPanel,
  slotNumber: number,
): Breaker | null {

  const breaker =
    getBreakerAtSlot(
      panel,
      slotNumber,
    );

  if (!breaker) {
    return null;
  }

  const start =
    getBreakerStartSlot(
      panel,
      breaker,
      slotNumber,
    );

  return (
    start === slotNumber
      ? breaker
      : null
  );

}


// ============================================================
// CHECK SLOT RANGE
// ============================================================

function areSlotsInRange(
  panel: BreakerPanel,
  breaker: Breaker,
): boolean {

  return getBreakerOccupiedSlots(
    breaker,
  ).every(
    slotNumber =>
      slotNumber >= 1 &&
      slotNumber <= panel.spaces,
  );

}


// ============================================================
// CHECK SLOT AVAILABILITY
// ============================================================

export function areBreakerSlotsAvailable(
  panel: BreakerPanel,
  breaker: Breaker,
): boolean {

  if (
    !areSlotsInRange(
      panel,
      breaker,
    )
  ) {

    return false;

  }

  return getBreakerOccupiedSlots(
    breaker,
  ).every(
    slotNumber => {

      const slot =
        panel.breakers.find(
          item =>
            item.slot === slotNumber,
        );

      if (!slot) {
        return false;
      }

      return (
        !slot.installed &&
        slot.breaker === null &&
        !slot.occupiedBy
      );

    },
  );

}


// ============================================================
// INSTALL BREAKER
// ============================================================
//
// IMPORTANT:
// This function ONLY installs into empty slots.
//
// Replacement is handled separately by
// replaceBreaker() / installOrReplaceBreaker().

export function installBreaker(
  panel: BreakerPanel,
  breaker: Breaker,
): BreakerPanel {

  /*
   * Always normalize the breaker to its requested
   * starting slot before installation.
   */
  const normalizedBreaker =
    assignBreakerSlot(
      breaker,
      breaker.slot,
    );

  if (
    !areBreakerSlotsAvailable(
      panel,
      normalizedBreaker,
    )
  ) {

    console.warn(
      "Cannot install breaker: required panel slots are unavailable.",
    );

    return panel;

  }

  const occupiedSlots =
    getBreakerOccupiedSlots(
      normalizedBreaker,
    );

  return {

    ...panel,

    breakers:
      panel.breakers.map(
        slot => {

          if (
            !occupiedSlots.includes(
              slot.slot,
            )
          ) {

            return slot;

          }

          return {

            ...slot,

            installed: true,

            breaker:
              normalizedBreaker,

            occupiedBy:
              normalizedBreaker.id,

          };

        },
      ),

  };

}


// ============================================================
// REMOVE BREAKER
// ============================================================
//
// Passing EITHER physical position removes the whole breaker.
//
// Example:
//
// removeBreaker(panel, 5)
//
// or:
//
// removeBreaker(panel, 6)
//
// Both remove a two-pole breaker occupying 5 + 6.

export function removeBreaker(
  panel: BreakerPanel,
  slotNumber: number,
): BreakerPanel {

  const breaker =
    getBreakerAtSlot(
      panel,
      slotNumber,
    );

  if (!breaker) {
    return panel;
  }

  const occupiedSlots =
    getBreakerOccupiedSlots(
      breaker,
    );

  return {

    ...panel,

    breakers:
      panel.breakers.map(
        slot => {

          if (
            !occupiedSlots.includes(
              slot.slot,
            )
          ) {

            return slot;

          }

          return {

            ...slot,

            installed: false,

            breaker: null,

            occupiedBy: undefined,

          };

        },
      ),

  };

}


// ============================================================
// REPLACE BREAKER
// ============================================================
//
// Replaces the breaker currently occupying the requested
// starting/selected position.
//
// The old breaker is completely removed first.
//
// This means:
//
// old 2-pole at 5 + 6
//
// can safely become:
//
// new 1-pole at 5
//
// or:
//
// new 2-pole at 5 + 6

export function replaceBreaker(
  panel: BreakerPanel,
  breaker: Breaker,
): BreakerPanel {

  const existing =
    getBreakerAtSlot(
      panel,
      breaker.slot,
    );

  /*
   * No existing breaker.
//   * Just install normally.
   */
  if (!existing) {

    return installBreaker(
      panel,
      breaker,
    );

  }

  /*
   * Remove the entire existing physical footprint.
   */
  const clearedPanel =
    removeBreaker(
      panel,
      breaker.slot,
    );

  /*
   * Now install the replacement.
   */
  return installBreaker(
    clearedPanel,
    breaker,
  );

}


// ============================================================
// INSTALL OR REPLACE
// ============================================================
//
// This is the function the UI/application layer should
// normally use when the user presses:
//
// INSTALL BREAKER
//
// or:
//
// REPLACE BREAKER

export function installOrReplaceBreaker(
  panel: BreakerPanel,
  breaker: Breaker,
): BreakerPanel {

  const existing =
    getBreakerAtSlot(
      panel,
      breaker.slot,
    );

  if (existing) {

    return replaceBreaker(
      panel,
      breaker,
    );

  }

  return installBreaker(
    panel,
    breaker,
  );

}


// ============================================================
// FIND SLOT
// ============================================================

export function getBreakerSlot(
  panel: BreakerPanel,
  slotNumber: number,
): BreakerSlot | undefined {

  return panel.breakers.find(
    slot =>
      slot.slot === slotNumber,
  );

}


// ============================================================
// CHECK WHETHER SLOT IS OCCUPIED
// ============================================================

export function isBreakerSlotOccupied(
  panel: BreakerPanel,
  slotNumber: number,
): boolean {

  return (
    getBreakerAtSlot(
      panel,
      slotNumber,
    ) !== null
  );

}


// ============================================================
// CHECK WHETHER BREAKER CAN FIT
// ============================================================

export function canInstallBreaker(
  panel: BreakerPanel,
  slotNumber: number,
  poles: BreakerPoles,
): boolean {

  const breaker =
    createBreaker(
      `validation-${panel.id}-${slotNumber}`,
      slotNumber,
      15,
      poles,
      "STANDARD",
    );

  return areBreakerSlotsAvailable(
    panel,
    breaker,
  );

}


// ============================================================
// ADD STANDARD BREAKER
// ============================================================

export function addStandardBreaker(
  panel: BreakerPanel,
  slotNumber: number,
  amperage: number,
): BreakerPanel {

  const breaker =
    createBreaker(
      `breaker-${panel.id}-${slotNumber}`,
      slotNumber,
      amperage,
      1,
      "STANDARD",
    );

  return installBreaker(
    panel,
    breaker,
  );

}