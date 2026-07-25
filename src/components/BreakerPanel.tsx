import type { BreakerPanel as BreakerPanelType } from "../electrical/breakerPanel";


type BreakerPanelProps = {
  panel: BreakerPanelType;

  circuitStatus?: 
    | "READY"
    | "WARNING"
    | "FAULT";

  onTrip?: () => void;

  onReset?: () => void;
};



export default function BreakerPanel({
  panel,
  circuitStatus = "READY",
  onTrip,
  onReset,
}: BreakerPanelProps) {


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



  return (

    <div
      style={{
        background:
          "linear-gradient(135deg,#111827,#050505)",
        border:"1px solid #176070",
        borderRadius:"10px",
        padding:"15px",
        color:"white",
        display:"flex",
        flexDirection:"column",
        gap:"12px",
      }}
    >


      <h3
        style={{
          margin:0,
          color:"#00eaff",
          letterSpacing:"1px",
        }}
      >
        ⚡ Main Breaker Panel
      </h3>



      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
        }}
      >

        <span>
          {panel.name}
        </span>


        <span
          style={{
            color:statusColor,
            fontWeight:800,
          }}
        >
          ● {statusText}
        </span>

      </div>




      <div
        style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          gap:"10px",
        }}
      >


        <div
          style={{
            background:"#080b10",
            padding:"10px",
            borderRadius:"6px",
            border:"1px solid #176070",
          }}
        >

          Main Breaker

          <br/>

          <strong>
            {panel.mainBreaker}A
          </strong>

        </div>



        <div
          style={{
            background:"#080b10",
            padding:"10px",
            borderRadius:"6px",
            border:"1px solid #176070",
          }}
        >

          Circuits

          <br/>

          <strong>
            12
          </strong>

        </div>


      </div>




      <div
        style={{
          display:"flex",
          gap:"10px",
        }}
      >


        <button
          onClick={onTrip}
          style={{
            flex:1,
            padding:"10px",
            borderRadius:"6px",
            border:"1px solid #ff4040",
            background:
              "linear-gradient(#3b1010,#140000)",
            color:"#ff8080",
            fontWeight:800,
            cursor:"pointer",
          }}
        >
          ⚠ TRIP BREAKER
        </button>




        <button
          onClick={onReset}
          style={{
            flex:1,
            padding:"10px",
            borderRadius:"6px",
            border:"1px solid #39ff14",
            background:
              "linear-gradient(#123b12,#001400)",
            color:"#39ff14",
            fontWeight:800,
            cursor:"pointer",
          }}
        >
          🔄 RESET
        </button>


      </div>


    </div>

  );

}