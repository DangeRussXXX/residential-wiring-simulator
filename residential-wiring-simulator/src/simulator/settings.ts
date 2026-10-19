// Residential Wiring Simulator v2.2
// Simulator settings manager


import type {
  SimulationMode
} from "./modes";


// Difficulty levels

export type DifficultyLevel =
  | "BEGINNER"
  | "APPRENTICE"
  | "JOURNEYMAN"
  | "MASTER";


// Code editions

export type CodeEdition =
  | "TRAINING"
  | "NEC_2020"
  | "NEC_2023";



// Main settings object

export interface SimulatorSettings {

  mode: SimulationMode;

  difficulty: DifficultyLevel;

  codeEdition: CodeEdition;

}



// Default simulator settings

export const DEFAULT_SETTINGS:
SimulatorSettings = {

  mode: "APPRENTICE",

  difficulty: "BEGINNER",

  codeEdition: "TRAINING"

};



// Change simulation mode

export function setSimulationMode(
  settings: SimulatorSettings,
  mode: SimulationMode
): SimulatorSettings {


  return {

    ...settings,

    mode

  };

}



// Change difficulty

export function setDifficulty(
  settings: SimulatorSettings,
  difficulty: DifficultyLevel
): SimulatorSettings {


  return {

    ...settings,

    difficulty

  };

}



// Change code edition

export function setCodeEdition(
  settings: SimulatorSettings,
  codeEdition: CodeEdition
): SimulatorSettings {


  return {

    ...settings,

    codeEdition

  };

}