// Residential Wiring Simulator v2.7
// Component Library
//
// Handles:
// - component browsing
// - search
// - category filtering
// - click placement
// - drag placement preparation
//
// Breaker drag workflow:
// 1. Create a complete Breaker object.
// 2. Keep the normal dataTransfer payload.
// 3. Publish the breaker through a browser CustomEvent.
// 4. BreakerPanelLayout listens for that event.
// 5. The panel can therefore highlight valid slots during drag.
//
// This preserves normal workspace drag behavior while fixing
// breaker-panel drag highlighting.

import {
  useState
} from "react";

import type {
  DragEvent
} from "react";

import type {
  WorkspaceHandle
} from "../simulator/Workspace";

import {
  componentCatalog
} from "../electrical/componentCatalog";

import {
  createLibraryBreaker
} from "../electrical/breaker";


// ============================================================
// PROPS
// ============================================================

interface Props {

  workspaceRef:
    React.RefObject<WorkspaceHandle | null>;

}


// ============================================================
// COMPONENT ITEM
// ============================================================

type ComponentItem = {

  name: string;

  type: string;

  category: string;

  description: string;

  symbol: string;

  voltage?: number;

  watts?: number;

  amps?: number;

  isBreaker: boolean;

};


// ============================================================
// COMPONENT DESCRIPTIONS
// ============================================================

function getComponentDescription(
  name: string
): string {

  switch (name) {

    case "Service Entrance":
      return "Main electrical service connection.";

    case "Breaker Panel":
      return "Residential breaker distribution panel.";

    case "Sub Panel":
      return "Secondary breaker distribution panel.";

    case "15A Breaker":
      return "15 amp single-pole circuit breaker.";

    case "20A Breaker":
      return "20 amp single-pole circuit breaker.";

    case "30A Double Pole Breaker":
      return "30 amp two-pole 240V circuit breaker.";

    case "Receptacle":
      return "Standard 120V electrical receptacle.";

    case "GFCI Receptacle":
      return "Ground-fault protected receptacle.";

    case "Single Pole Switch":
      return "Standard single-pole light switch.";

    case "Three Way Switch":
      return "Three-way lighting control switch.";

    case "Light":
      return "Standard 120V lighting load.";

    case "LED Light":
      return "Low-power LED lighting load.";

    case "Motor":
      return "120V motor load.";

    case "Water Heater":
      return "240V electric water heater.";

    case "Electric Range":
      return "240V electric cooking appliance.";

    case "Dryer":
      return "240V electric clothes dryer.";

    case "HVAC":
      return "240V HVAC equipment load.";

    case "Thermostat":
      return "Low-voltage HVAC control.";

    case "Junction Box":
      return "Electrical junction and wiring point.";

    default:
      return "Electrical component.";

  }

}


// ============================================================
// BUILD UI COMPONENT LIST
// ============================================================

const components: ComponentItem[] =
  componentCatalog.map(
    component => ({

      name:
        component.name,

      type:
        component.name,

      category:
        component.category,

      description:
        getComponentDescription(
          component.name
        ),

      symbol:
        component.symbol,

      voltage:
        component.electrical?.voltage,

      watts:
        component.electrical?.watts,

      amps:
        component.electrical?.amps,

      isBreaker:
        component.type === "Breaker"

    })
  );


// ============================================================
// CATEGORIES
// ============================================================

const categories: string[] = [
  ...new Set(
    componentCatalog.map(
      component =>
        component.category
    )
  )
];


// ============================================================
// BREAKER DRAG EVENT
// ============================================================
//
// BreakerPanelLayout listens for this event.
//
// The event contains the complete Breaker object.
//
// We intentionally use a string event name so both components
// remain independent and do not need to import each other.
// ============================================================

const BREAKER_DRAG_EVENT =
  "residential-wiring-breaker-drag";

const BREAKER_DRAG_END_EVENT =
  "residential-wiring-breaker-drag-end";


// ============================================================
// COMPONENT LIBRARY
// ============================================================

