const fs = require('fs');
const path = require('path');

function createFoldersAndJsonFiles() {
    const alphabets = Array.from({length: 26}, (_, i) => String.fromCharCode(97 + i));
    // const alphabets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    alphabets.forEach(alphabet => {
        const folderPath = path.join(__dirname, "../../data/users-data/all-users/");
        // const folderPath = path.join(__dirname, "../../data/users-data/comments/" + alphabet);

        // Create the folder if it doesn't exist
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }


        const data = {};

        // const jsonPath = path.join(folderPath, `1.csv`);
        const jsonPath = path.join(folderPath, `${alphabet}.json`);
        // const jsonPath = path.join(folderPath, `1.json`);

        // Write the data as JSON to the file
        // fs.writeFileSync(jsonPath, "txnID,type,email,amount,time,extra,extra2");
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    });
}

createFoldersAndJsonFiles();
