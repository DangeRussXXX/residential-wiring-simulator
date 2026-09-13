// Residential Wiring Simulator
// Electrical Core - Breaker Panel System
//
// Responsibilities:
//
// - Panel service information
// - Physical breaker slots
// - Breaker installation/removal
// - Single-pole placement
// - Two-pole placement
// - Physical slot occupancy
// - Safe replacement
//
// IMPORTANT:
//
// The panel owns PHYSICAL breaker placement.
//
// A Breaker is one electrical object.
//
// A two-pole breaker therefore has:
//
//   one Breaker object
//   two physical slots
//
// Example:
//
//   Slot 5 -> breaker ABC
//   Slot 6 -> breaker ABC
//
// Both slots reference the same Breaker object.

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

  /**
   * Stable physical slot identifier.
   */
  id: string;


  /**
   * Human-readable physical slot number.
   *
   * Starts at 1.
   */
  slot: number;


  /**
   * Whether something occupies this physical slot.
   */
  installed: boolean;


  /**
   * Electrical breaker occupying this slot.
   *
   * For a two-pole breaker, the SAME object is referenced
   * from both physical slots.
   */
  breaker: Breaker | null;


  /**
   * Compatibility field.
   *
   * For a secondary pole this contains the primary breaker's
   * ID.
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


  /**
   * Main service breaker rating.
   */
  mainBreaker: number;


  /**
   * Residential split-phase service.
   */
  voltage: 240;


  /**
   * Number of physical breaker spaces.
   */
  spaces: number;


  /**
   * Whether the panel is connected to service.
   */
  serviceConnected: boolean;


  /**
   * Whether the panel has a grounding connection.
   */
  grounded: boolean;


  /**
   * Physical breaker slots.
   *
   * Normally breakers.length === spaces.
   */
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

  const normalizedSlots =
    Math.max(
      1,
      Math.floor(slots)
    );


  return {

    id,

    name,

    manufacturer:
      "Generic",

    model:
      "Residential Load Center",

    mainBreaker,

    voltage:
      240,

    spaces:
      normalizedSlots,

    serviceConnected:
      true,

    grounded:
      true,

    breakers:
      Array.from(
        {
          length:
            normalizedSlots
        },
        (_, index) => {

          const slotNumber =
            index + 1;

          return {

            id:
              `slot-${id}-${slotNumber}`,

            slot:
              slotNumber,

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
// GET BREAKER OCCUPIED SLOTS
// ============================================================
//
// Single pole:
//
//   breaker.slot = 5
//   result = [5]
//
// Two pole:
//
//   breaker.slot = 5
//   result = [5, 6]
//
// The Breaker.slot property is ALWAYS the starting slot.
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
// GET BREAKER START SLOT
// ============================================================
//
// If a caller supplies either physical slot of a two-pole
// breaker, this resolves the actual starting slot.
//
// Examples:
//
//   slot 5 -> breaker starts at 5
//   slot 6 -> breaker starts at 5
//

export function getBreakerStartSlot(

  panel: BreakerPanel,

  slotNumber: number

): number | null {

  const breaker =
    getBreakerAtSlot(
      panel,
      slotNumber
    );


  if (!breaker) {

    return null;

  }


  return breaker.slot;

}


// ============================================================
// GET BREAKER AT PHYSICAL SLOT
// ============================================================
//
// Works for:
//
// - primary pole
// - secondary pole
// - compatibility occupiedBy data
//
// Exported because the UI needs exactly this operation.
//

export function getBreakerAtSlot(

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


  // ----------------------------------------------------------
  // Current representation.
  // ----------------------------------------------------------

  if (
    slot.breaker
  ) {

    return slot.breaker;

  }


  // ----------------------------------------------------------
  // Compatibility representation.
  // ----------------------------------------------------------

  if (
    slot.occupiedBy
  ) {

    const owner =
      panel.breakers.find(
        item =>
          item.breaker?.id ===
          slot.occupiedBy
      );


    if (
      owner?.breaker
    ) {

      return owner.breaker;

    }

  }


  // ----------------------------------------------------------
  // Legacy two-pole representation.
  //
  // Some older saved data only stored the breaker on the first
  // physical slot.
  // ----------------------------------------------------------

  if (
    slotNumber > 1
  ) {

    const previousSlot =
      panel.breakers.find(
        item =>
          item.slot ===
          slotNumber - 1
      );


    if (
      previousSlot?.breaker &&
      previousSlot.breaker.poles === 2
    ) {

      return previousSlot.breaker;

    }

  }


  return null;
}


// ============================================================
// CHECK PHYSICAL SLOT RANGE
// ============================================================

function areRequiredSlotsInRange(

  panel: BreakerPanel,

  breaker: Breaker

): boolean {

  const occupiedSlots =
    getBreakerOccupiedSlots(
      breaker
    );


  return occupiedSlots.every(
    slotNumber =>

      slotNumber >= 1 &&

      slotNumber <= panel.spaces

  );

}


// ============================================================
// CHECK SLOT AVAILABILITY
// ============================================================
//
// IMPORTANT:
//
// An available slot must have:
//
//   installed === false
//   breaker === null
//   occupiedBy === undefined
//
// This prevents stale compatibility data from allowing
// accidental double installation.
//

export function areBreakerSlotsAvailable(

  panel: BreakerPanel,

  breaker: Breaker

): boolean {

  if (
    !areRequiredSlotsInRange(
      panel,
      breaker
    )
  ) {

    return false;

  }


  const occupiedSlots =
    getBreakerOccupiedSlots(
      breaker
    );


  return occupiedSlots.every(
    slotNumber => {

      const slot =
        panel.breakers.find(
          item =>
            item.slot ===
            slotNumber
        );


      if (!slot) {

        return false;

      }


      return (

        !slot.installed &&

        !slot.breaker &&

        !slot.occupiedBy

      );

    }
  );

}


// ============================================================
// CLEAR BREAKER FOOTPRINT
// ============================================================
//
// Internal helper.
//
// Removes a breaker from every physical slot it occupies.
//

function clearBreakerFootprint(

  panel: BreakerPanel,

  breaker: Breaker

): BreakerPanel {

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
// INSTALL BREAKER
// ============================================================
//
// Installs a NEW breaker.
//
// This function intentionally does NOT replace existing
// breakers.
//
// Use replaceBreaker() when replacing.
//

export function installBreaker(

  panel: BreakerPanel,

  breaker: Breaker

): BreakerPanel {

  // ----------------------------------------------------------
  // Basic validation.
  // ----------------------------------------------------------

  if (
    breaker.poles !== 1 &&
    breaker.poles !== 2
  ) {

    console.warn(
      "[BreakerPanel] Invalid breaker pole count."
    );

    return panel;

  }


  if (
    breaker.amperage <= 0
  ) {

    console.warn(
      "[BreakerPanel] Breaker amperage must be greater than zero."
    );

    return panel;

  }


  // ----------------------------------------------------------
  // Physical slot validation.
  // ----------------------------------------------------------

  if (
    !areBreakerSlotsAvailable(
      panel,
      breaker
    )
  ) {

    console.warn(
      `[BreakerPanel] Cannot install breaker in slot ${breaker.slot}. Required physical slots are unavailable.`
    );

    return panel;

  }


  const occupiedSlots =
    getBreakerOccupiedSlots(
      breaker
    );


  // ----------------------------------------------------------
  // Install one electrical object into every physical slot.
  // ----------------------------------------------------------

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
// The requested physical slot may be:
//
//   primary slot
//
// OR:
//
//   secondary slot of a two-pole breaker
//
// The complete physical footprint is removed.
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


  return clearBreakerFootprint(
    panel,
    breaker
  );

}


// ============================================================
// REPLACE BREAKER
// ============================================================
//
// The UI can safely call this for both:
//
//   INSTALL
//
// and:
//
//   REPLACE
//
// If the requested breaker footprint overlaps an existing
// breaker, that breaker is removed first.
//
// This also handles replacing a two-pole breaker with a
// single-pole breaker and vice versa.
//

export function replaceBreaker(

  panel: BreakerPanel,

  breaker: Breaker

): BreakerPanel {

  // ----------------------------------------------------------
  // Find every existing breaker occupying the requested
  // footprint.
  // ----------------------------------------------------------

  const targetSlots =
    getBreakerOccupiedSlots(
      breaker
    );


  const breakersToRemove =
    new Map<string, Breaker>();


  targetSlots.forEach(
    slotNumber => {

      const existing =
        getBreakerAtSlot(
          panel,
          slotNumber
        );


      if (
        existing
      ) {

        breakersToRemove.set(
          existing.id,
          existing
        );

      }

    }
  );


  // ----------------------------------------------------------
  // Remove all overlapping breakers.
  // ----------------------------------------------------------

  let clearedPanel =
    panel;


  breakersToRemove.forEach(
    existing => {

      clearedPanel =
        clearBreakerFootprint(
          clearedPanel,
          existing
        );

    }
  );


  // ----------------------------------------------------------
  // Install the replacement.
  // ----------------------------------------------------------

  return installBreaker(
    clearedPanel,
    breaker
  );

}


// ============================================================
// FIND PHYSICAL SLOT
// ============================================================

export function getBreakerSlot(

  panel: BreakerPanel,

  slotNumber: number

): BreakerSlot | undefined {

  return panel.breakers.find(
    slot =>
      slot.slot ===
      slotNumber
  );

}


// ============================================================
// CHECK SLOT OCCUPANCY
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
// GET ALL INSTALLED BREAKERS
// ============================================================
//
// IMPORTANT:
//
// A two-pole breaker appears in two physical slots but only
// once in this result.
//

export function getInstalledBreakers(

  panel: BreakerPanel

): Breaker[] {

  const result: Breaker[] = [];

  const seen =
    new Set<string>();


  panel.breakers.forEach(
    slot => {

      if (
        !slot.breaker
      ) {

        return;

      }


      if (
        seen.has(
          slot.breaker.id
        )
      ) {

        return;

      }


      seen.add(
        slot.breaker.id
      );


      result.push(
        slot.breaker
      );

    }
  );


  return result;

}


// ============================================================
// ADD STANDARD BREAKER
// ============================================================
//
// Convenience helper for older callers.
//

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