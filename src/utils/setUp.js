const fs = require("fs");
const path = require("path");

const required_paths = [
    "../../data/",
    "../../data/app-data/",
    "../../data/users-data/",
    "../../data/users-data/users/",
    "../../data/app-data/plans.json",
    "../../data/users-data/all-users/",
    "../../data/users-data/all-users/all-refer.json",
    "../../data/users-data/all-users/all-users.json",
    "../../data/users-data/bank-data/",
    "../../data/users-data/user-plans/",
    "../../data/app-data/app-data.json",
    "../../data/users-data/transaction-history/"
]

const setUpServer = () => {
    for (let i = 0; i < required_paths.length; i++) {
        let temp_path = required_paths[i];
        let location = path.join(__dirname, required_paths[i]);
        fs.access(location, fs.constants.F_OK, (err) => {
            if (err) {
                if (temp_path.includes(".json")) {
                    console.log('\x1b[32m%s\x1b[0m', `${temp_path} Created`);
                    fs.writeFileSync(location, JSON.stringify({}));
                } else {
                    fs.mkdirSync(location);
                }
            }
        });
    }
}

setUpServer()

const checkServerHealth = () => {
    for (let i = 0; i < required_paths.length; i++) {

        fs.access(bankPath, fs.constants.F_OK, (err) => {
        });
    }
}