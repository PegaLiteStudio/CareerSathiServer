const jwt = require('jsonwebtoken');
const {throwMessage, throwError} = require("../utils/responseManager");
const {loginUser} = require("../controllers/authController");

const verifyJwt = (req, res, next) => {
    let {token, igo} = req.body;

    if (!token) {
        return throwMessage(res, "Missing token", "006")
    }

    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    try {
        const verified = jwt.verify(token, jwtSecretKey);
        if (verified) {
            req.data = verified;
            let {uda, e, p} = verified;
            loginUser(res, uda, e, p, (status, m1, m2) => {
                if (status === "s") {
                    req.userData = m1;
                    return next();
                }
                throwMessage(res, m1, m2);
            }, igo);
        } else {
            throwMessage(res, "Session Expired", "007")
        }
    } catch (e) {
        if (e.message === "jwt expired") {
            return throwMessage(res, "Session Expired", "007")
        }
        console.log(e)
        throwError(res, e.message);
    }
}

module.exports = {
    verifyJwt
}