import cappuccino from "./assets/focus-logo-cappuccino.png";
import coral from "./assets/focus-logo-coral-red.png";
import green from "./assets/focus-logo-green.png";
import miku from "./assets/focus-logo-miku-blue.png";
import orange from "./assets/focus-logo-orange.png";
import sakura from "./assets/focus-logo-sakura.png";
import type { AccentColour } from "./settings";

const accentLogos: Record<AccentColour, string> = {
  coral,
  orange,
  pink: sakura,
  miku,
  green,
  cappuccino,
};

export const focusLogoForAccent = (accent: AccentColour) => accentLogos[accent];
