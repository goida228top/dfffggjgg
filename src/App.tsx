/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import MonopolyBoard from './components/MonopolyBoard';
import { SettingsProvider } from './SettingsContext';
import { LiveBackground } from './components/LiveBackground';

export default function App() {
  return (
    <SettingsProvider>
      <LiveBackground />
      <MonopolyBoard />
    </SettingsProvider>
  );
}
