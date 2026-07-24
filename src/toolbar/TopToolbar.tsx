import MenuBar from "./MenuBar";
import { menuData } from "./menuData";
import {
  saveProject,
  openProject,
} from "../simulator/projectIO";


export default function TopToolbar() {


  function handleMenuClick(
    menu: string,
    item: string
  ) {

    console.log(
      `${menu} -> ${item}`
    );


    switch(item) {

      case "New Project":
        console.log("New project");
        break;


      case "Save":
        saveProject({
          name: "residential-wiring-project",
          version: "1.0",
          created:
            new Date().toISOString(),

          circuit: {
            components: [],
            wires: []
          }
        });
        break;


      case "Save As...":

        saveProject({
          name:
            prompt(
              "Project name"
            ) || "untitled-project",

          version:"1.0",

          created:
            new Date().toISOString(),

          circuit:{
            components:[],
            wires:[]
          }
        });

        break;


      case "Open...":

        openProject((project)=>{

          console.log(
            "Loaded:",
            project
          );

          // TODO:
          // update simulator state

        });

        break;


      case "Print":
        window.print();
        break;


      default:
        console.log(
          "No action assigned:",
          item
        );
    }
  }


  return (
    <MenuBar
      menus={menuData}
      onMenuClick={handleMenuClick}
    />
  );
}