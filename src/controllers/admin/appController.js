const {readFile, appConfigPath, saveFile} = require("../../utils/fileManager");
const {throwSuccessWithData} = require("../../utils/responseManager");
const {loadData} = require("../userController");
const getAppConfig = (req, res) => {
    readFile(appConfigPath, (err, appConfig) => {
        if (!err) {
            throwSuccessWithData(res, appConfig)
        }
    }, res)
}

const updateAppConfig = (req, res) => {

    let changes = req.body;

    readFile(appConfigPath, (err, appConfig) => {
        if (!err) {

            for (let key in changes) {
                appConfig[key] = changes[key];
            }


            saveFile(appConfigPath, appConfig, (err) => {
                if (!err) {
                    loadData(() => {
                        throwSuccessWithData(res, appConfig)
                    }, true)
                }
            }, res)

        }
    }, res)
}


module.exports = {
    getAppConfig,
    updateAppConfig
}