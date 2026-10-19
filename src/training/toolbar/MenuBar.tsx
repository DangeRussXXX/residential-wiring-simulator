import { useState } from "react";

export type MenuItem = {
  label: string;
  items: string[];
};

interface MenuBarProps {
  menus: MenuItem[];
  onMenuClick?: (menu: string, item: string) => void;
}

export default function MenuBar({
  menus,
  onMenuClick,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  function handleClick(menu: string, item: string) {
    setOpenMenu(null);
    onMenuClick?.(menu, item);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: "42px",
        background: "#0f1820",
        borderTop: "1px solid #0d3d46",
        borderBottom: "1px solid #0d3d46",
        userSelect: "none",
        position: "relative",
        zIndex: 1000,
      }}
    >
      {menus.map((menu) => (
        <div
          key={menu.label}
          style={{
            position: "relative",
            height: "100%",
          }}
          onMouseEnter={() => setOpenMenu(menu.label)}
          onMouseLeave={() => setOpenMenu(null)}
        >
          {/* Menu Button */}
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              cursor: "pointer",
              color:
                openMenu === menu.label
                  ? "#00131a"
                  : "#9eefff",
              background:
                openMenu === menu.label
                  ? "#00eaff"
                  : "transparent",
              fontWeight: 700,
              fontSize: "14px",
              transition: ".18s",
              letterSpacing: ".5px",
            }}
          >
            {menu.label}
          </div>


          {/* Dropdown */}
          {openMenu === menu.label && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                minWidth: "230px",
                background: "#10161c",
                border: "1px solid #1d5d6d",
                borderRadius: "0 0 8px 8px",
                overflow: "hidden",
                boxShadow:
                  "0 12px 25px rgba(0,0,0,.45)",
              }}
            >
              {menu.items.map((item, index) => {

                if (item === "---") {
                  return (
                    <div
                      key={`separator-${index}`}
                      style={{
                        height: "1px",
                        background: "#21424d",
                        margin: "5px 0",
                      }}
                    />
                  );
                }


                return (
                  <div
                    key={item}
                    onClick={() =>
                      handleClick(
                        menu.label,
                        item
                      )
                    }
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      color: "#d7faff",
                      fontSize: "14px",
                      transition: ".15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "#00d9ff";

                      e.currentTarget.style.color =
                        "#00131a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "transparent";

                      e.currentTarget.style.color =
                        "#d7faff";
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}