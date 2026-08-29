import { useState } from "react";

import type {
  BreakerPanel as BreakerPanelType
} from "../electrical/breakerPanel";

import type {
  BreakerType,
  Breaker
} from "../electrical/breaker";

import type {
  BreakerPoles
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
  60
];


const breakerTypes: {
  value: BreakerType;
  label: string;
}[] = [

  {
    value: "STANDARD",
    label: "Standard"
  },

  {
    value: "GFCI",
    label: "GFCI"
  },

  {
    value: "AFCI",
    label: "AFCI"
  },

  {
    value: "DUAL_FUNCTION",
    label: "AFCI/GFCI Combo"
  }

];


const poleOptions: {
  value: BreakerPoles;
  label: string;
}[] = [

  {
    value: 1,
    label: "1 Pole — 120V"
  },

  {
    value: 2,
    label: "2 Pole — 240V"
  }

];


function getBreakerDisplayName(
  breaker: Breaker
): string {

  if (
    breaker.breakerType ===
    "DUAL_FUNCTION"
  ) {

    return "AFCI/GFCI";

  }

  return breaker.breakerType;

}


export default function BreakerPanel({

  panel,

  circuitStatus = "READY",

  onTrip,

  onReset,

  onInstallBreaker,

  onRemoveBreaker

}: BreakerPanelProps) {


  const [
    selectedSlot,
    setSelectedSlot
  ] = useState<number | null>(null);


  const [
    selectedAmperage,
    setSelectedAmperage
  ] = useState<number>(20);


  const [
    selectedType,
    setSelectedType
  ] = useState<BreakerType>(
    "STANDARD"
  );


  const [
    selectedPoles,
    setSelectedPoles
  ] = useState<BreakerPoles>(1);


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
   * Find the breaker represented by
   * the currently selected slot.
   *
   * For a 2-pole breaker, the second
   * occupied slot references the same
   * breaker object.
   */

  const selectedBreaker =
    selectedSlot !== null
      ? (
          panel.breakers.find(
            slot =>
              slot.slot === selectedSlot &&
              slot.installed &&
              slot.breaker
          )?.breaker
          ??
          panel.breakers.find(
            slot =>
              slot.installed &&
              slot.breaker &&
              slot.breaker.poles === 2 &&
              (
                slot.slot === selectedSlot ||
                slot.slot + 1 === selectedSlot
              )
          )?.breaker
          ??
          null
        )
      : null;


  /*
   * Determine the actual starting slot
   * of the selected breaker.
   */

  const selectedBreakerStartSlot =
    selectedBreaker && selectedSlot !== null
      ? (
          panel.breakers.find(
            slot =>
              slot.breaker?.id ===
              selectedBreaker.id
          )?.slot
          ?? selectedSlot
        )
      : selectedSlot;


  /*
   * Remove the selected breaker.
   *
   * For a two-pole breaker this passes
   * the starting physical slot to the
   * parent so the complete breaker can
   * be removed.
   */

  function handleRemoveBreaker(): void {

    if (
      selectedBreakerStartSlot === null ||
      !selectedBreaker
    ) {

      return;

    }


    onRemoveBreaker?.(
      selectedBreakerStartSlot
    );


    setSelectedSlot(
      null
    );

  }


  return (

    <div
      style={{
        background:
          "linear-gradient(135deg,#111827,#050505)",

        border:
          "1px solid #176070",

        borderRadius: "10px",

        padding: "15px",

        color: "white",

        display: "flex",

        flexDirection: "column",

        gap: "12px"
      }}
    >

      {/* ======================================================
          PANEL HEADER
          ====================================================== */}

      <h3
        style={{
          margin: 0,
          color: "#00eaff",
          letterSpacing: "1px"
        }}
      >
        ⚡ {panel.name}
      </h3>


      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >

        <span>
          {panel.manufacturer ?? "Generic"}{" "}
          {panel.model ?? "Residential Load Center"}
        </span>

        <span
          style={{
            color: statusColor,
            fontWeight: 800
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
          gap: "10px"
        }}
      >

        {/* MAIN BREAKER */}

        <div
          style={{
            background: "#080b10",
            padding: "10px",
            borderRadius: "6px",
            border:
              "1px solid #176070"
          }}
        >

          Main Breaker

          <br />

          <strong>
            {panel.mainBreaker}A
          </strong>

        </div>


        {/* PANEL SPACES */}

        <div
          style={{
            background: "#080b10",
            padding: "10px",
            borderRadius: "6px",
            border:
              "1px solid #176070"
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
          gap: "8px"
        }}
      >

        {panel.breakers.map(slot => (

          <div
            key={slot.id}

            onClick={() =>
              setSelectedSlot(
                slot.slot
              )
            }

            style={{

              background:
                slot.installed
                  ? "#123b12"
                  : selectedSlot ===
                    slot.slot
                  ? "#17202b"
                  : "#080b10",

              border:
                selectedSlot ===
                slot.slot
                  ? "2px solid #00eaff"
                  : slot.installed
                  ? "1px solid #39ff14"
                  : "1px solid #176070",

              borderRadius: "6px",

              padding: "8px",

              textAlign: "center",

              fontSize: "12px",

              cursor: "pointer",

              transition: ".2s"
            }}
          >

            <div>
              SLOT {slot.slot}
            </div>


            <div
              style={{
                marginTop: "5px",

                color:
                  slot.installed
                    ? "#39ff14"
                    : "#777",

                fontWeight: 800
              }}
            >

              {slot.installed &&
              slot.breaker

                ? (
                  <>
                    {slot.breaker.amperage}A{" "}
                    {getBreakerDisplayName(
                      slot.breaker
                    )}

                    <br />

                    {slot.breaker.poles === 2
                      ? "240V"
                      : "120V"}
                  </>
                )

                : "EMPTY"}

            </div>

          </div>

        ))}

      </div>


      {/* ======================================================
          SELECTED SLOT
          ====================================================== */}

      {selectedSlot !== null && (

        <div
          style={{
            background: "#080b10",
            border:
              "1px solid #176070",
            borderRadius: "8px",
            padding: "12px"
          }}
        >

          <h4
            style={{
              marginTop: 0
            }}
          >
            Slot {selectedSlot}
          </h4>


          {/* ==================================================
              EXISTING BREAKER
              ================================================== */}

          {selectedBreaker && (

            <div
              style={{
                background: "#123b12",
                border:
                  "1px solid #39ff14",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "12px"
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

              <button
                onClick={
                  handleRemoveBreaker
                }

                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "8px",
                  background:
                    "#3b1010",
                  color: "#ff8080",
                  border:
                    "1px solid #ff4040",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: 800
                }}
              >
                REMOVE BREAKER
              </button>

            </div>

          )}


          {/* ==================================================
              BREAKER SIZE
              ================================================== */}

          <label>
            Breaker Size
          </label>

          <select
            value={selectedAmperage}

            onChange={e =>
              setSelectedAmperage(
                Number(
                  e.target.value
                )
              )
            }

            style={{
              width: "100%",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border:
                "1px solid #176070",
              borderRadius: "5px"
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

          <label>
            Breaker Type
          </label>

          <select
            value={selectedType}

            onChange={e =>
              setSelectedType(
                e.target.value as BreakerType
              )
            }

            style={{
              width: "100%",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border:
                "1px solid #176070",
              borderRadius: "5px"
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

          <label>
            Breaker Poles
          </label>

          <select
            value={selectedPoles}

            onChange={e => {

              const value =
                Number(
                  e.target.value
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
              border:
                "1px solid #176070",
              borderRadius: "5px"
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
              border:
                "1px solid #176070"
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
            onClick={() => {

              if (
                selectedSlot === null
              ) {

                return;

              }


              onInstallBreaker?.({

                slot:
                  selectedSlot,

                amperage:
                  selectedAmperage,

                breakerType:
                  selectedType,

                poles:
                  selectedPoles

              });

            }}

            style={{
              padding: "10px",
              width: "100%",
              background: "#123b12",
              color: "#39ff14",
              border:
                "1px solid #39ff14",
              borderRadius: "6px",
              fontWeight: 800,
              cursor: "pointer"
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
          gap: "10px"
        }}
      >

        <button
          onClick={onTrip}

          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border:
              "1px solid #ff4040",
            background:
              "linear-gradient(#3b1010,#140000)",
            color: "#ff8080",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          ⚠ TRIP BREAKER
        </button>


        <button
          onClick={onReset}

          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border:
              "1px solid #39ff14",
            background:
              "linear-gradient(#123b12,#001400)",
            color: "#39ff14",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          🔄 RESET
        </button>

      </div>

    </div>

  );

}