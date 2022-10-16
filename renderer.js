const { ipcRenderer } = require('electron');
document.getElementById("selectDirectory-button").addEventListener("click", () => {
    ipcRenderer.send('openDialog');
});

document.getElementById("update-buttonupdate-button").addEventListener("click", () => {
    ipcRenderer.send('update');
});

ipcRenderer.on('log', (event, data) => {
    let log = document.createElement('div');
    log.innerText = data.data;
    document.getElementById("logs").appendChild(log);
});

ipcRenderer.on('selected-folder', (event, data) => {
    document.getElementById("DirectoryName").innerText = data;
});