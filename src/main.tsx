import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import PreviewPage from "./pages/PreviewPage";

const isPreview = window.location.pathname.replace(/\/$/, "") === "/preview";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isPreview ? <PreviewPage /> : <App />}</StrictMode>,
);