export default function ComponentLibrary({
  workspaceRef
}: Props) {


  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  const [
    search,
    setSearch
  ] = useState<string>("");


  // ----------------------------------------------------------
  // OPEN CATEGORIES
  // ----------------------------------------------------------

  const [
    openCategories,
    setOpenCategories
  ] = useState<string[]>(
    categories
  );


  // ==========================================================
  // ADD COMPONENT
  // ==========================================================

  function add(
    type: string
  ): void {

    workspaceRef.current?.addDevice(
      type
    );

  }


  // ==========================================================
  // TOGGLE CATEGORY
  // ==========================================================

  function toggleCategory(
    category: string
  ): void {

    setOpenCategories(
      previous => {

        if (
          previous.includes(
            category
          )
        ) {

          return previous.filter(
            item =>
              item !== category
          );

        }

        return [
          ...previous,
          category
        ];

      }
    );

  }


  // ==========================================================
  // CREATE BREAKER FOR DRAG
  // ==========================================================

  function createBreakerFromItem(
    item: ComponentItem
  ) {

    if (
      item.name === "15A Breaker"
    ) {

      return createLibraryBreaker(
        15,
        1,
        "STANDARD"
      );

    }


    if (
      item.name === "20A Breaker"
    ) {

      return createLibraryBreaker(
        20,
        1,
        "STANDARD"
      );

    }


    if (
      item.name ===
      "30A Double Pole Breaker"
    ) {

      return createLibraryBreaker(
        30,
        2,
        "STANDARD"
      );

    }


    /*
     * Fallback for future breaker catalog entries.
     */

    return createLibraryBreaker(
      item.amps ?? 20,
      item.name.includes(
        "Double Pole"
      )
        ? 2
        : 1,
      "STANDARD"
    );

  }


  // ==========================================================
  // DRAG START
  // ==========================================================

  function dragStart(
    event: DragEvent<HTMLDivElement>,
    item: ComponentItem
  ): void {

    // --------------------------------------------------------
    // BREAKER DRAG
    // --------------------------------------------------------

    if (
      item.isBreaker
    ) {

      const breaker =
        createBreakerFromItem(
          item
        );


      /*
       * Keep the original dataTransfer payload.
       *
       * This is still used by the drop handler.
       */

      event.dataTransfer.setData(
        "breaker",
        JSON.stringify(
          breaker
        )
      );


      event.dataTransfer.effectAllowed =
        "copy";


      /*
       * IMPORTANT:
       *
       * Browsers do not reliably expose custom dataTransfer
       * values during dragover.
       *
       * Publish the breaker separately so the panel can learn
       * about the breaker immediately when dragging begins.
       */

      window.dispatchEvent(
        new CustomEvent(
          BREAKER_DRAG_EVENT,
          {
            detail: breaker
          }
        )
      );


      return;

    }


    // --------------------------------------------------------
    // NORMAL DEVICE DRAG
    // --------------------------------------------------------

    event.dataTransfer.setData(
      "componentType",
      item.type
    );


    event.dataTransfer.effectAllowed =
      "copy";

  }


  // ==========================================================
  // DRAG END
  // ==========================================================

  function dragEnd(
    item: ComponentItem
  ): void {

    /*
     * Only breaker drags need to clear the panel's
     * special breaker-drag state.
     */

    if (
      item.isBreaker
    ) {

      window.dispatchEvent(
        new CustomEvent(
          BREAKER_DRAG_END_EVENT
        )
      );

    }

  }


  // ==========================================================
  // ICON
  // ==========================================================

  function getIcon(
    symbol: string
  ): string {

    switch (symbol) {

      case "breaker-panel":
        return "⚡";

      case "switch-single":
        return "◐";

      case "light-ceiling":
        return "💡";

      case "outlet":
        return "🔌";

      case "gfci":
        return "GFCI";

      case "range":
        return "🔥";

      case "fan":
        return "🌀";

      case "hvac":
        return "❄";

      default:
        return symbol || "▣";

    }

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{

        padding: "15px",

        height: "100%",

        overflowY: "auto",

        overflowX: "hidden",

        background: "#252526",

        color: "white"

      }}
    >

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <h2
        style={{
          marginTop: 0
        }}
      >
        Components
      </h2>


      {/* ================================================== */}
      {/* SEARCH */}
      {/* ================================================== */}

      <input
        type="text"

        placeholder="Search components..."

        value={search}

        onChange={
          event => {

            setSearch(
              event.target.value
            );

          }
        }

        style={{

          width: "100%",

          boxSizing: "border-box",

          padding: "8px",

          marginBottom: "15px",

          background: "#1e1e1e",

          border: "1px solid #555",

          color: "white",

          borderRadius: "4px"

        }}
      />


      {/* ================================================== */}
      {/* CATEGORIES */}
      {/* ================================================== */}

      {
        categories.map(
          category => {

            const items =
              components.filter(
                component => {

                  const matchesCategory =
                    component.category ===
                    category;

                  const matchesSearch =
                    component.name
                      .toLowerCase()
                      .includes(
                        search.toLowerCase()
                      );

                  return (
                    matchesCategory &&
                    matchesSearch
                  );

                }
              );


            if (
              items.length === 0
            ) {

              return null;

            }


            const isOpen =
              openCategories.includes(
                category
              );


            return (

              <div
                key={category}
                style={{
                  marginBottom: "12px"
                }}
              >

                {/* ====================================== */}
                {/* CATEGORY HEADER */}
                {/* ====================================== */}

                <div
                  onClick={() =>
                    toggleCategory(
                      category
                    )
                  }

                  style={{

                    cursor: "pointer",

                    fontWeight: "bold",

                    padding: "10px",

                    background: "#333",

                    borderRadius: "5px"

                  }}
                >

                  {isOpen
                    ? "▼"
                    : "▶"
                  }

                  {" "}

                  {category}

                </div>


                {/* ====================================== */}
                {/* COMPONENT ITEMS */}
                {/* ====================================== */}

                {isOpen &&

                  items.map(
                    item => (

                      <div
                        key={item.name}

                        draggable={true}

                        onDragStart={
                          event =>
                            dragStart(
                              event,
                              item
                            )
                        }

                        onDragEnd={() =>
                          dragEnd(
                            item
                          )
                        }

                        onClick={() =>
                          add(
                            item.type
                          )
                        }

                        style={{

                          marginTop: "8px",

                          padding: "12px",

                          background:
                            "#1e1e1e",

                          border:
                            "1px solid #555",

                          borderRadius: "8px",

                          cursor: "grab",

                          userSelect: "none"

                        }}
                      >

                        {/* ================================= */}
                        {/* COMPONENT HEADER */}
                        {/* ================================= */}

                        <div
                          style={{

                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap: "10px"

                          }}
                        >

                          <div
                            style={{

                              width: "45px",

                              height: "45px",

                              background: "#ddd",

                              color: "#111",

                              borderRadius:
                                "6px",

                              display:
                                "flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              fontSize: "22px",

                              fontWeight:
                                "bold",

                              flexShrink: 0

                            }}
                          >

                            {
                              getIcon(
                                item.symbol
                              )
                            }

                          </div>


                          <div>

                            <div
                              style={{
                                fontWeight:
                                  "bold"
                              }}
                            >
                              {item.name}
                            </div>


                            <div
                              style={{

                                fontSize:
                                  "12px",

                                color:
                                  "#aaa",

                                marginTop:
                                  "3px"

                              }}
                            >
                              {item.description}
                            </div>

                          </div>

                        </div>


                        {/* ================================= */}
                        {/* ELECTRICAL INFORMATION */}
                        {/* ================================= */}

                        <div
                          style={{

                            marginTop: "8px",

                            fontSize: "11px",

                            color: "#888"

                          }}
                        >

                          {item.voltage !==
                            undefined && (

                            <span>
                              {item.voltage}V{" "}
                            </span>

                          )}


                          {item.amps !==
                            undefined && (

                            <span>
                              {item.amps}A{" "}
                            </span>

                          )}


                          {item.watts !==
                            undefined && (

                            <span>
                              {item.watts}W
                            </span>

                          )}

                        </div>


                        {/* ================================= */}
                        {/* PLACEMENT INSTRUCTION */}
                        {/* ================================= */}

                        <div
                          style={{

                            marginTop: "8px",

                            fontSize: "11px",

                            color: "#00eaff"

                          }}
                        >

                          {item.isBreaker
                            ? "Drag into breaker panel slot"
                            : "Click to place • Drag to workspace"
                          }

                        </div>

                      </div>

                    )
                  )

                }

              </div>

            );

          }
        )
      }

    </div>

  );

}