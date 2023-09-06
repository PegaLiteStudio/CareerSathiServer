const MISSING_PARAMETERS_MSG = {status: "failed", msg: "Missing Parameters", code: "000"};

const throwError = (res, err) => {
    res.status(200).send({status: "error", error: err});
}

const throwSuccessOnly = (res) => {
    res.status(200).send({status: "success"});
}

const throwSuccessWithData = (res, data) => {
    res.status(200).send({status: "success", data});
}

const throwMessage = (res, msg, code, data) => {
    res.status(200).send({status: "failed", msg, code, data});
}

const throwResponse = (res, data) => {
    res.status(200).send(data);
}

const throwMessageDeclared = (res, msg) => {
    res.status(200).send(msg);
}

module.exports = {
    throwError,
    throwResponse, throwMessage, throwSuccessWithData, throwSuccessOnly, throwMessageDeclared, MISSING_PARAMETERS_MSG
}