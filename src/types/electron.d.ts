import type { UserSettings } from './settings';

export interface ElectronAPI {
  resizeWindow: (width: number, height: number) => void;
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void;
  closeApp: () => void;
  getSettings?: () => Promise<UserSettings>;
  setSettings?: (settings: Partial<UserSettings>) => Promise<UserSettings>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

