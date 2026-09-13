// Residential Wiring Simulator v3.1
// Component Library
//
// BREAKER DRAG WORKFLOW:
//
// Component Library
//      ↓
// create Breaker
//      ↓
// put JSON into DataTransfer
//      ↓
// put breaker into shared window drag store/event
//      ↓
// BreakerPanelLayout captures breaker synchronously
//      ↓
// panel highlights valid slots
//      ↓
// drop
//      ↓
// breaker becomes pending
//      ↓
// configure
//      ↓
// INSTALL BREAKER
//
// IMPORTANT:
// DROP DOES NOT INSTALL.
// INSTALL BREAKER performs the actual installation.

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
// SHARED BREAKER DRAG EVENTS
// ============================================================

export const BREAKER_DRAG_EVENT =
  "residential-wiring-breaker-drag";

export const BREAKER_DRAG_END_EVENT =
  "residential-wiring-breaker-drag-end";


// ============================================================
// SHARED DRAG STORE
// ============================================================
//
// This is intentionally outside React.
//
// Native browser dragging is not synchronized with React state
// updates reliably enough for dragenter/dragover.
//
// BreakerPanelLayout reads this synchronously through the event.
// ============================================================

let activeDraggedBreaker:
  ReturnType<typeof createLibraryBreaker> | null = null;


// ============================================================
// PUBLIC HELPERS
// ============================================================

export function getActiveDraggedBreaker() {
  return activeDraggedBreaker;
}

export function clearActiveDraggedBreaker(): void {
  activeDraggedBreaker = null;
}


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
// BUILD COMPONENT LIST
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
// COMPONENT LIBRARY
// ============================================================

