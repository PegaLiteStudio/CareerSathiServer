const fs = require("fs");
const {
    appPdfsPath,
    readFile,
    appConfigPath,
    appContentPath,
    allCommentsPath,
    pdfShortCodesPath,
    saveFile,
    readUser,
    saveUser,
    allDepositsPath,
    allPaymentsPath,
    allCompletedPaymentsPath,
    allWithdrawPath,
    generateRandomID,
    allOffersPath
} = require("../utils/fileManager");
const {
    throwError, throwSuccessWithData, throwMessage, throwSuccessOnly, throwMessageDeclared, MISSING_PARAMETERS_MSG
} = require("../utils/responseManager");
const {verifyJwt} = require("../middleware/jwtAuth");
const {validateReferCode} = require("./authController");
const {getIndianTime} = require("../utils/timeManager");
const {insertTransaction, getTransactionHistoryMain} = require("./transactionsController");
const path = require("path");
const {sendNotification} = require("../utils/notificationManager");

let ALL_CAREER_OPTIONS, APP_CONFIG, VIDEO_DATA, SLIDER_DATA, PDF_SHORT_CODES;

function convertFolderToJson(folderPath) {
    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) {
        return "";
    }

    const folderContents = fs.readdirSync(folderPath);
    const folderJson = {};

    for (const item of folderContents) {
        const itemPath = path.join(folderPath, item);
        folderJson[item] = convertFolderToJson(itemPath);
    }

    return folderJson;
}

const loadData = (callback, hardLoad = false) => {

    if (ALL_CAREER_OPTIONS && !hardLoad) {
        return callback();
    }

    readFile(appConfigPath, (err, data) => {
        if (err) {
            return callback(err);
        }

        APP_CONFIG = data;

        readFile(appContentPath + "extra/data.json", (err, data) => {
            if (err) {
                return callback(err);
            }

            VIDEO_DATA = data["video-info"];
            SLIDER_DATA = data["slider-info"];

            readFile(pdfShortCodesPath, (err, shortCodes) => {
                if (err) {
                    return callback(err);
                }

                PDF_SHORT_CODES = shortCodes;

                ALL_CAREER_OPTIONS = convertFolderToJson(appPdfsPath);
                callback();

            });

        });

    });


}
const appStatus = (req, res) => {
    let {token, version} = req.body;
    loadData((err) => {
        if (err) {
            return throwError(res, err)
        }

        if (APP_CONFIG["m"]) {
            return throwMessage(res, "App under maintenance. You Will be notified once its done", "014")
        }

        if (parseInt(APP_CONFIG["v"]) > parseInt(version)) {
            return throwMessage(res, undefined, "015", {
                v: APP_CONFIG["v"], u: APP_CONFIG["u"]
            })
        }

        if (token) {
            verifyJwt(req, res, () => {
                throwSuccessWithData(res, {
                    "career-options": ALL_CAREER_OPTIONS,
                    "pdf-videos": VIDEO_DATA,
                    "slider-images": SLIDER_DATA,
                    "user-info": {
                        e: req.data.e, n: req.userData.n, i: req.userData.i, v: req.userData.v, r: req.userData.r
                    },
                    "app-info": {
                        sn: APP_CONFIG["sn"],
                        arc: APP_CONFIG["arc"],
                        rb: APP_CONFIG["payouts"]["rb"],
                        aof: APP_CONFIG["add-own-offers-enabled"]
                    }
                });
            });
            return;
        }
        throwSuccessOnly(res)
    });
}

const addComment = (req, res) => {
    /**
     * c -> Comment
     * d -> Date
     * o -> Option
     * p -> Pdf
     * */

    let {c, d, o, p} = req.body;

    if (!c || !d || !o || !p) {
        return throwMessageDeclared(res, MISSING_PARAMETERS_MSG);
    }

    loadData((err) => {
        if (err) {
            return throwError(res, err);
        }

        let paths = o.split("-[]-");

        let pathObject = {...PDF_SHORT_CODES};

        for (let i = 0; i < paths.length - 1; i++) {
            if (!pathObject.hasOwnProperty(paths[i])) {
                return throwMessage(res, "Pdf Address not configured", "016")
            }
            pathObject = pathObject[paths[i]];
        }

        let shortCode = pathObject[paths[paths.length - 1]];

        let email = req.data.e;
        let path = allCommentsPath + email[0] + '/' + req.data.uda;

        fs.access(path, fs.constants.F_OK, (err) => {
            function task(data) {
                if (!data.hasOwnProperty(email)) {
                    data[email] = {}
                }

                if (!data[email].hasOwnProperty(shortCode)) {
                    data[email][shortCode] = []
                }

                data[email][shortCode].push([c, d, 1]);

                saveFile(path, data, (err) => {
                    if (!err) {
                        throwSuccessOnly(res);
                    }
                }, res);
            }

            if (err) {
                console.log(`New Comment File Created: ${path}`);
                fs.writeFileSync(path, JSON.stringify({}));
                task({});
            } else {
                readFile(path, (err, data) => {
                    if (!err) {
                        task(data);
                    }
                }, res);
            }
        });

    })

}

