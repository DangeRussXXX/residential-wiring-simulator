export default function TopToolbar() {
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

      {/* flowing electricity line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          width: "100%",
          background:
            "linear-gradient(90deg, transparent, #00eaff, transparent)",
          animation: "electricFlow 2s linear infinite",
        }}
      />


      {/* LEFT - Simulator Name */}
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



      {/* CENTER - Creator + System Status */}
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

        {/* Creator link */}
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
            color: "#9eefff",
            letterSpacing: "1px",
          }}
        >
          <span
            style={{
              height: "10px",
              width: "10px",
              borderRadius: "50%",
              background: "#39ff14",
              display: "inline-block",
            }}
          />

          SYSTEM READY | 120V AC | FAULTS: 0
        </div>

      </div>



      {/* RIGHT - Controls */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px",
        }}
      >

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
              border: "1px solid #176070",
              background:
                "linear-gradient(#17202b, #080b10)",
              color: "#9eefff",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              letterSpacing: "1px",
              transition: "all .2s ease",
            }}

            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "#00eaff";

              e.currentTarget.style.color =
                "#001018";

              e.currentTarget.style.border =
                "1px solid #00eaff";

              e.currentTarget.style.boxShadow =
                "0 0 12px rgba(0,234,255,.6)";
            }}

            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(#17202b, #080b10)";

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
            }

            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>

    </div>
  );
}