export default function ComponentLibrary({
  workspaceRef
}: Props) {


  // ==========================================================
  // SEARCH
  // ==========================================================

  const [
    search,
    setSearch
  ] = useState("");


  // ==========================================================
  // OPEN CATEGORIES
  // ==========================================================

  const [
    openCategories,
    setOpenCategories
  ] = useState<string[]>(
    categories
  );


  // ==========================================================
  // ADD NORMAL COMPONENT
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
          previous.includes(category)
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
  // CREATE BREAKER
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
      item.name === "30A Double Pole Breaker"
    ) {

      return createLibraryBreaker(
        30,
        2,
        "STANDARD"
      );

    }


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

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    item: ComponentItem
  ): void {

    console.log(
      "[ComponentLibrary] DRAG START:",
      item.name
    );


    // ========================================================
    // BREAKER
    // ========================================================

    if (
      item.isBreaker
    ) {

      const breaker =
        createBreakerFromItem(
          item
        );


      console.log(
        "[ComponentLibrary] CREATED BREAKER:",
        breaker
      );


      // ------------------------------------------------------
      // CRITICAL:
      // Store synchronously BEFORE dispatching event.
      // ------------------------------------------------------

      activeDraggedBreaker =
        breaker;


      // ------------------------------------------------------
      // SERIALIZE
      // ------------------------------------------------------

      const serialized =
        JSON.stringify(
          breaker
        );


      // ------------------------------------------------------
      // DATA TRANSFER
      // ------------------------------------------------------

      try {

        event.dataTransfer.clearData();

      }

      catch {

        // Firefox may reject clearData in some situations.

      }


      event.dataTransfer.setData(
        "application/json",
        serialized
      );


      event.dataTransfer.setData(
        "breaker",
        serialized
      );


      event.dataTransfer.setData(
        "text/plain",
        serialized
      );


      event.dataTransfer.setData(
        "componentType",
        item.type
      );


      event.dataTransfer.effectAllowed =
        "copy";


      // ------------------------------------------------------
      // CUSTOM EVENT
      // ------------------------------------------------------

      window.dispatchEvent(
        new CustomEvent(
          BREAKER_DRAG_EVENT,
          {
            detail:
              breaker
          }
        )
      );


      console.log(
        "[ComponentLibrary] BREAKER EVENT DISPATCHED"
      );


      // ------------------------------------------------------
      // DRAG IMAGE
      // ------------------------------------------------------

      try {

        const dragImage =
          document.createElement(
            "div"
          );


        dragImage.textContent =
          `${breaker.amperage}A Breaker`;


        dragImage.style.position =
          "absolute";

        dragImage.style.top =
          "-1000px";

        dragImage.style.left =
          "-1000px";

        dragImage.style.padding =
          "8px 12px";

        dragImage.style.background =
          "#063b2d";

        dragImage.style.color =
          "#00ff99";

        dragImage.style.border =
          "2px solid #00ff99";

        dragImage.style.borderRadius =
          "6px";

        dragImage.style.fontWeight =
          "bold";

        dragImage.style.pointerEvents =
          "none";

        document.body.appendChild(
          dragImage
        );


        event.dataTransfer.setDragImage(
          dragImage,
          10,
          10
        );


        window.setTimeout(
          () => {

            dragImage.remove();

          },
          0
        );

      }

      catch (
        error
      ) {

        console.warn(
          "[ComponentLibrary] drag image failed:",
          error
        );

      }


      return;

    }


    // ========================================================
    // NORMAL COMPONENT
    // ========================================================

    activeDraggedBreaker =
      null;


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

  function handleDragEnd(): void {

    console.log(
      "[ComponentLibrary] DRAG END"
    );


    // IMPORTANT:
    // Do NOT call event.dataTransfer.getData().
    //
    // The browser protects the drag data store during dragend
    // and getData is not reliable there.

    if (
      activeDraggedBreaker
    ) {

      console.log(
        "[ComponentLibrary] CLEARING BREAKER DRAG"
      );

      activeDraggedBreaker =
        null;


      window.dispatchEvent(
        new Event(
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
  // FILTER
  // ==========================================================

  function getFilteredItems(
    category: string
  ): ComponentItem[] {

    return components.filter(
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

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{

        padding:
          "15px",

        height:
          "100%",

        overflowY:
          "auto",

        overflowX:
          "hidden",

        background:
          "#252526",

        color:
          "white"

      }}
    >

      <h2
        style={{
          marginTop: 0
        }}
      >
        Components
      </h2>


      <input
        type="text"

        placeholder="Search components..."

        value={
          search
        }

        onChange={
          event =>
            setSearch(
              event.target.value
            )
        }

        style={{

          width:
            "100%",

          boxSizing:
            "border-box",

          padding:
            "8px",

          marginBottom:
            "15px",

          background:
            "#1e1e1e",

          border:
            "1px solid #555",

          color:
            "white",

          borderRadius:
            "4px"

        }}
      />


      {categories.map(
        category => {

          const items =
            getFilteredItems(
              category
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
              key={
                category
              }

              style={{
                marginBottom:
                  "12px"
              }}
            >

              <div
                onClick={() =>
                  toggleCategory(
                    category
                  )
                }

                style={{

                  cursor:
                    "pointer",

                  fontWeight:
                    "bold",

                  padding:
                    "10px",

                  background:
                    "#333",

                  borderRadius:
                    "5px"

                }}
              >

                {isOpen
                  ? "▼"
                  : "▶"
                }

                {" "}

                {category}

              </div>


              {isOpen &&
                items.map(
                  item => (

                    <div
                      key={
                        item.name
                      }

                      draggable={
                        true
                      }

                      onDragStart={
                        event =>
                          handleDragStart(
                            event,
                            item
                          )
                      }

                      onDragEnd={
                        handleDragEnd
                      }

                      onClick={() => {

                        if (
                          !item.isBreaker
                        ) {

                          add(
                            item.type
                          );

                        }

                      }}

                      style={{

                        marginTop:
                          "8px",

                        padding:
                          "12px",

                        background:
                          "#1e1e1e",

                        border:
                          item.isBreaker
                            ? "1px solid #00eaff"
                            : "1px solid #555",

                        borderRadius:
                          "8px",

                        cursor:
                          "grab",

                        userSelect:
                          "none",

                        WebkitUserSelect:
                          "none",

                        touchAction:
                          "none"

                      }}
                    >

                      <div
                        style={{

                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            "10px"

                        }}
                      >

                        <div
                          style={{

                            width:
                              "45px",

                            height:
                              "45px",

                            background:
                              "#ddd",

                            color:
                              "#111",

                            borderRadius:
                              "6px",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            fontSize:
                              "22px",

                            fontWeight:
                              "bold",

                            flexShrink:
                              0

                          }}
                        >

                          {getIcon(
                            item.symbol
                          )}

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


                      <div
                        style={{

                          marginTop:
                            "8px",

                          fontSize:
                            "11px",

                          color:
                            "#888"

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


                      <div
                        style={{

                          marginTop:
                            "8px",

                          fontSize:
                            "11px",

                          color:
                            "#00eaff"

                        }}
                      >

                        {item.isBreaker
                          ? "Drag into breaker panel slot"
                          : "Click to place • Drag to workspace"
                        }

                      </div>

                    </div>

                  )
                )}

            </div>

          );

        }
      )}

    </div>

  );

}