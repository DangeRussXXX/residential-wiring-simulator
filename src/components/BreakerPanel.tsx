import { useState } from "react";

import type {
  BreakerPanel as BreakerPanelType,
} from "../electrical/breakerPanel";

import type {
  BreakerType,
  Breaker,
} from "../electrical/breaker";

import type {
  BreakerPoles,
} from "../electrical/types";


export type BreakerConfiguration = {
  slot: number;
  amperage: number;
  breakerType: BreakerType;
  poles: BreakerPoles;
};


type BreakerPanelProps = {
  panel: BreakerPanelType;

  circuitStatus?:
    | "READY"
    | "WARNING"
    | "FAULT";

  onTrip?: () => void;

  onReset?: () => void;

  onInstallBreaker?: (
    config: BreakerConfiguration
  ) => void;

  onRemoveBreaker?: (
    slotNumber: number
  ) => void;
};


const breakerSizes = [
  15,
  20,
  25,
  30,
  40,
  50,
  60,
];


const breakerTypes: {
  value: BreakerType;
  label: string;
}[] = [
  {
    value: "STANDARD",
    label: "Standard",
  },
  {
    value: "GFCI",
    label: "GFCI",
  },
  {
    value: "AFCI",
    label: "AFCI",
  },
  {
    value: "DUAL_FUNCTION",
    label: "AFCI/GFCI Combo",
  },
];


const poleOptions: {
  value: BreakerPoles;
  label: string;
}[] = [
  {
    value: 1,
    label: "1 Pole — 120V",
  },
  {
    value: 2,
    label: "2 Pole — 240V",
  },
];


function getBreakerDisplayName(
  breaker: Breaker
): string {
  if (breaker.breakerType === "DUAL_FUNCTION") {
    return "AFCI/GFCI";
  }

  return breaker.breakerType;
}


/*
 * ----------------------------------------------------------
 * FIND BREAKER AT PHYSICAL SLOT
 * ----------------------------------------------------------
 *
 * Handles:
 *
 * 1. A breaker directly stored on the slot.
 *
 * 2. A secondary slot using occupiedBy.
 *
 * 3. A two-pole breaker stored only on
 *    the previous physical slot.
 */
function getBreakerAtSlot(
  panel: BreakerPanelType,
  slotNumber: number
): Breaker | null {

  const slot = panel.breakers.find(
    item => item.slot === slotNumber
  );

  if (!slot) {
    return null;
  }

  /*
   * Normal representation.
   */
  if (slot.breaker) {
    return slot.breaker;
  }

  /*
   * Compatibility with occupiedBy.
   */
  if (slot.occupiedBy) {
    const owner = panel.breakers.find(
      item =>
        item.breaker?.id === slot.occupiedBy
    );

    return owner?.breaker ?? null;
  }

  /*
   * Compatibility with two-pole breakers
   * represented only on their first slot.
   */
  const previousSlot = panel.breakers.find(
    item =>
      item.slot === slotNumber - 1
  );

  if (
    previousSlot?.breaker &&
    previousSlot.breaker.poles === 2
  ) {
    return previousSlot.breaker;
  }

  return null;
}


/*
 * ----------------------------------------------------------
 * FIND BREAKER START SLOT
 * ----------------------------------------------------------
 *
 * Single pole:
 *
 *   slot 5 -> 5
 *
 * Two pole:
 *
 *   slot 5 -> 5
 *   slot 6 -> 5
 */
function getBreakerStartSlot(
  panel: BreakerPanelType,
  breaker: Breaker,
  fallbackSlot: number
): number {

  /*
   * First try to find the slot that actually
   * owns the breaker.
   */
  const primarySlot = panel.breakers.find(
    slot =>
      slot.breaker?.id === breaker.id
  );

  if (primarySlot) {
    return primarySlot.slot;
  }

  /*
   * If this is a two-pole breaker and the
   * selected slot is the second pole, the
   * starting slot is one position earlier.
   */
  if (breaker.poles === 2) {
    const calculatedStart = fallbackSlot - 1;

    if (calculatedStart >= 1) {
      return calculatedStart;
    }
  }

  return fallbackSlot;
}


