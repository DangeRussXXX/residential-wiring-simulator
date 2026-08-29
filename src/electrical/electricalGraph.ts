// Residential Wiring Simulator
// Electrical Core - Electrical Graph
//
// Responsibilities:
// - Build the electrical connection graph
// - Find connected devices
// - Traverse reachable devices
// - Find paths between devices
//
// This module contains graph topology only.
// It does NOT calculate breaker protection or load behavior.

import type {
  ElectricalDevice
} from "./types";

import type {
  Connection
} from "./connections";


// ============================================================
// GRAPH NODE
// ============================================================

export interface ElectricalGraphNode {

  deviceId: string;

  connectedDeviceIds: string[];

}


// ============================================================
// ELECTRICAL GRAPH
// ============================================================

export interface ElectricalGraph {

  nodes: Map<
    string,
    ElectricalGraphNode
  >;

  connections: Connection[];

}


// ============================================================
// BUILD ELECTRICAL GRAPH
// ============================================================
//
// Creates an undirected graph from the physical connections.
//
// Example:
//
// Panel
//   │
//   └── Breaker
//          │
//          └── Switch
//                 │
//                 └── Light
//
// Each connection creates a relationship in BOTH directions.
//

export function buildElectricalGraph(
  devices: ElectricalDevice[],
  connections: Connection[]
): ElectricalGraph {

  const nodes =
    new Map<
      string,
      ElectricalGraphNode
    >();


  // ----------------------------------------------------------
  // Create graph node for every device.
  // ----------------------------------------------------------

  for (
    const device of devices
  ) {

    nodes.set(
      device.id,
      {
        deviceId:
          device.id,

        connectedDeviceIds:
          []
      }
    );

  }


  // ----------------------------------------------------------
  // Add physical connections.
  // ----------------------------------------------------------

  for (
    const connection of connections
  ) {

    const fromId =
      connection.from.deviceId;

    const toId =
      connection.to.deviceId;


    const fromNode =
      nodes.get(
        fromId
      );

    const toNode =
      nodes.get(
        toId
      );


    // Ignore connections to devices that no longer exist.

    if (
      !fromNode ||
      !toNode
    ) {

      continue;

    }


    // --------------------------------------------------------
    // FROM → TO
    // --------------------------------------------------------

    if (
      !fromNode.connectedDeviceIds.includes(
        toId
      )
    ) {

      fromNode.connectedDeviceIds.push(
        toId
      );

    }


    // --------------------------------------------------------
    // TO → FROM
    // --------------------------------------------------------

    if (
      !toNode.connectedDeviceIds.includes(
        fromId
      )
    ) {

      toNode.connectedDeviceIds.push(
        fromId
      );

    }

  }


  return {

    nodes,

    connections

  };

}


// ============================================================
// CREATE ELECTRICAL GRAPH
// ============================================================
//
// Alias for newer code.
//

export function createElectricalGraph(
  devices: ElectricalDevice[],
  connections: Connection[]
): ElectricalGraph {

  return buildElectricalGraph(
    devices,
    connections
  );

}


// ============================================================
// GET CONNECTED DEVICE IDS
// ============================================================

export function getConnectedDeviceIds(
  graph: ElectricalGraph,
  deviceId: string
): string[] {

  const node =
    graph.nodes.get(
      deviceId
    );


  if (!node) {

    return [];

  }


  return [
    ...node.connectedDeviceIds
  ];

}


// ============================================================
// FIND REACHABLE DEVICES
// ============================================================
//
// Breadth-first traversal.
//
// Starting from:
//
//     panel-1
//
// Could return:
//
//     panel-1
//     breaker-1
//     switch-1
//     light-1
//
// Each ID appears only once.
//

export function findReachableDevices(
  graph: ElectricalGraph,
  startDeviceId: string
): string[] {

  if (
    !graph.nodes.has(
      startDeviceId
    )
  ) {

    return [];

  }


  const visited =
    new Set<string>();


  const queue: string[] = [

    startDeviceId

  ];


  while (
    queue.length > 0
  ) {

    const currentId =
      queue.shift();


    if (
      !currentId
    ) {

      continue;

    }


    if (
      visited.has(
        currentId
      )
    ) {

      continue;

    }


    visited.add(
      currentId
    );


    const connectedIds =
      getConnectedDeviceIds(
        graph,
        currentId
      );


    for (
      const connectedId of connectedIds
    ) {

      if (
        !visited.has(
          connectedId
        )
      ) {

        queue.push(
          connectedId
        );

      }

    }

  }


  return [
    ...visited
  ];

}


// ============================================================
// TRAVERSE ELECTRICAL GRAPH
// ============================================================
//
// Compatibility alias.
//

export function traverseElectricalGraph(
  graph: ElectricalGraph,
  startDeviceId: string
): string[] {

  return findReachableDevices(
    graph,
    startDeviceId
  );

}


// ============================================================
// GET CONNECTED DEVICES
// ============================================================

export function getConnectedDevices(
  graph: ElectricalGraph,
  devices: ElectricalDevice[],
  deviceId: string
): ElectricalDevice[] {

  const connectedIds =
    getConnectedDeviceIds(
      graph,
      deviceId
    );


  return devices.filter(
    device =>
      connectedIds.includes(
        device.id
      )
  );

}


// ============================================================
// FIND PATH BETWEEN DEVICES
// ============================================================

export function findElectricalPath(
  graph: ElectricalGraph,
  startDeviceId: string,
  targetDeviceId: string
): string[] {

  if (
    !graph.nodes.has(
      startDeviceId
    )
  ) {

    return [];

  }


  if (
    !graph.nodes.has(
      targetDeviceId
    )
  ) {

    return [];

  }


  if (
    startDeviceId ===
    targetDeviceId
  ) {

    return [
      startDeviceId
    ];

  }


  const queue: string[][] = [

    [
      startDeviceId
    ]

  ];


  const visited =
    new Set<string>();


  visited.add(
    startDeviceId
  );


  while (
    queue.length > 0
  ) {

    const path =
      queue.shift();


    if (
      !path
    ) {

      continue;

    }


    const currentId =
      path[
        path.length - 1
      ];


    const connectedIds =
      getConnectedDeviceIds(
        graph,
        currentId
      );


    for (
      const connectedId of connectedIds
    ) {

      if (
        visited.has(
          connectedId
        )
      ) {

        continue;

      }


      const nextPath = [

        ...path,

        connectedId

      ];


      if (
        connectedId ===
        targetDeviceId
      ) {

        return nextPath;

      }


      visited.add(
        connectedId
      );


      queue.push(
        nextPath
      );

    }

  }


  return [];

}


// ============================================================
// CHECK CONNECTIVITY
// ============================================================

export function areDevicesConnected(
  graph: ElectricalGraph,
  deviceAId: string,
  deviceBId: string
): boolean {

  return (
    findElectricalPath(
      graph,
      deviceAId,
      deviceBId
    ).length > 0
  );

}


// ============================================================
// GET CIRCUIT DEVICE IDS
// ============================================================

export function getCircuitDeviceIds(
  graph: ElectricalGraph,
  startDeviceId: string
): Set<string> {

  return new Set(
    findReachableDevices(
      graph,
      startDeviceId
    )
  );

}