const getComments = (req, res) => {
    /**
     * o -> Option
     * p -> Pdf
     * */

    let {o, p} = req.body;

    if (!o || !p) {
        return throwMessageDeclared(res, MISSING_PARAMETERS_MSG);
    }

    loadData((err) => {
        if (err) {
            return throwError(res, err);
        }

        let paths = o.split("-[]-");

        let pathObject = {...PDF_SHORT_CODES};

        for (let i = 0; i < paths.length - 1; i++) {
            if (!pathObject.hasOwnProperty(paths[i])) {
                return throwMessage(res, "Pdf Address not configured", "016")
            }
            pathObject = pathObject[paths[i]];
        }
        if (!pathObject.hasOwnProperty(paths[paths.length - 1])) {
            return throwMessage(res, "Pdf Address not configured", "016")
        }
        let shortCode = pathObject[paths[paths.length - 1]];

        let email = req.data.e;
        let path = allCommentsPath + email[0] + '/' + req.data.uda;

        fs.access(path, fs.constants.F_OK, (err) => {
            if (err) {
                return throwSuccessWithData(res, [])
            }
            readFile(path, (err, data) => {
                if (!err) {
                    if (!data.hasOwnProperty(email) || !data[email].hasOwnProperty(shortCode)) {
                        return throwSuccessWithData(res, [])
                    }
                    return throwSuccessWithData(res, data[email][shortCode])
                }
            }, res);
        });

    })

}

const sendReferBonus = (req, res, email, data) => {
    if (!req.userData.i) {
        return throwSuccessWithData(res, data)
    } else {
        let refererId = req.userData.i;

        let refererPath = refererId[0] + "/" + refererId[1] + ".json";
        readUser(refererPath, (err, allUsers) => {
            if (!err) {
                let refererEmail;
                for (const key in allUsers) {
                    if (allUsers[key].hasOwnProperty("r")) {
                        if (allUsers[key]["r"] === refererId) {
                            refererEmail = key;
                            break
                        }
                    }
                }
                if (!refererEmail) {
                    return throwSuccessWithData(res, data)
                }

                let referBonus = APP_CONFIG["payouts"]["rb"];
                if (allUsers[refererEmail].hasOwnProperty("b")) {
                    allUsers[refererEmail]["b"] += referBonus;
                } else {
                    allUsers[refererEmail]["b"] = referBonus;
                }

                allUsers[refererEmail]["t"]["e"] += referBonus;
                allUsers[refererEmail]["t"]["j"] += 1;


                saveUser(refererPath, allUsers, (err) => {
                    if (!err) {
                        insertTransaction(refererEmail, refererId[1], referBonus, "rb", email, req.data.uda);
                        sendNotification(refererEmail, "Congratulations!", `Someone who joined with your referral code has now also joined the referral program, and you've earned ₹${referBonus} Rs as a reward!`)
                        return throwSuccessWithData(res, data)
                    }
                }, res);

            }
        }, res);
    }
};
const getReferProgramDetails = (req, res) => {

    if (req.userData.hasOwnProperty("v") && req.userData.v === true) {
        return throwMessage(res, undefined, "018");
    }
    loadData((err) => {
        if (err) {
            return throwError(res, err);
        }

        let rd = 0;
        let st = APP_CONFIG["payouts"]["jp"]; // st -> Sub Total

        if (req.userData.i) {
            rd = APP_CONFIG["payouts"]["rd"]
        }

        let f = st - rd; // f -> Final
        if (req.userData.hasOwnProperty("b")) {
            if (req.userData.b >= f) {
                let email = req.data.e;
                let uda = email[0] + "/" + req.data.uda;

                readUser(uda, (err, allUser) => {
                    if (!err) {
                        let user = allUser[email];

                        user.b -= f;
                        user.v = true;

                        insertTransaction(email, req.data.uda, f, "j", undefined, undefined);
                        saveUser(uda, allUser, (err) => {
                            if (!err) {

                                if (!req.userData.hasOwnProperty("i")) {
                                    return throwSuccessOnly(res);
                                }

                                sendReferBonus(req, res, email);
                            }
                        }, res);

                    }
                }, res);
                return;
            }

            f -= req.userData.b;
        }

        throwSuccessWithData(res, {
            "ic": req.userData.i, "p": {
                st, rd, b: req.userData.b, f, rb: APP_CONFIG["payouts"]["rb"]

            }, "u": APP_CONFIG["upi"]
        })

    });

}

