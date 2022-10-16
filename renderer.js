const { ipcRenderer } = require('electron');
document.getElementById("selectDirectory-button").addEventListener("click", () => {
    ipcRenderer.send('openDialog');
});

document.getElementById("update-button").addEventListener("click", () => {
    ipcRenderer.send('update');
});

ipcRenderer.on('selected-folder', (event, data) => {
    document.getElementById("DirName").innerText = data;
});

ipcRenderer.on('log', (event, data) => {
    let log = document.createElement('div');
    log.innerText = `[${new Date().toISOString()}] ${data.data}`;
    if (document.getElementById("logs").childElementCount > 220) {
        document.getElementById("logs").removeChild(document.getElementById("logs").children[0]);
    }
    document.getElementById("logs").appendChild(log);
    document.getElementById("logs").scrollTo(0, document.getElementById("logs").scrollHeight);
});

ipcRenderer.send('get-folder');