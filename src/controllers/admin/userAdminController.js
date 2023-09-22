const fs = require("fs");
const {allWithdrawPath, readFileSync, readFile, saveFile} = require("../../utils/fileManager");
const {throwError, throwSuccessWithData, throwSuccessOnly} = require("../../utils/responseManager");
const {sendNotification} = require("../../utils/notificationManager");
const {updateWithdrawStatus} = require("../transactionsController");
const getWithdrawRequests = (req, res) => {
    let max = 50;
    let requests = [];
    let isError;
    try {
        let folders = fs.readdirSync(allWithdrawPath);

        for (let i = 0; i < folders.length; i++) {
            if (max > 0 && !isError) {
                let files = fs.readdirSync(allWithdrawPath + folders[i]);
                for (let j = 0; j < files.length; j++) {
                    if (max > 0 && !isError) {
                        readFileSync(allWithdrawPath + folders[i] + "/" + files[j], (err, data) => {
                            if (err) {
                                isError = err;
                                return;
                            }
                            for (const reqEmail in data) {
                                if (max > 0 && !isError) {
                                    for (const txnID in data[reqEmail]) {
                                        if (max > 0 && !isError) {
                                            max -= 1;
                                            data[reqEmail][txnID]["e"] = reqEmail;
                                            data[reqEmail][txnID]["txnID"] = txnID;
                                            data[reqEmail][txnID]["uda"] = files[j];
                                            requests.push(data[reqEmail][txnID]);
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            }

        }

        if (isError) {
            return throwError(res, isError);
        }

        throwSuccessWithData(res, requests)
    } catch (e) {
        throwError(res, e);
    }

}

const completeWithdraw = (req, res) => {
    let {email, uda, txnID, amount} = req.body;

    readFile(allWithdrawPath + email[0] + "/" + uda, (err, data) => {
        if (!err) {
            if (!data.hasOwnProperty(email)) {
                return throwSuccessOnly(res)
            }

            if (!data[email].hasOwnProperty(txnID)) {
                return throwSuccessOnly(res)
            }

            updateWithdrawStatus(email, uda, txnID, "s")

            delete data[email][txnID];

            saveFile(allWithdrawPath + email[0] + "/" + uda, data, (err) => {
                if (!err) {
                    sendNotification(email, "Congratulations!", `Your withdraw request of ${amount} is completed successfully`)
                    throwSuccessOnly(res);
                }
            }, res)
        }
    }, res)

}

const rejectWithdraw = (req, res) => {
    let {email, uda, txnID, amount} = req.body;

    readFile(allWithdrawPath + email[0] + "/" + uda, (err, data) => {
        if (!err) {
            if (!data.hasOwnProperty(email)) {
                return throwSuccessOnly(res)
            }

            if (!data[email].hasOwnProperty(txnID)) {
                return throwSuccessOnly(res)
            }

            updateWithdrawStatus(email, uda, txnID, "r")

            delete data[email][txnID];

            saveFile(allWithdrawPath + email[0] + "/" + uda, data, (err) => {
                if (!err) {
                    sendNotification(email, "Withdraw Request Rejected!", `Your withdraw request of ${amount} is rejected`)
                    throwSuccessOnly(res);
                }
            }, res)
        }
    }, res)

}

module.exports = {
    getWithdrawRequests, completeWithdraw, rejectWithdraw
}