const validateReferCodeIso = (ic, callback) => {
    if (!ic) {
        return callback(true);
    }
    validateReferCode(ic, callback);
}

const validateAndSetReferCode = (req, res) => {
    let {ic} = req.body;

    loadData((err) => {
        if (err) {
            return throwError(res, err)
        }
        if (ic && ic === APP_CONFIG["arc"]["mrc"]) {
            ic = APP_CONFIG["arc"]["rc"];
        }
        validateReferCodeIso(ic, (result, err) => {
            if (err) {
                return throwError(res, err.message);
            }
            if (!result) {
                return throwMessage(res, undefined, "002");
            }

            if (ic && ic === req.userData.r) {
                return throwMessage(res, undefined, "002");
            }

            let email = req.data.e;
            let uda = email[0] + "/" + req.data.uda;

            readUser(uda, (err, allUser) => {
                if (!err) {
                    let user = allUser[email];

                    if (user.hasOwnProperty("i")) {
                        delete user["i"];
                    }
                    if (ic) {
                        user["i"] = ic;
                    }

                    saveUser(uda, allUser, (err) => {
                        if (!err) {

                            let st = APP_CONFIG["payouts"]["jp"]; // st -> Sub Total

                            if (ic) {


                                let rd = APP_CONFIG["payouts"]["rd"];
                                let f = st - rd; // f -> Final

                                return throwSuccessWithData(res, {
                                    ic, "p": {
                                        st, rd, f, rb: APP_CONFIG["payouts"]["rb"]
                                    }
                                });
                            }
                            throwSuccessWithData(res, {
                                "p": {
                                    st, rd: 0, f: st, rb: APP_CONFIG["payouts"]["rb"]
                                }
                            });
                        }
                    }, res);

                }
            }, res);

        });

    })

}

const creditFundOrActiveAccount = (req, res, amount, tid) => {
    loadData((err) => {
        if (err) {
            return throwError(res, err)
        }

        let rd = 0;
        let st = APP_CONFIG["payouts"]["jp"]; // st -> Sub Total

        if (req.userData.i) {
            rd = APP_CONFIG["payouts"]["rd"]
        }

        let f = st - rd; // f -> Final

        let email = req.data.e;
        let uda = email[0] + "/" + req.data.uda;

        readUser(uda, (err, userData) => {
            if (!err) {
                let user = userData[email];

                if (!user.hasOwnProperty("b")) {
                    user.b = amount;
                } else {
                    user.b += amount;
                }
                insertTransaction(email, req.data.uda, amount, "c", tid, undefined);
                let data;
                let isFinal = true;
                if (!user.hasOwnProperty("v") || user.v === false) {
                    if (user.b === f) {
                        user["v"] = true;
                        user.b = 0;
                        insertTransaction(email, req.data.uda, f, "j", tid, undefined);

                    } else if (user.b > f) {
                        user["v"] = true;
                        user.b -= f;
                        data = {
                            "s": "success", amount, f, e: user.b
                        }
                        insertTransaction(email, req.data.uda, f, "j", tid, undefined);
                    } else {
                        isFinal = false;
                        let r = f - user.b;
                        data = {
                            "s": "credited", amount, f, r
                        };
                    }
                }
                saveUser(uda, userData, (err) => {
                    if (!err) {
                        if (isFinal) {
                            sendReferBonus(req, res, email);
                            return;
                        }
                        throwSuccessWithData(res, data);
                    }
                }, res);
            }
        }, res);

    });
}

