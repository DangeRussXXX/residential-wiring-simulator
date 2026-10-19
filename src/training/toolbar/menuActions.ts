import {
  saveProject,
  openProject,
} from "../simulator/projectIO";


import {
  exportProject,
  importProject,
  resetSimulator,
} from "../simulator/simulatorState";



export function executeMenuAction(
  menu: string,
  item: string
) {

  console.log(
    `${menu} -> ${item}`
  );


  switch (item) {


    case "New Project":

      resetSimulator();

      break;



    case "Save":

      saveProject(
        exportProject()
      );

      break;



    case "Save As...":

      saveProject({
        ...exportProject(),

        name:
          prompt("Project name")
          ||
          "untitled-project",
      });

      break;



    case "Open...":

      openProject(
        (project) => {

          importProject(project);

          console.log(
            "Loaded:",
            project
          );

        }
      );

      break;



    case "Print":

      window.print();

      break;



    case "Fullscreen":

      document.documentElement
        .requestFullscreen?.();

      break;



    case "Trip Breaker":

      console.log(
        "Breaker tripped"
      );

      break;



    case "Reset Breaker":

      console.log(
        "Breaker reset"
      );

      break;



    default:

      console.log(
        "No action assigned:",
        item
      );

  }

}