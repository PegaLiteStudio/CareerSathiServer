const {
    readFile, readUser, putData, allUsersPath, userPath, generateRandomID, readAllUsers, saveUser
} = require("../utils/fileManager");

const fs = require("fs");
const jwt = require('jsonwebtoken');
const {
    throwMessage, throwError, throwMessageDeclared, MISSING_PARAMETERS_MSG, throwSuccessOnly,
    throwSuccessWithData
} = require("../utils/responseManager");
const {getIndianTime} = require("../utils/timeManager");

const USER_LIMIT_IN_PER_JSON = 5;

const getJWT = (e, p, uda) => {
    let data = {
        time: Date(), e, p, uda
    }

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    return jwt.sign(data, jwtSecretKey, {
        expiresIn: "7d"
    });
}

/**
 * email -> User Email,
 * p -> Password
 */
const registerUser = (res, email, p, n, pn, i) => {

    let cua = userPath + email[0] + "/"; // cua -> Current User Address

    fs.readdir(cua, (err, files) => {
        if (err) {
            return throwMessage(res, "Invalid Email", "000");
        }

        let lastFile = -Infinity;

        files.forEach(file => {
            const parsedNumber = parseInt(file.replace(".json", ""));

            if (!isNaN(parsedNumber) && parsedNumber > lastFile) {
                lastFile = parsedNumber;
            }
        });

        let fileAddress;

        if (lastFile === -Infinity) {
            fileAddress = "1.json";
            lastFile = 1;
            fs.writeFileSync(cua + fileAddress, JSON.stringify({}));
        } else {
            fileAddress = lastFile + ".json"
        }

        function processUser(lastFile, fileAddress) {
            readFile(cua + fileAddress, (err, data) => {
                if (!err) {
                    if (Object.keys(data).length > USER_LIMIT_IN_PER_JSON) {
                        lastFile++;
                        fileAddress = lastFile + ".json";
                        fs.writeFileSync(cua + fileAddress, JSON.stringify({}));
                        processUser(lastFile, fileAddress)
                        return;
                    }

                    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

                    let referID = email[0] + fileAddress[0] + generateRandomID(8);

                    let otp = generateRandomID(5, true);
                    let userData = {
                        p,
                        n,
                        reg: getIndianTime(),
                        s: "u",
                        otp: [otp, expirationTime.toISOString()],
                        i,
                        pn,
                        r: referID,
                        t: {
                            e: 0, r: 0, j: 0, w: 0 // e -> Earnings, r -> Registrations, j -> Refer Program Joins, w -> Withdraw
                        }
                    }

                    console.log("OTP for " + email + " is [" + userData.otp[0] + "]")


                    putData(allUsersPath + email[0] + ".json", email, [lastFile.toString(), referID], (err) => {
                        if (!err) {
                            putData(cua + fileAddress, email, userData, (err) => {
                                if (err) {
                                    return throwError(res, err)
                                }
                                if (i) {
                                    let refererPath = i[0] + "/" + i[1] + ".json";
                                    readUser(refererPath, (err, refererFileData) => {
                                        if (!err) {
                                            let refererEmail;
                                            for (const key in refererFileData) {
                                                if (refererFileData[key].hasOwnProperty("r")) {
                                                    if (refererFileData[key]["r"] === i) {
                                                        refererEmail = key;
                                                        break
                                                    }
                                                }
                                            }
                                            if (!refererEmail) {
                                                throwSuccessWithData(res, {
                                                    token: getJWT(email, p, fileAddress)
                                                });
                                                return;
                                            }

                                            refererFileData[refererEmail]["t"]["r"] += 1;

                                            saveUser(refererPath, refererFileData, (err) => {
                                                if (!err) {

                                                    throwSuccessWithData(res, {
                                                        token: getJWT(email, p, fileAddress)
                                                    });
                                                }
                                            }, res);
                                        }
                                    }, res)
                                    return;
                                }

                                throwSuccessWithData(res, {
                                    token: getJWT(email, p, fileAddress)
                                });
                            }, res);
                        }
                    }, res);


                }
            }, res)
        }

        processUser(lastFile, fileAddress);

    });


}

const validateReferCode = (i, callBack) => {
    readAllUsers(i, (err, data) => {
        if (err) {
            return callBack(false, err);
        }
        for (const key in data) {
            if (data[key].includes(i)) {
                return callBack(true)
            }
        }
        callBack(false)
    });
}

function validEmail(email) {
    if (!email) {
        return false;
    }

    if (email.length < 5) {
        return false;
    }

    return /^[a-z]$/.test(email[0]);
}

const register = (req, res) => {
    /**
     * e -> User Email,
     * p -> Password,
     * i -> Invite Code
     * pn -> Phone Number
     * n -> Name
     * */
    let {e, p, i, pn, n} = req.body;

    if (!e || !p || !n) {
        return throwMessageDeclared(res, MISSING_PARAMETERS_MSG);
    }

    if (!validEmail(e)) {
        return throwMessage(res, "Invalid Email", "008");
    }
    readAllUsers(e, (err, allUsersData) => {
        if (!err) {
            if (allUsersData.hasOwnProperty(e)) {
                return throwMessage(res, "Email Already Registered", "001");
            }
            if (i) {
                validateReferCode(i, (result, err) => {
                    if (err) {
                        return throwError(res, err.message);
                    }
                    if (!result) {
                        return throwMessage(res, "Invalid Refer Code", "002");
                    }
                    registerUser(res, e, p, n, pn, i);
                });
            } else {
                registerUser(res, e, p, n, pn)
            }
        }
    }, res)
}


