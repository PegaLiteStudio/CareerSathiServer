const fs = require("fs");
const {allWithdrawPath, readFileSync} = require("../utils/fileManager");


let folders = fs.readdirSync(allWithdrawPath);

for (let i = 0; i < folders.length; i++) {
    console.log(folders[i]);
    let files = fs.readdirSync(allWithdrawPath + folders[i]);

    for (let j = 0; j < files.length; j++) {
       readFileSync(allWithdrawPath + folders[i] + "/" + files[j], (err, data) => {

       });
    }

}