const saveTransactionId = (req, res) => {
    let {tid} = req.body; // tid -> Transaction ID

    if (!tid) {
        return throwMessageDeclared(res, MISSING_PARAMETERS_MSG);
    }

    let address = tid[tid.length - 1] + ".json";
    let compPaymentsPath = allCompletedPaymentsPath + address;

    readFile(compPaymentsPath, (err, compPaymentData) => {
        if (!err) {
            if (compPaymentData.hasOwnProperty(tid)) {
                return throwMessage(res, undefined, "017")
            }

            let depositsPath = allDepositsPath + address;
            readFile(depositsPath, (err, depositsData) => {
                if (!err) {
                    if (depositsData.hasOwnProperty(tid)) {
                        return throwMessage(res, undefined, "017")
                    }

                    let paymentsPath = allPaymentsPath + address;

                    readFile(paymentsPath, (err, paymentData) => {
                        if (!err) {
                            if (paymentData.hasOwnProperty(tid)) {
                                paymentData[tid].push(getIndianTime());
                                let amount = paymentData[tid][0];
                                compPaymentData[tid] = paymentData[tid];
                                saveFile(compPaymentsPath, compPaymentData, (err) => {
                                    if (!err) {

                                        delete paymentData[tid];
                                        saveFile(paymentsPath, paymentData, (err) => {
                                            if (!err) {
                                                creditFundOrActiveAccount(req, res, amount, tid);
                                            }
                                        }, res);
                                    }
                                }, res);
                                return;
                            }

                            if (req.userData.hasOwnProperty("v") && req.userData.v === true) {
                                return throwMessage(res, undefined, "018");
                            }

                            let email = req.data.e;
                            depositsData[tid] = [email, req.data.uda, getIndianTime()];
                            if (req.userData.hasOwnProperty("i")) {
                                depositsData[tid].push(req.userData.i);
                            }
                            insertTransaction(email, req.data.uda, undefined, "s", tid, undefined);

                            saveFile(depositsPath, depositsData, (err) => {
                                if (!err) {
                                    throwSuccessWithData(res, {
                                        "s": "submit"
                                    });
                                }
                            }, res);


                        }
                    }, res);

                }
            }, res);

        }
    }, res);

}

const getReferDetails = (req, res) => {
    if (!req.userData.hasOwnProperty("v") || req.userData.v === false) {
        return throwMessage(res, undefined, "019");
    }
    throwSuccessWithData(res, {
        r: req.userData.r, t: {
            e: req.userData.t.e, r: req.userData.t.r, j: req.userData.t.j, w: req.userData.t.w
        }
    });
}

const getTransactionHistory = (req, res) => {
    getTransactionHistoryMain(req.data.e, req.data.uda, (result) => {
        throwSuccessWithData(res, result)
    })
}

const setPayment = (req, res) => {
    let {tid, amount} = req.params;

    amount = parseInt(amount)
    let address = tid[tid.length - 1] + ".json";
    let compPaymentsPath = allCompletedPaymentsPath + address;

    readFile(compPaymentsPath, (err, compPaymentData) => {
        if (!err) {
            if (compPaymentData.hasOwnProperty(tid)) {
                return throwMessage(res, undefined, "017")
            }

            let depositsPath = allDepositsPath + address;
            readFile(depositsPath, (err, allDeposits) => {
                if (!err) {
                    if (allDeposits.hasOwnProperty(tid)) {

                        let data = allDeposits[tid];
                        delete allDeposits[tid];

                        saveFile(depositsPath, allDeposits, (err) => {
                            if (!err) {
                                compPaymentData[tid] = [amount, getIndianTime()]
                                saveFile(compPaymentsPath, compPaymentData, (err) => {
                                    if (!err) {
                                        req.data = {
                                            e: data[0], uda: data[1]
                                        };
                                        req.userData = {};
                                        if (data.length > 3) {
                                            req.userData.i = data[3];
                                        }
                                        sendNotification(data[0], "Payment Accepted", `Your payment request with reference ID ${tid} has been approved for an amount of ${amount} RS`)
                                        creditFundOrActiveAccount(req, res, amount, tid);
                                    }
                                }, res);
                            }
                        }, res);

                    } else {
                        let paymentsPath = allPaymentsPath + address;
                        readFile(paymentsPath, (err, allPayments) => {
                            if (!err) {
                                if (allPayments.hasOwnProperty(tid)) {
                                    return throwSuccessOnly(res);
                                }

                                allPayments[tid] = [amount, getIndianTime()];

                                saveFile(paymentsPath, allPayments, (err) => {
                                    if (!err) {
                                        return throwSuccessOnly(res);
                                    }
                                }, res);
                            }
                        }, res);
                    }
                }
            }, res)

        }
    });

}

