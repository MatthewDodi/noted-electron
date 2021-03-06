const fs = require('fs');
// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    show: false
  });
  mainWindow.maximize();
  mainWindow.show();

  //Create the Menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click() {
            openFile();
          }
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+D',
          click() {
            openDir();
          }
        },
        {
          label: 'Save File',
          accelerator: 'CmdOrCtrl+S',
          click() {
            mainWindow.webContents.send('save-file');
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            require('electron').shell.openExternal('https://electronjs.org');
          }
        }
      ]
    },
    {
      label: 'For Developers',
      submenu: [
        {
          label: 'Toggle Chrome Developer Tools',
          accelerator:
            process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click() {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Edit menu
    template[2].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }]
      }
    );

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // and load the index.html of the app.
  mainWindow.loadURL('http://localhost:3000/');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Open File

function openFile(f) {
  const files = dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Markdown',
        extensions: ['md', 'markdown', 'txt', 'docx']
      }
    ]
  });
  if (!files) return;
  const file = files[0];
  const fileContent = fs.readFileSync(file).toString();
  // Sends fileContent to the front end of the app
  mainWindow.webContents.send('new-file', fileContent);
}

function openDir() {
  const directory = dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!directory) return;

  mainWindow.webContents.send('new-dir', directory[0]);
}

ipcMain.on('new-entry-save', () => {
  const directory = dialog.showSaveDialog(
    mainWindow,
    {
      buttonLabel: 'Create Entry',
      message: 'Please select directory for new entry to be created'
    },
    (filename, bookmark) => {
      fs.writeFile(`${filename}.txt`, "Here's your new entry", err => {
        if (err) throw err;

        console.log('The entry was succesfully created');
      });
    }
  );
});

ipcMain.on('new-file', () => {
  openFile();
});

ipcMain.on('new-dir', () => {
  openDir();
});
