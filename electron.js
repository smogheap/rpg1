const {app, BrowserWindow} = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
	  backgroundColor: "#111",
	  title: "RPG1"
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html');
});