const getWithdrawDetails = (req, res) => {
    loadData((err) => {
        if (err) {
            return throwError(res, err);
        }

        throwSuccessWithData(res, {
            v: req.userData.v,
            we: APP_CONFIG["withdraw-enabled"],
            mw: APP_CONFIG["payouts"]["mw"],
            b: (req.userData.b) ? req.userData.b : 0
        })

    });
}

const withdrawUsingUpi = (req, res) => {

    let {amount, upi} = req.body;

    amount = parseInt(amount);

    if (amount > parseInt(req.userData.b)) {
        return throwMessage(res, undefined, "020")
    }

    let email = req.data.e;
    let uda = email[0] + "/" + req.data.uda;

    let path = allWithdrawPath + uda;

    readUser(uda, (err, allUsers) => {
        if (!err) {
            let user = allUsers[email];
            user.b -= amount;
            user.t.w += amount;

            saveUser(uda, allUsers, (err) => {
                if (!err) {
                    fs.access(path, fs.constants.F_OK, (err) => {

                        function task(data) {
                            if (!data.hasOwnProperty(email)) {
                                data[email] = {};
                            }

                            let txnID = generateRandomID();
                            data[email][txnID] = {
                                amount, upi, time: getIndianTime()
                            };
                            insertTransaction(email, req.data.uda, amount, "w", upi, undefined, txnID);
                            saveFile(path, data, (err) => {
                                if (!err) {
                                    throwSuccessOnly(res);
                                }
                            }, res);

                        }

                        if (err) {
                            task({})
                        } else {
                            readFile(path, (err, data) => {
                                if (!err) {
                                    task(data);
                                }
                            }, res);
                        }
                    });

                }
            }, res);
        }
    }, res);


}

const getDefaultOffers = (req, res) => {
    loadData((err) => {
        if (err) {
            return throwError(res, err);
        }
        throwSuccessWithData(res, APP_CONFIG["default-offers"])
    });
}

const getOffers = (refererId, res) => {

    let refererPath = allOffersPath + refererId[0] + "/" + refererId[1] + ".json";

    fs.access(refererPath, fs.constants.F_OK, (err) => {

        if (err) {
            return throwSuccessWithData(res, []);
        }

        readFile(refererPath, (err, data) => {
            if (!err) {
                if (!data.hasOwnProperty(refererId)) {
                    return throwSuccessWithData(res, []);
                }
                throwSuccessWithData(res, data[refererId])
            }
        }, res);

    });

}
const getFriendsOffers = (req, res) => {
    if (!req.userData.hasOwnProperty("i")) {
        return throwSuccessOnly(res);
    }

    getOffers(req.userData.i, res);
}

const getOwnOffers = (req, res) => {
    getOffers(req.userData.r, res);
}

const setOffer = (req, res) => {

    let refererId = req.userData.r;

    let refererPath = allOffersPath + refererId[0] + "/" + refererId[1] + ".json";

    let {cn, am, d, i, l} = req.body;

    fs.access(refererPath, fs.constants.F_OK, (err) => {

        function task(data) {
            if (!data.hasOwnProperty(refererId)) {
                data[refererId] = [];
            }

            data[refererId].push([cn, am, d, i, l]);

            saveFile(refererPath, data, (err) => {
                if (!err) {
                    throwSuccessOnly(res);
                }
            }, res);

        }

        if (err) {
            task({})
        } else {
            readFile(refererPath, (err, data) => {
                if (!err) {
                    task(data);
                }
            }, res);
        }

    });
}

module.exports = {
    appStatus,
    addComment,
    getComments,
    getReferProgramDetails,
    validateAndSetReferCode,
    saveTransactionId,
    getReferDetails,
    getTransactionHistory,
    getWithdrawDetails,
    setPayment,
    withdrawUsingUpi,
    getDefaultOffers,
    getFriendsOffers,
    getOwnOffers,
    setOffer,
    loadData

}