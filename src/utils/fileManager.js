const fs = require("fs");
const path = require("path");
const {throwError} = require("./responseManager");

const dataPath = "../../data/";
const usersDataPath = dataPath + "users-data/";
const appDataPath = dataPath + "app-data/";
const userPath = path.join(__dirname, usersDataPath + "/users/");

const allUsersPath = path.join(__dirname, usersDataPath + "all-users/");
const allCommentsPath = path.join(__dirname, usersDataPath + "comments/");
const allDepositsPath = path.join(__dirname, usersDataPath + "deposits/");
const allPaymentsPath = path.join(__dirname, usersDataPath + "payments/");
const allTransactionsPath = path.join(__dirname, usersDataPath + "transactions/");
const allWithdrawPath = path.join(__dirname, usersDataPath + "withdraw/");
const allOffersPath = path.join(__dirname, usersDataPath + "offers/");
const allCompletedPaymentsPath = path.join(__dirname, usersDataPath + "completed-payments/");
const appContentPath = path.join(__dirname, appDataPath + "contents/");
const appImagesPath = path.join(__dirname, appDataPath + "images/");
const pdfShortCodesPath = appContentPath + "extra/pdf-short-code.json";
const appPdfsPath = appContentPath + "pdfs/";

const appConfigPath = path.join(__dirname, appDataPath + "configs/app-config.json");

const saveFile = (path, data, callBack, res) => {
    fs.writeFile(path, JSON.stringify(data), err => {
        if (err) {
            if (callBack) callBack(err);
            if (res) throwError(res, err);
            return;
        }
        if (callBack) callBack();
    });

}

const readFile = (path, callBack, res) => {
    fs.readFile(path, "utf8", (err, data) => {
        if (err) {
            callBack(err);
            if (res) throwError(res, err);
            return;
        }
        callBack(undefined, JSON.parse(data))
    });

}

const readFileSync = (path, callBack, res) => {
    try {
        let data = fs.readFileSync(path, "utf8");
        callBack(undefined, JSON.parse(data))
    } catch (e) {
        callBack(e);
        if (res) throwError(res, e);
    }

}

const saveUser = (uda, data, callBack, res) => {
    fs.writeFile(userPath + uda, JSON.stringify(data), err => {
        if (err) {
            if (callBack) callBack(err);
            if (res) throwError(res, err);
            return;
        }
        if (callBack) callBack();
    });

}


const readAllUsers = (email, callBack, res) => {
    fs.readFile(allUsersPath + email[0] + ".json", "utf8", (err, data) => {
        if (err) {
            callBack(err);
            if (res) throwError(res, err);
            return;
        }
        callBack(undefined, JSON.parse(data))
    });

}

const readUser = (uda, callBack, res) => {
    fs.readFile(userPath + uda, "utf8", (err, data) => {
        if (err) {
            callBack(err);
            if (res) throwError(res, err);
            return;
        }
        callBack(undefined, JSON.parse(data))
    });

}

const readUserAsync = (uda, callBack, res) => {
    try {
        let data = fs.readFileSync(userPath + uda, "utf8");
        callBack(undefined, JSON.parse(data))
    } catch (err) {
        callBack(err);
        if (res) throwError(res, err);
    }

}

const putData = (path, key, newData, callBack, res) => {
    readFile(path, (err, data) => {
        if (!err) {
            data[key] = newData;
            fs.writeFile(path, JSON.stringify(data), err => {
                if (err) {
                    if (callBack) callBack(err);
                    if (res) throwError(res, err);
                    return;
                }
                if (callBack) callBack();
            });
        }
    }, res)
}

function generateRandomID(length = 10, onLyInt = false) {
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    if (onLyInt) {
        characters = "0123456789";
    }
    let randomID = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomID += characters[randomIndex];
    }

    return randomID;
}


module.exports = {
    userPath,
    allUsersPath,
    allCommentsPath,
    appContentPath,
    allWithdrawPath,
    allOffersPath,
    allDepositsPath,
    allPaymentsPath,
    allTransactionsPath,
    allCompletedPaymentsPath,
    appPdfsPath,
    appConfigPath,
    appImagesPath,
    pdfShortCodesPath,
    readFile,
    readFileSync,
    saveFile,
    readUser,
    readUserAsync,
    readAllUsers,
    saveUser,
    putData,
    generateRandomID
}