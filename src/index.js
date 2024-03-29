const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Notification,
} = require("electron");
const path = require("path");
const Store = require("electron-store");
const jsonToXlsx = require("./utils/sheetJs");

const renameKey = (object, key, newKey) => {
  const clonedObj = clone(object);

  const targetKey = clonedObj[key];

  delete clonedObj[key];

  clonedObj[newKey] = targetKey;

  return clonedObj;
};
const clone = (obj) => Object.assign({}, obj);
function renameObj(obj) {
  let temp = [];
  obj.map((arr) => {
    let res = {};
    res = renameKey(arr, "number", "No.");
    res = renameKey(res, "artistKr", "작가명(국문)");
    res = renameKey(res, "artistEn", "작가명(영문)");
    res = renameKey(res, "titleKr", "작품명(국문)");
    res = renameKey(res, "titleEn", "작품명(영문)");
    res = renameKey(res, "year", "제작년도");
    res = renameKey(res, "certi", "인증 및 감정서");
    res = renameKey(res, "sizeEdition", "작품규격");
    res = renameKey(res, "materialKr", "재료 및 기법(국문)");
    res = renameKey(res, "materialEn", "재료 및 기법(영문)");
    res = renameKey(res, "signPosition", "사인위치");
    res = renameKey(res, "auctionTitle", "출품처");
    res = renameKey(res, "source", "경매명");
    res = renameKey(res, "transactDate", "거래일");
    res = renameKey(res, "winningBidUnit", "낙찰가격(단위)");
    res = renameKey(res, "winningBid", "낙찰가격");
    res = renameKey(res, "estimateUnit", "추정가격(단위)");
    res = renameKey(res, "estimateMin", "추정가격(min)");
    res = renameKey(res, "estimateMax", "추정가격(max)");
    temp.push(res);
  });
  return temp;
}
Store.initRenderer();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

let win;
const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    minWidth: 1340,
    minHeight: 300,
    width: 1560,
    height: 720,
    frame: false,
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "src/icons/app.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    resizable: true,
  });

  // and load the index.html of the app.
  win.loadFile(path.join(__dirname, "/views/app/app.html"));
  // win.setMenuBarVisibility(false);
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);
app.on("ready", () => {
  if (process.platform === "win32") {
    app.setAppUserModelId("auction scraper");
  }
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("createXlsxFile", (event, res, dirName, auctionCategory) => {
  console.log(res);
  try {
    if (!res) {
      return false;
    } else {
      let auctionTitle = res[0].auctionTitle;
      let source = res[0].source;
      console.log("auctionTitle", res[0].auctionTitle);
      console.log("source", res[0].source);
      console.log("transactDate", res[0].transactDate);
      let transactDate = res[0].transactDate
        .split("(")[0]
        .replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, "")
        .split("/");
      let year = transactDate[0].substr(2);
      let mon =
        transactDate[1].length == 1 ? "0" + transactDate[1] : transactDate[1];
      let day = transactDate[2].replace(/[^0-9]/g, "");
      day = day.length == 1 ? "0" + day : day;
      let date = year + mon + day;
      // let auctionTitle = res[0].auctionTitle.replace(/[\s]/g, "");
      let fileName = "케이옥션" + "_" + date + "_" + auctionCategory;
      console.log("fileName", fileName);

      let obj = renameObj(res);
      fileName = jsonToXlsx.write(
        dirName, //dirName
        fileName, //fileName
        auctionCategory, //sheetName
        obj
      );
      showNotification("xlsx파일 생성 완료", `${fileName}가 생성 되었습니다.`);
      event.returnValue = fileName;
    }
  } catch (e) {
    console.error(e);
    dialog.showErrorBox(
      "문제가 발생했습니다🤦‍♂️\n프로그램을 다시시작해주세요😥\n" + e
    );
    event.returnValue = e;
  }
});
ipcMain.on("openDialogFile", (event, path) => {
  dialog
    .showOpenDialog(null, {
      defaultPath: path,
      properties: ["openDirectory"],
    })
    .then((res) => (event.returnValue = res));
});
ipcMain.on("openDialogMsg", (event, msg) => {
  console.log(msg);
  dialog.showMessageBox(null, {
    detail: msg,
  });
  event.returnValue = "";
});

ipcMain.on("openDialogError", (event, msg) => {
  console.error(msg);
  dialog.showErrorBox(msg);
  event.returnValue = "";
});

ipcMain.on("showNotification", (event, title, body) => {
  console.log(body);
  showNotification(title, body);
  event.returnValue = "";
});
try {
  ipcMain.on("maximize", () => {
    win.maximize();
  });
  ipcMain.on("unmaximize", () => {
    win.unmaximize();
  });
  ipcMain.on("minimize", () => {
    win.minimize();
  });
  ipcMain.on("close", () => {
    win.close();
  });
} catch (e) {
  console.log(e);
}

function showNotification(title, body) {
  const notification = {
    title: title,
    body: body,
  };
  new Notification(notification).show();
}
