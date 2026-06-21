import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('qvacAPI', {
  loadModel: (): Promise<string> => ipcRenderer.invoke('load-model'),
  infer: (history: { role: string; content: string }[]): Promise<void> =>
    ipcRenderer.invoke('infer', history),
  onCompletionStream: (cb: (token: string) => void): void => {
    ipcRenderer.on('completion-stream', (_event, token) => cb(token))
  },
  unloadModel: (): Promise<string> => ipcRenderer.invoke('unload-model'),
  toggle: () => ipcRenderer.invoke('dark-mode:toggle'), // for lux/nox modes
  system: () => ipcRenderer.invoke('dark-mode:system')  // for lux/nox modes
})
