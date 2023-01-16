const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')

const isMac = process.platform === 'darwin'

async function handleFileOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog()
    if (canceled) {
        return
    } else {
        return filePaths[0]
    }
}

const icon = __dirname + (isMac ? '/assets/img/icon512.png' : '/assets/img/icon.png');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        icon: icon,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    const template = [
        ...(isMac ? [{
            label: 'Momonga',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' }
                        ]
                    }
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { 
                    label: 'Theme',
                    submenu: [
                        {
                            label: 'Dark theme',
                            click: () => win.webContents.send('toggle-theme', 1) 
                        },
                        {
                            label: 'Light theme',
                            click: () => win.webContents.send('toggle-theme', 2) 
                        }
                    ]
                }
            ]
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        const { shell } = require('electron')
                        await shell.openExternal('https://electronjs.org')
                    }
                }
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    if (process.platform === 'darwin') {
        app.dock.setIcon(icon)
    }

    ipcMain.handle('dialog:openFile', handleFileOpen);
    createWindow()

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

// var menu = Menu.getApplicationMenu();
// Menu.setApplicationMenu({label: 'View', submenu: [{role: 'Theme', click: () => {console.log('teste')}}]});

// receive message from index.html 
ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg);

    // send message to index.html
    event.sender.send('asynchronous-reply', 'hello');
});