const loginUser = (res, uda, email, p, callback, ignoreOTP = false) => {
    readUser(email[0] + "/" + uda, (err, allUsers) => {
        if (!err) {
            let user = allUsers[email];
            if (user["p"] !== p) {
                return callback("f", "Incorrect Password", "004");
            }
            if (user.hasOwnProperty("s")) {
                if (user.s === "b") { // b -> Banned
                    return callback("f", "Account Banned", "005");
                }

                if (user.s === "u" && !ignoreOTP) { // u -> Unverified
                    return callback("f", "You haven't verified your account yet", "011");
                }
            }

            callback("s", user);

        }
    }, res);

}


const login = (req, res) => {
    /**
     * e -> User Email,
     * p -> Password
     */
    let {e, p} = req.body;

    if (!e || !p) {
        return throwMessageDeclared(res, MISSING_PARAMETERS_MSG);
    }
    if (!validEmail(e)) {
        return throwMessage(res, "Invalid Email", "008");
    }
    readAllUsers(e, (err, allUsersData) => {
        if (!err) {

            if (!allUsersData.hasOwnProperty(e)) {
                return throwMessage(res, "User Not Exists", "003");
            }

            let uda = allUsersData[e][0] + ".json";

            loginUser(res, uda, e, p, (status, m1, m2) => {
                if (status === "s" || (m2 && m2 === "011")) {
                    return throwSuccessWithData(res, {
                        token: getJWT(e, p, uda)
                    })
                }

                throwMessage(res, m1, m2);
            });

        }
    }, res);
}

const checkEmail = (req, res) => {
    let {e} = req.body;

    if (!e) {
        return throwMessageDeclared(res, MISSING_PARAMETERS_MSG);
    }

    if (!validEmail(e)) {
        return throwMessage(res, "Invalid Email", "008");
    }

    readAllUsers(e, (err, allUsersData) => {
        if (!err) {
            if (allUsersData.hasOwnProperty(e)) {
                return throwMessage(res, "Email Already Registered", "001");
            }

            throwSuccessOnly(res);

        }
    }, res)


}

const validateOTP = (req, res) => {
    let {otp} = req.body;

    let email = req.data.e;
    let uda = email[0] + "/" + req.data.uda;

    readUser(uda, (err, user) => {
        if (!err) {
            if (!user.hasOwnProperty(email)) {
                return throwMessage(res, "User Not Exists", "003");
            }

            if (!user[email].hasOwnProperty("otp")) {
                return throwMessage(res, "OTP expired", "012");
            }

            const expirationTime = new Date(user[email]["otp"][1]);
            const currentTime = new Date();

            if (user[email]["otp"][0] !== otp) {
                return throwMessage(res, "Invalid OTP", "013");
            }

            if (currentTime > expirationTime) {
                return throwMessage(res, "OTP expired", "012");
            }

            delete user[email]["otp"];
            delete user[email]["s"];

            saveUser(uda, user, (err) => {
                if (!err) {
                    throwSuccessOnly(res);
                }
            }, res);
        }
    }, res);

}

const resendOTP = (req, res) => {
    let email = req.data.e;
    let uda = email[0] + "/" + req.data.uda;

    readUser(uda, (err, user) => {
        if (!err) {
            if (!user.hasOwnProperty(email)) {
                return throwMessage(res, "User Not Exists", "003");
            }

            if (user[email].hasOwnProperty("otp")) {
                delete user[email]["otp"];
            }

            const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

            let otp = generateRandomID(5, true);
            user[email]["otp"] = [otp, expirationTime.toISOString()];

            console.log("OTP for " + email + " is [" + otp + "]")

            saveUser(uda, user, (err) => {
                if (!err) {
                    throwSuccessOnly(res);
                }
            }, res);
        }
    }, res);

}

const sendResetPasswordOTP = (req, res) => {

}
const resetPassword = (req, res) => {
    let {e, np, otp} = req.body; // e -> Email, np -> New Password
    if (!e || !np || !otp) {
        return throwMessageDeclared(res, MISSING_PARAMETERS_MSG);
    }

    if (!validEmail(e)) {
        return throwMessage(res, "Invalid Email", "008");
    }

    readAllUsers(e, (err, allUsersData) => {
        if (!err) {

            if (!allUsersData.hasOwnProperty(e)) {
                return throwMessage(res, "User Not Exists", "003");
            }

            let uda = e[0] + "/" + allUsersData[e][0] + ".json";

            readUser(uda, (err, user) => {
                if (!err) {
                    if (!user.hasOwnProperty(e)) {
                        return throwMessage(res, "User Not Exists", "003");
                    }

                    if (!user.e.hasOwnProperty("otp")) {
                        return throwMessage(res, "Invalid OTP Request", "009");
                    }

                    if (!user.e.otp !== otp) {
                        return throwMessage(res, "Invalid OTP", "010");
                    }

                    user.e.otp.p = np;

                    throwSuccessOnly(res);
                }
            }, res);

        }
    }, res);


}

module.exports = {
    register, login, getJWT, loginUser, checkEmail, validateOTP, resendOTP, validateReferCode
}
