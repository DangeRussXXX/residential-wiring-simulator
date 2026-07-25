import MenuBar from "./MenuBar";
import { menuData } from "./menuData";
import { executeMenuAction } from "./menuActions";


type ToolbarProps = {
  circuitStatus?: "READY" | "WARNING" | "FAULT";
  onResetBreaker?: () => void;
};


export default function Toolbar({
  circuitStatus = "READY",
  onResetBreaker,
}: ToolbarProps) {


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


  return (
    <>
      <div
        style={{
          position:"relative",
          height:"85px",
          display:"flex",
          alignItems:"center",
          padding:"0 30px",
          background:
            "linear-gradient(90deg,#050505,#111827,#050505)",
          borderBottom:"1px solid #1c5360",
          overflow:"hidden",
          color:"white",
        }}
      >

        {/* electric flow */}
        <div
          style={{
            position:"absolute",
            bottom:0,
            left:0,
            height:"3px",
            width:"100%",
            background:
              `linear-gradient(90deg,transparent,${flowColor},transparent)`,
            animation:
              "electricFlow 2s linear infinite",
          }}
        />


        {/* LEFT */}

        <div
          style={{
            flex:1,
            display:"flex",
            alignItems:"center",
          }}
        >

          <h2
            style={{
              margin:0,
              color:"#00eaff",
              fontSize:"26px",
              fontWeight:900,
              letterSpacing:"1.5px",
              whiteSpace:"nowrap",
            }}
          >
            ⚡ Residential Wiring Simulator
          </h2>

        </div>



        {/* CENTER */}

        <div
          style={{
            flex:1,
            display:"flex",
            flexDirection:"column",
            alignItems:"center",
            gap:"6px",
          }}
        >

          <div
            onClick={() =>
              window.open(
                "https://dangerussxxx.github.io/DangeRussZone/",
                "_blank"
              )
            }

            style={{
              color:"#39ff14",
              fontSize:"17px",
              fontWeight:800,
              cursor:"pointer",
            }}
          >
            ⚡ Created By DangeRuss ⚡
          </div>



          <div
            style={{
              display:"flex",
              alignItems:"center",
              gap:"8px",
              color:statusColor,
              fontSize:"12px",
              fontWeight:700,
            }}
          >

            <span
              style={{
                width:"10px",
                height:"10px",
                borderRadius:"50%",
                background:statusColor,
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
            flex:1,
            display:"flex",
            justifyContent:"flex-end",
            gap:"12px",
          }}
        >


          {circuitStatus === "FAULT" && (

            <button
              onClick={onResetBreaker}
              style={{
                padding:"12px 18px",
                borderRadius:"8px",
                border:"1px solid #ff4040",
                background:
                  "linear-gradient(#3b1010,#140000)",
                color:"#ff8080",
                fontWeight:800,
                cursor:"pointer",
              }}
            >
              🔄 RESET BREAKER
            </button>

          )}



          {["Save","Load","Print","Lessons"].map(item => (

            <button
              key={item}

              onClick={() =>
                executeMenuAction(
                  "Toolbar",
                  item
                )
              }

              style={{
                padding:"12px 20px",
                minWidth:"90px",
                borderRadius:"8px",
                border:"1px solid #176070",
                background:
                  "linear-gradient(#17202b,#080b10)",
                color:"#9eefff",
                fontWeight:700,
                cursor:"pointer",
                transition:".2s",
              }}


              onMouseEnter={(e)=>{

                e.currentTarget.style.background="#00eaff";
                e.currentTarget.style.color="#001018";

              }}


              onMouseLeave={(e)=>{

                e.currentTarget.style.background=
                  "linear-gradient(#17202b,#080b10)";

                e.currentTarget.style.color="#9eefff";

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
              transform:translateX(-100%);
            }

            100% {
              transform:translateX(100%);
            }

          }

          `}
        </style>


      </div>



      <MenuBar
        menus={menuData}
        onMenuClick={executeMenuAction}
      />


    </>
  );
}