import React from "react";
import {
  Car,
  Dog,
  Ship,
  Gamepad2,
  Anchor,
  Ghost,
  Plane,
  Train,
} from "lucide-react";

const TokenIcon = ({ type, size = 24 }) => {
  switch (type) {
    case "car":
      return <Car size={size} />;
    case "dog":
      return <Dog size={size} />;
    case "ship":
      return <Ship size={size} />;
    case "hat":
      return <Gamepad2 size={size} />;
    case "shoe":
      return <Anchor size={size} />;
    case "iron":
      return <Ghost size={size} />;
    case "thimble":
      return <Plane size={size} />;
    case "wheelbarrow":
      return <Train size={size} />;
    default:
      return <Car size={size} />;
  }
};

export default TokenIcon;