export default function BreakerPanel({
  panel,
  circuitStatus = "READY",
  onTrip,
  onReset,
  onInstallBreaker,
  onRemoveBreaker,
}: BreakerPanelProps) {

  /*
   * ----------------------------------------------------------
   * COMPONENT STATE
   * ----------------------------------------------------------
   */

  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState<number | null>(null);

  const [
    selectedAmperage,
    setSelectedAmperage,
  ] = useState<number>(20);

  const [
    selectedType,
    setSelectedType,
  ] = useState<BreakerType>("STANDARD");

  const [
    selectedPoles,
    setSelectedPoles,
  ] = useState<BreakerPoles>(1);


  /*
   * ----------------------------------------------------------
   * CIRCUIT STATUS
   * ----------------------------------------------------------
   */

  const statusColor =
    circuitStatus === "FAULT"
      ? "#ff4040"
      : circuitStatus === "WARNING"
        ? "#ffd700"
        : "#39ff14";

  const statusText =
    circuitStatus === "FAULT"
      ? "BREAKER TRIPPED"
      : circuitStatus === "WARNING"
        ? "CHECK CONNECTIONS"
        : "BREAKER READY";


  /*
   * ----------------------------------------------------------
   * SELECTED BREAKER
   * ----------------------------------------------------------
   */

  const selectedBreaker =
    selectedSlot !== null
      ? getBreakerAtSlot(
          panel,
          selectedSlot
        )
      : null;


  /*
   * ----------------------------------------------------------
   * SELECTED BREAKER START SLOT
   * ----------------------------------------------------------
   */

  const selectedBreakerStartSlot =
    selectedBreaker !== null &&
    selectedSlot !== null
      ? getBreakerStartSlot(
          panel,
          selectedBreaker,
          selectedSlot
        )
      : selectedSlot;


  /*
   * ----------------------------------------------------------
   * SELECT SLOT
   * ----------------------------------------------------------
   */

  function handleSelectSlot(
    slotNumber: number
  ): void {

    setSelectedSlot(slotNumber);

    const breaker =
      getBreakerAtSlot(
        panel,
        slotNumber
      );

    /*
     * Empty slot.
     *
     * Keep the current configuration so the
     * user can install a new breaker.
     */
    if (!breaker) {
      return;
    }

    /*
     * Existing breaker.
     *
     * Synchronize the controls with the
     * installed breaker.
     */
    setSelectedAmperage(
      breaker.amperage
    );

    setSelectedType(
      breaker.breakerType
    );

    setSelectedPoles(
      breaker.poles
    );
  }


  /*
   * ----------------------------------------------------------
   * REMOVE BREAKER
   * ----------------------------------------------------------
   */

  function handleRemoveBreaker(): void {

    if (
      selectedBreaker === null ||
      selectedBreakerStartSlot === null
    ) {
      return;
    }

    /*
     * Send the physical starting slot to
     * the parent.
     *
     * For a two-pole breaker this ensures
     * the entire breaker is removed.
     */
    onRemoveBreaker?.(
      selectedBreakerStartSlot
    );

    setSelectedSlot(null);
  }


  /*
   * ----------------------------------------------------------
   * INSTALL / REPLACE BREAKER
   * ----------------------------------------------------------
   */

  function handleInstallBreaker(): void {

    if (selectedSlot === null) {
      return;
    }

    /*
     * For an existing two-pole breaker,
     * use its starting slot.
     *
     * Otherwise use the selected physical slot.
     */
    const installationSlot =
      selectedBreakerStartSlot ??
      selectedSlot;

    onInstallBreaker?.({
      slot: installationSlot,
      amperage: selectedAmperage,
      breakerType: selectedType,
      poles: selectedPoles,
    });
  }


  /*
   * ----------------------------------------------------------
   * RENDER
   * ----------------------------------------------------------
   */

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg,#111827,#050505)",
        border: "1px solid #176070",
        borderRadius: "10px",
        padding: "15px",
        color: "white",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >

      {/* ======================================================
          PANEL HEADER
          ====================================================== */}

      <h3
        style={{
          margin: 0,
          color: "#00eaff",
          letterSpacing: "1px",
        }}
      >
        ⚡ {panel.name}
      </h3>


      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >

        <span>
          {panel.manufacturer ?? "Generic"}{" "}
          {panel.model ??
            "Residential Load Center"}
        </span>


        <span
          style={{
            color: statusColor,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          ● {statusText}
        </span>

      </div>


      {/* ======================================================
          PANEL INFORMATION
          ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "10px",
        }}
      >

        <div
          style={{
            background: "#080b10",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #176070",
          }}
        >
          Main Breaker

          <br />

          <strong>
            {panel.mainBreaker}A
          </strong>
        </div>


        <div
          style={{
            background: "#080b10",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #176070",
          }}
        >
          Breaker Slots

          <br />

          <strong>
            {panel.spaces}
          </strong>
        </div>

      </div>


      {/* ======================================================
          BREAKER SLOTS
          ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,1fr)",
          gap: "8px",
        }}
      >

        {panel.breakers.map(slot => {

          const slotBreaker =
            getBreakerAtSlot(
              panel,
              slot.slot
            );

          const isSelected =
            selectedSlot === slot.slot;

          const isInstalled =
            slotBreaker !== null ||
            Boolean(slot.installed);

          const isSecondaryPole =
            slotBreaker !== null &&
            slotBreaker.poles === 2 &&
            slotBreaker.slot !== slot.slot;


          return (
            <div
              key={`slot-${slot.slot}`}
              onClick={() =>
                handleSelectSlot(
                  slot.slot
                )
              }
              style={{
                background:
                  isInstalled
                    ? "#123b12"
                    : isSelected
                      ? "#17202b"
                      : "#080b10",

                border:
                  isSelected
                    ? "2px solid #00eaff"
                    : isInstalled
                      ? "1px solid #39ff14"
                      : "1px solid #176070",

                borderRadius: "6px",
                padding: "8px",
                textAlign: "center",
                fontSize: "12px",
                cursor: "pointer",
                transition: ".2s",
                minHeight: "58px",
                boxSizing: "border-box",
              }}
            >

              <div>
                SLOT {slot.slot}
              </div>


              <div
                style={{
                  marginTop: "5px",
                  color:
                    isInstalled
                      ? "#39ff14"
                      : "#777",
                  fontWeight: 800,
                }}
              >

                {slotBreaker ? (
                  <>
                    {slotBreaker.amperage}A{" "}
                    {getBreakerDisplayName(
                      slotBreaker
                    )}

                    <br />

                    {slotBreaker.poles === 2
                      ? "240V"
                      : "120V"}

                    {isSecondaryPole && (
                      <>
                        <br />

                        <span
                          style={{
                            fontSize: "10px",
                            color: "#8cff8c",
                          }}
                        >
                          2ND POLE
                        </span>
                      </>
                    )}
                  </>
                ) : slot.installed ? (
                  "OCCUPIED"
                ) : (
                  "EMPTY"
                )}

              </div>

            </div>
          );
        })}

      </div>


      {/* ======================================================
          SELECTED SLOT
          ====================================================== */}

      {selectedSlot !== null && (
        <div
          style={{
            background: "#080b10",
            border: "1px solid #176070",
            borderRadius: "8px",
            padding: "12px",
          }}
        >

          <h4
            style={{
              marginTop: 0,
            }}
          >
            Slot {selectedSlot}

            {selectedBreaker &&
              selectedBreaker.poles === 2 && (
                <>
                  {" "}
                  — 2-Pole Breaker
                </>
              )}
          </h4>


          {/* ==================================================
              EXISTING BREAKER
              ================================================== */}

          {selectedBreaker && (
            <div
              style={{
                background: "#123b12",
                border: "1px solid #39ff14",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "12px",
              }}
            >

              <strong>
                Installed Breaker
              </strong>

              <br />

              {selectedBreaker.amperage}A{" "}
              {getBreakerDisplayName(
                selectedBreaker
              )}

              <br />

              {selectedBreaker.poles === 2
                ? "240V"
                : "120V"}

              <br />

              <span
                style={{
                  fontSize: "11px",
                  color: "#8cff8c",
                }}
              >
                Starting Slot:{" "}
                {selectedBreakerStartSlot}

                {selectedBreaker.poles === 2 &&
                  selectedBreakerStartSlot !==
                    null &&
                  `–${
                    selectedBreakerStartSlot + 1
                  }`}
              </span>


              <button
                type="button"
                onClick={
                  handleRemoveBreaker
                }
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "8px",
                  background: "#3b1010",
                  color: "#ff8080",
                  border: "1px solid #ff4040",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                REMOVE BREAKER
              </button>

            </div>
          )}


          {/* ==================================================
              BREAKER SIZE
              ================================================== */}

          <label htmlFor="breaker-size">
            Breaker Size
          </label>

          <select
            id="breaker-size"
            value={selectedAmperage}
            onChange={event =>
              setSelectedAmperage(
                Number(event.target.value)
              )
            }
            style={{
              width: "100%",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border: "1px solid #176070",
              borderRadius: "5px",
            }}
          >
            {breakerSizes.map(size => (
              <option
                key={size}
                value={size}
              >
                {size}A
              </option>
            ))}
          </select>


          {/* ==================================================
              BREAKER TYPE
              ================================================== */}

          <label htmlFor="breaker-type">
            Breaker Type
          </label>

          <select
            id="breaker-type"
            value={selectedType}
            onChange={event =>
              setSelectedType(
                event.target.value as BreakerType
              )
            }
            style={{
              width: "100%",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border: "1px solid #176070",
              borderRadius: "5px",
            }}
          >
            {breakerTypes.map(type => (
              <option
                key={type.value}
                value={type.value}
              >
                {type.label}
              </option>
            ))}
          </select>


          {/* ==================================================
              POLES
              ================================================== */}

          <label htmlFor="breaker-poles">
            Breaker Poles
          </label>

          <select
            id="breaker-poles"
            value={selectedPoles}
            onChange={event => {
              const value = Number(
                event.target.value
              );

              setSelectedPoles(
                value === 2 ? 2 : 1
              );
            }}
            style={{
              width: "100%",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border: "1px solid #176070",
              borderRadius: "5px",
            }}
          >
            {poleOptions.map(option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>


          {/* ==================================================
              VOLTAGE
              ================================================== */}

          <div
            style={{
              background: "#111827",
              padding: "9px",
              borderRadius: "5px",
              marginBottom: "10px",
              border: "1px solid #176070",
            }}
          >
            Voltage:{" "}
            <strong>
              {selectedPoles === 2
                ? "240V"
                : "120V"}
            </strong>
          </div>


          {/* ==================================================
              INSTALL / REPLACE
              ================================================== */}

          <button
            type="button"
            onClick={
              handleInstallBreaker
            }
            disabled={
              selectedSlot === null
            }
            style={{
              padding: "10px",
              width: "100%",

              background:
                selectedSlot === null
                  ? "#222"
                  : "#123b12",

              color:
                selectedSlot === null
                  ? "#777"
                  : "#39ff14",

              border:
                selectedSlot === null
                  ? "1px solid #444"
                  : "1px solid #39ff14",

              borderRadius: "6px",
              fontWeight: 800,

              cursor:
                selectedSlot === null
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {selectedBreaker
              ? "REPLACE BREAKER"
              : "INSTALL BREAKER"}
          </button>

        </div>
      )}


      {/* ======================================================
          PANEL CONTROLS
          ====================================================== */}

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >

        <button
          type="button"
          onClick={onTrip}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ff4040",
            background:
              "linear-gradient(#3b1010,#140000)",
            color: "#ff8080",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          ⚠ TRIP BREAKER
        </button>


        <button
          type="button"
          onClick={onReset}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #39ff14",
            background:
              "linear-gradient(#123b12,#001400)",
            color: "#39ff14",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          🔄 RESET
        </button>

      </div>

    </div>
  );
}