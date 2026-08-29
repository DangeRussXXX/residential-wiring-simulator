// Residential Wiring Simulator
// Electrical Core - Breaker Panel System
//
// Responsibilities:
// - Panel service information
// - Physical breaker slots
// - Breaker installation/removal
// - Single-pole and double-pole placement
// - Panel slot occupancy
// - Safe breaker replacement
//
// The panel owns PHYSICAL breaker placement.
// The breaker owns its electrical characteristics.

import {
  createBreaker
} from "./breaker";

import type {
  Breaker
} from "./breaker";

import type {
  BreakerPoles
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
   * If this physical slot is occupied by another
   * position of a multi-pole breaker, this identifies
   * the breaker occupying the space.
   *
   * Kept optional for compatibility with the existing UI.
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

  slots: number

): BreakerPanel {

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

        { length: slots },

        (_, index) => ({

          id:
            `slot-${index + 1}`,

          slot:
            index + 1,

          installed:
            false,

          breaker:
            null,

          occupiedBy:
            undefined

        })

      )

  };

}


// ============================================================
// GET BREAKER OCCUPIED SLOTS
// ============================================================
//
// Returns the physical slots required by a breaker.
//
// Single-pole:
//   [5]
//
// Double-pole:
//   [5, 6]
//
// The breaker.slot property represents the starting
// physical position.
//

export function getBreakerOccupiedSlots(

  breaker: Breaker

): number[] {

  if (
    breaker.poles === 2
  ) {

    return [

      breaker.slot,

      breaker.slot + 1

    ];

  }


  return [

    breaker.slot

  ];

}


// ============================================================
// FIND BREAKER IN SLOT
// ============================================================
//
// Returns the breaker occupying a particular physical slot.
//
// Works for:
//
// - primary slot
// - secondary slot of a two-pole breaker
//

function getBreakerAtSlot(

  panel: BreakerPanel,

  slotNumber: number

): Breaker | null {

  const slot =
    panel.breakers.find(
      item =>
        item.slot === slotNumber
    );


  if (!slot) {

    return null;

  }


  if (
    slot.breaker
  ) {

    return slot.breaker;

  }


  /*
   * Compatibility fallback:
   *
   * Older panel data may have occupiedBy
   * without a breaker reference on the
   * secondary physical slot.
   */

  if (
    slot.occupiedBy
  ) {

    const owner =
      panel.breakers.find(
        item =>
          item.breaker?.id ===
          slot.occupiedBy
      );


    return owner?.breaker ?? null;

  }


  return null;

}


// ============================================================
// CHECK SLOT RANGE
// ============================================================

function areSlotsAvailable(

  panel: BreakerPanel,

  breaker: Breaker

): boolean {

  const occupiedSlots =
    getBreakerOccupiedSlots(
      breaker
    );


  // ----------------------------------------------------------
  // Every required physical slot must exist.
  // ----------------------------------------------------------

  const slotsExist =
    occupiedSlots.every(
      slotNumber =>
        slotNumber >= 1 &&
        slotNumber <= panel.spaces
    );


  if (!slotsExist) {

    return false;

  }


  // ----------------------------------------------------------
  // Every required physical slot must be empty.
  // ----------------------------------------------------------

  const slotsEmpty =
    occupiedSlots.every(
      slotNumber => {

        const slot =
          panel.breakers.find(
            item =>
              item.slot === slotNumber
          );


        return !!slot &&
          !slot.installed &&
          !slot.breaker &&
          !slot.occupiedBy;

      }
    );


  return slotsEmpty;

}


// ============================================================
// INSTALL BREAKER
// ============================================================
//
// Single-pole:
//
//   Slot 5 → breaker
//
// Double-pole:
//
//   Slot 5 → breaker
//   Slot 6 → same breaker
//
// The same Breaker object is referenced from both physical
// slots. This keeps the breaker electrically singular while
// allowing the panel to represent its physical footprint.
//

export function installBreaker(

  panel: BreakerPanel,

  breaker: Breaker

): BreakerPanel {

  if (
    !areSlotsAvailable(
      panel,
      breaker
    )
  ) {

    console.warn(
      "Cannot install breaker: required panel slots are unavailable."
    );

    return panel;

  }


  const occupiedSlots =
    getBreakerOccupiedSlots(
      breaker
    );


  return {

    ...panel,

    breakers:

      panel.breakers.map(
        slot => {

          if (
            !occupiedSlots.includes(
              slot.slot
            )
          ) {

            return slot;

          }


          return {

            ...slot,

            installed:
              true,

            breaker,

            occupiedBy:
              breaker.id

          };

        }
      )

  };

}


// ============================================================
// REMOVE BREAKER
// ============================================================
//
// The requested slot may be either:
//
// - the first slot of a breaker
// - the second slot of a two-pole breaker
//
// We first resolve the breaker, then remove every physical
// slot occupied by that breaker.
//

export function removeBreaker(

  panel: BreakerPanel,

  slotNumber: number

): BreakerPanel {

  const breaker =
    getBreakerAtSlot(
      panel,
      slotNumber
    );


  if (!breaker) {

    return panel;

  }


  const occupiedSlots =
    getBreakerOccupiedSlots(
      breaker
    );


  return {

    ...panel,

    breakers:

      panel.breakers.map(
        slot => {

          if (
            !occupiedSlots.includes(
              slot.slot
            )
          ) {

            return slot;

          }


          return {

            ...slot,

            installed:
              false,

            breaker:
              null,

            occupiedBy:
              undefined

          };

        }
      )

  };

}


// ============================================================
// REPLACE BREAKER
// ============================================================
//
// Replaces whatever breaker occupies the requested starting
// slot.
//
// This is especially important for the UI because
// BreakerPanel.tsx displays:
//
//   "REPLACE BREAKER"
//
// when a breaker already exists.
//
// For a two-pole breaker, the entire physical footprint
// is removed before the new breaker is installed.
//

export function replaceBreaker(

  panel: BreakerPanel,

  breaker: Breaker

): BreakerPanel {

  const existingBreaker =
    getBreakerAtSlot(
      panel,
      breaker.slot
    );


  if (existingBreaker) {

    const clearedPanel =
      removeBreaker(
        panel,
        breaker.slot
      );


    return installBreaker(
      clearedPanel,
      breaker
    );

  }


  return installBreaker(
    panel,
    breaker
  );

}


// ============================================================
// FIND SLOT
// ============================================================

export function getBreakerSlot(

  panel: BreakerPanel,

  slotNumber: number

): BreakerSlot | undefined {

  return panel.breakers.find(

    slot =>
      slot.slot === slotNumber

  );

}


// ============================================================
// CHECK WHETHER SLOT IS OCCUPIED
// ============================================================

export function isBreakerSlotOccupied(

  panel: BreakerPanel,

  slotNumber: number

): boolean {

  return !!getBreakerAtSlot(
    panel,
    slotNumber
  );

}


// ============================================================
// ADD STANDARD BREAKER
// ============================================================

export function addStandardBreaker(

  panel: BreakerPanel,

  slotNumber: number,

  amperage: number

): BreakerPanel {

  const breaker =
    createBreaker(

      `breaker-${panel.id}-${slotNumber}`,

      slotNumber,

      amperage,

      1 as BreakerPoles,

      "STANDARD"

    );


  return installBreaker(

    panel,

    breaker

  );

}