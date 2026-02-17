import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  resizeWindow: (width, height) =>
    ipcRenderer.invoke('resize-window', { width, height }),
  setIgnoreMouseEvents: (ignore, options) =>
    ipcRenderer.invoke('set-ignore-mouse-events', ignore, options),
  closeApp: () => ipcRenderer.invoke('close-app'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),
})

