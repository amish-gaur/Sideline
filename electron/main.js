import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  screen,
  ipcMain,
} from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import Store from 'electron-store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow
let tray

const store = new Store({
  name: 'settings',
  defaults: {
    favoriteTeam: 'SF 49ers',
    refreshRate: 15000,
    startAtLogin: false,
  },
})

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { x: displayX, width: displayWidth } = primaryDisplay.bounds
  const windowWidth = 400
  const windowHeight = 300
  const x = Math.floor(displayX + (displayWidth - windowWidth) / 2)
  const y = 18

  const isDev =
    process.env.NODE_ENV === 'development' || !app.isPackaged
  const preloadPath = join(__dirname, 'preload.js')

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#00000000',
  })

  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  ipcMain.handle('resize-window', (event, { width, height }) => {
    if (mainWindow) {
      const primaryDisplay = screen.getPrimaryDisplay()
      const { x: displayX, width: displayWidth } = primaryDisplay.bounds
      const centerX = Math.floor(displayX + (displayWidth - width) / 2)
      mainWindow.setBounds({
        width,
        height,
        x: centerX,
        y: mainWindow.getBounds().y,
      })
    }
  })

  ipcMain.handle(
    'set-ignore-mouse-events',
    (event, ignore, options) => {
      if (mainWindow) {
        mainWindow.setIgnoreMouseEvents(
          ignore,
          options || { forward: true },
        )
      }
    },
  )

  ipcMain.handle('close-app', () => {
    app.quit()
  })

  ipcMain.handle('settings:get', () => {
    return {
      favoriteTeam: store.get('favoriteTeam'),
      refreshRate: store.get('refreshRate'),
      startAtLogin: store.get('startAtLogin'),
    }
  })

  ipcMain.handle('settings:set', (event, next) => {
    const current = {
      favoriteTeam: store.get('favoriteTeam'),
      refreshRate: store.get('refreshRate'),
      startAtLogin: store.get('startAtLogin'),
    }

    const merged = {
      ...current,
      ...next,
    }

    store.set(merged)

    if (typeof merged.startAtLogin === 'boolean') {
      try {
        app.setLoginItemSettings({
          openAtLogin: merged.startAtLogin,
        })
      } catch {}
    }

    return merged
  })

  const isDevEnv =
    process.env.NODE_ENV === 'development' || !app.isPackaged
  if (isDevEnv) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    const appPath = app.getAppPath()
    const possiblePaths = [
      join(appPath, '.vite/build/renderer/index.html'),
      join(__dirname, 'renderer/index.html'),
      join(__dirname, '.vite/build/renderer/index.html'),
      join(appPath, 'renderer/index.html'),
    ]
    
    let htmlPath = possiblePaths.find(path => existsSync(path))
    if (!htmlPath) {
      htmlPath = possiblePaths[0]
      console.error('HTML file not found. Tried:', possiblePaths)
    }
    
    mainWindow.loadFile(htmlPath).catch((err) => {
      console.error('Failed to load file:', err)
      console.error('app.getAppPath():', appPath)
      console.error('__dirname:', __dirname)
      console.error('Tried paths:', possiblePaths)
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  if (tray) return

  const image = nativeImage.createEmpty()
  tray = new Tray(image)

  tray.setToolTip('Sideline')
  if (process.platform === 'darwin') {
    tray.setTitle('Sideline')
  }

  tray.on('click', () => {
    if (!mainWindow) {
      createWindow()
      return
    }
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      const { width, height, y } = mainWindow.getBounds()
      const { x: displayX, width: displayWidth } = screen.getPrimaryDisplay().bounds
      const centerX = Math.floor(displayX + (displayWidth - width) / 2)
      mainWindow.setBounds({ width, height, x: centerX, y })
      mainWindow.show()
    }
  })

  tray.on('right-click', () => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Settings',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.webContents.send('open-settings')
          }
        },
      },
      {
        label: 'Check for Updates',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('check-for-updates')
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        },
      },
    ])

    tray.popUpContextMenu(menu)
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  const startAtLogin = store.get('startAtLogin')
  if (typeof startAtLogin === 'boolean') {
    try {
      app.setLoginItemSettings({ openAtLogin: startAtLogin })
    } catch {}
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

