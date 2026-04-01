/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import MonopolyBoard from "./components/MonopolyBoard";
import { SettingsProvider } from "./SettingsContext";
import { LiveBackground } from "./components/LiveBackground";

export default function App() {
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <SettingsProvider>
      <LiveBackground />
      <MonopolyBoard />
    </SettingsProvider>
  );
}
