const express = require('express');
const router = express.Router();

const {login, register, checkEmail, validateOTP, resendOTP} = require("../controllers/authController");
const {verifyJwt} = require("../middleware/jwtAuth");
const {
    appStatus,
    addComment,
    getComments,
    getReferProgramDetails,
    validateAndSetReferCode,
    saveTransactionId, getReferDetails, getTransactionHistory, setPayment, getWithdrawDetails, withdrawUsingUpi,
    getDefaultOffers, getFriendsOffers, getOwnOffers, setOffer
} = require("../controllers/userController");
const {getPdf, getImage} = require("../controllers/contentController");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/checkEmail", checkEmail);
router.post("/auth/validateOTP", verifyJwt, validateOTP);
router.post("/auth/resendOTP", verifyJwt, resendOTP);

router.get("/getPdf/:option/:pdf", getPdf);
router.get("/getImage/:image", getImage);

router.post("/appStatus", appStatus);
router.post("/addComment", verifyJwt, addComment);
router.post("/getComments", verifyJwt, getComments);
router.post("/getReferProgramDetails", verifyJwt, getReferProgramDetails);
router.post("/validateAndSetReferCode", verifyJwt, validateAndSetReferCode);
router.post("/saveTransactionId", verifyJwt, saveTransactionId);
router.post("/getReferDetails", verifyJwt, getReferDetails);
router.post("/getTransactionHistory", verifyJwt, getTransactionHistory);
router.post("/getWithdrawDetails", verifyJwt, getWithdrawDetails);
router.post("/withdrawUsingUpi", verifyJwt, withdrawUsingUpi);

router.post("/getDefaultOffers", verifyJwt, getDefaultOffers);
router.post("/getFriendsOffers", verifyJwt, getFriendsOffers);
router.post("/getOwnOffers", verifyJwt, getOwnOffers);
router.post("/setOffer", verifyJwt, setOffer);

// Admin
router.post("/setPayment/:tid/:amount", setPayment);

module.exports = router

