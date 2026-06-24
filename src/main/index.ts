import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import {
  QWEN3_4B_INST_Q4_K_M,
  loadModel,
  unloadModel,
  completion
} from '@qvac/sdk'

app.commandLine.appendSwitch('no-sandbox')

let win: BrowserWindow | null = null
let modelId: string | null = null

function createWindow(): void {
  win = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    // remove the default titlebar
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    // expose window controls in Windows/Linux
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win!.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupHandlers(): void {
  ipcMain.handle('load-model', async () => {
    modelId = await loadModel({
      modelSrc: QWEN3_4B_INST_Q4_K_M,
      modelType: 'llamacpp-completion',
      onProgress: (progress) => console.log(progress)
    })
    return 'model loaded'
  })

  ipcMain.handle('infer', async (_event, history) => {
    if (!modelId) throw new Error('Model not loaded.')

    const result = completion({ modelId, history, stream: true })
    for await (const token of result.tokenStream) {
      win?.webContents.send('completion-stream', token)
    }
    win?.webContents.send('completion-stream', '')
  })

  ipcMain.handle('unload-model', async () => {
    if (!modelId) throw new Error('Model not loaded.')
    await unloadModel({ modelId })
    modelId = null
    return 'model unloaded'
  })

  /* Light/Dark mode */
  ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = 'light'
    } else {
      nativeTheme.themeSource = 'dark'
    }
    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system'
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  createWindow()
  setupHandlers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
