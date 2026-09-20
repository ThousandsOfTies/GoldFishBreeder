import { createRoot } from "react-dom/client";
import AquariumGame from "../app/page";
import "../app/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The game root element is missing.");
}

createRoot(rootElement).render(<AquariumGame />);
