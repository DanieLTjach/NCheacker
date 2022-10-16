
const { app, BrowserWindow, ipcMain, ipcRenderer, dialog } = require('electron');
const electronDl = require('electron-dl');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const request = require('request');
const https = require('https');

electronDl();

let mainWindow;

let hashTable = [];
let config = {
  root: ""
};



function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    resizable: true,
    webPreferences: {
      webSecurity: true,
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.setMenu(null);
  mainWindow.webContents.openDevTools();

  ipcMain.on('update', async () => {
    await processingFolder(config.root);
  });

  ipcMain.on('openDialog', async () => {
    let selectedFolder = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (selectedFolder) {
      try {
        console.log(selectedFolder.filePaths[0]);
        config.root = selectedFolder.filePaths[0];
        await fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config));
        processingFolder(selectedFolder.filePaths[0]);
      } catch (err) {
        mainWindow.webContents.send('Error', err);
      }
    }
  })
  mainWindow.loadFile('index.html');
}
app.on("ready", createWindow);


request(`https://raw.githubusercontent.com/nure-store-server-data/mc-mods/main/index.json`, { headers: { 'user-agent': 'node.js' } }, async (err, res, body) => {
  hashTable = JSON.parse(body);
  await loadConfig();
})

async function loadConfig() {
  config = JSON.parse(await fs.readFileSync(path.join(__dirname, 'config.json')));
  if (!!config.root) {
    mainWindow.webContents.send("selected-folder", config.root);
    mainWindow.webContents.send('log', {
      event: 'selected-folder',
      data: `Selected path ${config.root}`
    });
    mainWindow.webContents.send('log', {
      event: 'update-start',
      data: 'Started updating files.'
    });
    mainWindow.webContents.send('update-start');
    processingFolder(config.root);
    mainWindow.webContents.send('log', {
      event: 'update-end',
      data: 'Update finished.'
    });
  }
}



app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})

async function processingFolder(folder) {
  if (!(await fs.existsSync(path.join(folder, 'mods'))))
    throw new Error("Incorrect path!");
  fs.readdir(path.join(folder, 'mods'), async (err, files) => {
    if (err) throw err;

    let hashTableFiles = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i] == 'index.json')
        continue;
      mainWindow.webContents.send('log', {
        event: 'checking-file',
        data: `Checking file ${path.join(folder, 'mods', files[i])}`
      });
      let data = await fs.readFileSync(path.join(folder, 'mods', files[i]));
      let hash = crypto.createHash('sha1').update(data).digest('hex');

      hashTableFiles.push({ file: files[i], hash });

      console.log(`${files[i]} - (${hash}) - ${!hashTable.find(p => p.hash == hash) ? 'Need to download' : 'Exist'}`);

      if (!hashTable.find(p => p.hash == hash)) {

        console.log(`Remove file ${path.join(folder, 'mods', files[i])}`);

        await fs.rmSync(path.join(folder, 'mods', files[i]));
        mainWindow.webContents.send('log', {
          event: 'rm-file',
          data: `Remove file ${path.join(folder, 'mods', files[i])}`
        });
      }
    }
    hashTable.forEach(async (val) => {
      if (!hashTableFiles.find(p => p.hash == val.hash)) {
        mainWindow.webContents.send('log', {
          event: 'need-download',
          data: `Need Downlodad ${path.join(folder, 'mods', val.file)}`
        });
        await downloadFile(folder, val.file);
      }
    });
  })
}

async function downloadFile(folder, fileName) {
  mainWindow.webContents.send('log', {
    event: 'start-download-file',
    data: `Start download ${path.join(folder, 'mods', fileName)}`
  });
  const file = fs.createWriteStream(path.join(folder, 'mods', fileName));
  const request = https.get(`https://raw.githubusercontent.com/nure-store-server-data/mc-mods/main/${fileName}`, (response) => {
    response.pipe(file);

    file.on("finish", () => {
      file.close();
      mainWindow.webContents.send('log', {
        event: 'download-completed-file',
        data: `Download completed ${path.join(folder, 'mods', fileName)}`
      });
      console.log("Download Completed - " + fileName);
    });
  }).on('error', function (err) {
    file.unlink(path.join(folder, 'mods', fileName));
    throw err;
  });
}