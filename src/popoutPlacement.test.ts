import { describe, expect, it } from "vitest";
import { AUTO_HIDE_TAB_THICKNESS, POPOUT_SIZE, autoHidePosition, clampFreePosition, cornerPosition, defaultEdgeForCorner, edgeOffset, nearestDockCorner, nearestEdge, tabOrientation, type WorkArea } from "./popoutPlacement";

const work: WorkArea = { x: 100, y: 50, width: 1200, height: 800 };

describe("popout placement", () => {
  it.each([
    ["top-left", { x: 112, y: 62 }],
    ["top-right", { x: 928, y: 62 }],
    ["bottom-left", { x: 112, y: 668 }],
    ["bottom-right", { x: 928, y: 668 }],
  ] as const)("places and snaps to %s", (corner, expected) => {
    expect(cornerPosition(work, POPOUT_SIZE, corner)).toEqual(expected);
    expect(nearestDockCorner({ x: expected.x + 20, y: expected.y + 15 }, work, POPOUT_SIZE)).toBe(corner);
  });

  it("leaves distant windows free and clamps off-screen remembered positions", () => {
    expect(nearestDockCorner({ x: 500, y: 300 }, work, POPOUT_SIZE)).toBeNull();
    expect(clampFreePosition({ x: -900, y: 3000 }, work, POPOUT_SIZE)).toEqual({ x: 100, y: 680 });
  });

  it("keeps hidden windows outside the selected edge except for the minimal tab", () => {
    expect(autoHidePosition(work, POPOUT_SIZE, "right", 0.5, true)).toEqual({ x: 1286, y: 365 });
    expect(autoHidePosition(work, POPOUT_SIZE, "top", 0.5, true)).toEqual({ x: 520, y: 50 - POPOUT_SIZE.height + AUTO_HIDE_TAB_THICKNESS });
    expect(autoHidePosition(work, POPOUT_SIZE, "left", 0, false)).toEqual({ x: 100, y: 50 });
  });

  it("normalizes edge offsets and orientation while moving between edges", () => {
    expect(edgeOffset({ x: 500, y: 365 }, work, POPOUT_SIZE, "right")).toBe(0.5);
    expect(nearestEdge({ x: 100, y: 300 }, work, POPOUT_SIZE)).toBe("left");
    expect(defaultEdgeForCorner("bottom-right")).toBe("right");
    expect(tabOrientation("top")).toBe("horizontal");
    expect(tabOrientation("left")).toBe("vertical");
  });
});
