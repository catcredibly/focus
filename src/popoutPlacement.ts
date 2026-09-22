import type { DockCorner, DockEdge } from "./settings";

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type WorkArea = Point & Size;

export const POPOUT_SIZE: Size = { width: 360, height: 170 };
export const DOCK_MARGIN = 12;
export const SNAP_THRESHOLD = 52;

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

export function cornerPosition(workArea: WorkArea, size: Size, corner: DockCorner, margin = DOCK_MARGIN): Point {
  const left = workArea.x + margin;
  const right = workArea.x + workArea.width - size.width - margin;
  const top = workArea.y + margin;
  const bottom = workArea.y + workArea.height - size.height - margin;
  return { x: corner.endsWith("left") ? left : right, y: corner.startsWith("top") ? top : bottom };
}

export function nearestDockCorner(position: Point, workArea: WorkArea, size: Size, threshold = SNAP_THRESHOLD): DockCorner | null {
  const corners: DockCorner[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
  let nearest: { corner: DockCorner; distance: number } | null = null;
  for (const corner of corners) {
    const target = cornerPosition(workArea, size, corner);
    const distance = Math.hypot(position.x - target.x, position.y - target.y);
    if (!nearest || distance < nearest.distance) nearest = { corner, distance };
  }
  return nearest && nearest.distance <= threshold ? nearest.corner : null;
}

export function clampFreePosition(position: Point, workArea: WorkArea, size: Size): Point {
  return {
    x: clamp(position.x, workArea.x, workArea.x + workArea.width - size.width),
    y: clamp(position.y, workArea.y, workArea.y + workArea.height - size.height),
  };
}

export function defaultEdgeForCorner(corner: DockCorner): DockEdge {
  return corner.endsWith("left") ? "left" : "right";
}
