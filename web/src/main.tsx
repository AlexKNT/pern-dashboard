import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { App } from "./App.tsx";

/**
 * The entry point: mount the app inside the browser router.
 *
 * The theme is already applied to the document by the inline script in `index.html`,
 * so nothing here has to wait for React before the correct colours appear.
 */
const container = document.getElementById("root");
if (!container) throw new Error("Root container is missing from index.html.");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
