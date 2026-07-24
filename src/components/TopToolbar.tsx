type TopToolbarProps = {
  circuitStatus?: "READY" | "WARNING" | "FAULT";
  onResetBreaker?: () => void;
};


export default function TopToolbar({
  circuitStatus = "READY",
  onResetBreaker,
}: TopToolbarProps) {


  const statusColor =
    circuitStatus === "FAULT"
      ? "#ff4040"
      : circuitStatus === "WARNING"
      ? "#ffd700"
      : "#39ff14";


  const statusText =
    circuitStatus === "FAULT"
      ? "⚠ BREAKER TRIPPED | CIRCUIT FAULT"
      : circuitStatus === "WARNING"
      ? "⚡ CHECK CONNECTIONS | INCOMPLETE"
      : "⚡ SYSTEM READY | 120V AC | FAULTS: 0";


  const flowColor =
    circuitStatus === "FAULT"
      ? "#ff4040"
      : circuitStatus === "WARNING"
      ? "#ffd700"
      : "#00eaff";


  const flowSpeed =
    circuitStatus === "FAULT"
      ? "0.6s"
      : circuitStatus === "WARNING"
      ? "1s"
      : "2s";


  return (
    <div
      style={{
        position: "relative",
        height: "85px",
        display: "flex",
        alignItems: "center",
        padding: "0 30px",
        background:
          "linear-gradient(90deg, #050505, #111827, #050505)",
        borderBottom: "1px solid #1c5360",
        overflow: "hidden",
        color: "#fff",
      }}
    >

      {/* Electrical current flow */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          width: "100%",
          background:
            `linear-gradient(90deg, transparent, ${flowColor}, transparent)`,
          animation:
            `electricFlow ${flowSpeed} linear infinite`,
        }}
      />



      {/* LEFT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >

        <h2
          style={{
            margin: 0,
            fontSize: "26px",
            letterSpacing: "1.5px",
            fontWeight: "900",
            color: "#00eaff",
            whiteSpace: "nowrap",
          }}
        >
          ⚡ Residential Wiring Simulator
        </h2>

      </div>




      {/* CENTER */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
        }}
      >


        {/* Creator Link */}
        <div
          onClick={() =>
            window.open(
              "https://dangerussxxx.github.io/DangeRussZone/",
              "_blank"
            )
          }

          style={{
            color: "#39ff14",
            fontSize: "17px",
            fontWeight: "800",
            letterSpacing: "1px",
            cursor: "pointer",
            transition: "all .2s ease",
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#00eaff";
            e.currentTarget.style.textShadow =
              "0 0 8px #00eaff";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#39ff14";
            e.currentTarget.style.textShadow = "none";
          }}
        >
          ⚡ Created By DangeRuss ⚡
        </div>




        {/* System Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: statusColor,
            letterSpacing: "1px",
            fontWeight: "700",
          }}
        >

          <span
            style={{
              height: "10px",
              width: "10px",
              borderRadius: "50%",
              background: statusColor,
              display: "inline-block",
              boxShadow:
                `0 0 8px ${statusColor}`,
            }}
          />

          {statusText}

        </div>

      </div>





      {/* RIGHT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px",
        }}
      >


        {circuitStatus === "FAULT" && (
          <button
            onClick={onResetBreaker}

            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border:
                "1px solid #ff4040",
              background:
                "linear-gradient(#3b1010,#140000)",
              color: "#ff8080",
              fontWeight: "800",
              cursor: "pointer",
              letterSpacing: "1px",
            }}
          >
            🔄 RESET BREAKER
          </button>
        )}





        {["Save", "Load", "Print", "Lessons"].map((item) => (

          <button
            key={item}

            onClick={
              item === "Print"
                ? () => window.print()
                : undefined
            }

            style={{
              padding: "12px 22px",
              minWidth: "95px",
              borderRadius: "8px",
              border:
                "1px solid #176070",
              background:
                "linear-gradient(#17202b,#080b10)",
              color: "#9eefff",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "1px",
              transition: "all .2s ease",
            }}


            onMouseEnter={(e)=>{

              e.currentTarget.style.background =
                "#00eaff";

              e.currentTarget.style.color =
                "#001018";

              e.currentTarget.style.border =
                "1px solid #00eaff";

              e.currentTarget.style.boxShadow =
                "0 0 12px rgba(0,234,255,.6)";

            }}


            onMouseLeave={(e)=>{

              e.currentTarget.style.background =
                "linear-gradient(#17202b,#080b10)";

              e.currentTarget.style.color =
                "#9eefff";

              e.currentTarget.style.border =
                "1px solid #176070";

              e.currentTarget.style.boxShadow =
                "none";

            }}

          >

            {item}

          </button>

        ))}


      </div>





      <style>
        {`
          @keyframes electricFlow {

            0% {
              transform: translateX(-100%);
              opacity: .4;
            }

            50% {
              opacity: 1;
            }

            100% {
              transform: translateX(100%);
              opacity: .4;
            }

          }
        `}
      </style>


    </div>
  );
}