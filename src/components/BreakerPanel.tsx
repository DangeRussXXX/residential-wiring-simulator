type BreakerPanelProps = {
  circuitStatus?: "READY" | "WARNING" | "FAULT";
};


export default function BreakerPanel({
  circuitStatus = "READY",
}: BreakerPanelProps) {

  const isFault = circuitStatus === "FAULT";
  const isWarning = circuitStatus === "WARNING";

  const indicatorColor =
    isFault
      ? "#ff4040"
      : isWarning
      ? "#ffd700"
      : "#39ff14";


  return (
    <div
      style={{
        margin: "15px 30px",
        padding: "18px 25px",
        background:
          "linear-gradient(145deg, #111827, #050505)",
        border: "1px solid #176070",
        borderRadius: "10px",
        color: "#fff",
        fontFamily: "monospace",
        boxShadow:
          "0 0 15px rgba(0,234,255,.15)",
      }}
    >

      {/* Panel Header */}
      <h3
        style={{
          margin: "0 0 15px 0",
          color: "#00eaff",
          letterSpacing: "2px",
          fontSize: "18px",
        }}
      >
        ⚡ MAIN ELECTRICAL PANEL
      </h3>



      {/* Panel Readings */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "200px 1fr 120px",
          gap: "12px",
          fontSize: "15px",
          alignItems: "center",
        }}
      >

        {/* Main Breaker */}
        <span>
          MAIN BREAKER
        </span>

        <span
          style={{
            color: indicatorColor,
            fontWeight: "bold",
          }}
        >
          ● {isFault ? "OFF" : "ON"}
        </span>

        <span>
          {isFault ? "TRIPPED" : "240V"}
        </span>



        {/* Circuit 1 */}
        <span>
          CIRCUIT 1
        </span>

        <span
          style={{
            color: "#39ff14",
          }}
        >
          ● LIGHTING
        </span>

        <span>
          120V | 3.2A
        </span>



        {/* Circuit 2 */}
        <span>
          CIRCUIT 2
        </span>

        <span
          style={{
            color: isWarning
              ? "#ffd700"
              : "#39ff14",
          }}
        >
          ● OUTLETS
        </span>

        <span>
          120V | 5.8A
        </span>



        {/* Circuit 3 */}
        <span>
          CIRCUIT 3
        </span>

        <span
          style={{
            color: isFault
              ? "#ff4040"
              : "#39ff14",
          }}
        >
          ● GFCI
        </span>

        <span>
          {isFault
            ? "DISABLED"
            : "120V | 0.0A"}
        </span>

      </div>


      {/* Warning Message */}
      {isWarning && (
        <div
          style={{
            marginTop: "15px",
            color: "#ffd700",
            fontWeight: "bold",
          }}
        >
          ⚠ CHECK CONNECTIONS BEFORE ENERGIZING
        </div>
      )}


      {/* Fault Message */}
      {isFault && (
        <div
          style={{
            marginTop: "15px",
            color: "#ff4040",
            fontWeight: "bold",
          }}
        >
          ⚠ SAFETY LOCKOUT ACTIVE — RESET BREAKER REQUIRED
        </div>
      )}

    </div>
  );
}