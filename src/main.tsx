import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Mitigate harmless websocket / iframe partition warnings from disrupting the user interface experience
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");
    if (
      reason.indexOf("WebSocket") !== -1 ||
      reason.indexOf("websocket") !== -1 ||
      reason.indexOf("IndexedDB") !== -1 ||
      reason.indexOf("idb-set") !== -1 ||
      reason.indexOf("app/idb-set") !== -1
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    if (
      msg.indexOf("WebSocket") !== -1 ||
      msg.indexOf("websocket") !== -1 ||
      msg.indexOf("IndexedDB") !== -1 ||
      msg.indexOf("idb-set") !== -1 ||
      msg.indexOf("app/idb-set") !== -1
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
