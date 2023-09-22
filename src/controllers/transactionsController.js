const fs = require("fs");
const {createObjectCsvWriter: createCsvWriter} = require("csv-writer");
const csv = require("csv-parser");
const {allTransactionsPath, generateRandomID} = require("../utils/fileManager");
const {getIndianTime} = require("../utils/timeManager");

const insert = (path, append, mDataSet) => {
    let csvWriter = createCsvWriter({
        path,
        header:
            [
                {id: 'txnID', title: 'txnID'}, {id: 'type', title: 'type'}, {
                id: 'email', title: 'email'
            }, {id: 'amount', title: 'amount'}, {
                id: 'time', title: 'time'
            }, {
                id: 'extra', title: 'extra'
            }, {id: 'extra2', title: 'extra2'}], append
    });
    csvWriter
        .writeRecords(mDataSet)
        .then(() => console.log('New data inserted successfully'))
        .catch((err) => console.error('Error inserting new data:', err));
}

const insertTransaction = (email, uda, amount, type, tid, uda2, txnID = generateRandomID()) => {
    let path = allTransactionsPath + email[0] + "/" + uda.replace(".json", "") + ".csv";

    fs.access(path, fs.constants.F_OK, (err) => {
        let append = true;
        if (err) {
            append = false;
        }

        insert(path, append, [{
            txnID,
            type,
            email,
            amount,
            time: getIndianTime(),
            extra: tid,
            extra2: uda2
        }]);

    });
}

const getTransactionHistoryMain = (email, uda, callBack) => {
    let path = allTransactionsPath + email[0] + "/" + uda.replace(".json", ".csv");

    fs.access(path, fs.constants.F_OK, (err) => {
        if (err) {
            return callBack([])
        }
        let results = [];

        fs.createReadStream(path)
            .pipe(csv())
            .on('data', (data) => {
                if (data.hasOwnProperty("email") && data["email"] === email) {
                    results.push(data);
                }
            })
            .on('end', () => {
                callBack(results)
            });

    });
}

const updateWithdrawStatus = (email, uda, txnID, status) => {
    let path = allTransactionsPath + email[0] + "/" + uda.replace(".json", "") + ".csv";

    const rows = [];

    fs.createReadStream(path)
        .pipe(csv())
        .on('data', (row) => {
            rows.push(row);
        })
        .on('end', () => {
            const recordToUpdate = rows.find((row) => row.txnID === txnID);

            if (recordToUpdate) {
                recordToUpdate.extra2 = status;

                const csvWriter = createCsvWriter({
                    path: path,
                    header: [
                        {id: 'txnID', title: 'txnID'}, {id: 'type', title: 'type'}, {
                            id: 'email', title: 'email'
                        }, {id: 'amount', title: 'amount'}, {
                            id: 'time', title: 'time'
                        }, {
                            id: 'extra', title: 'extra'
                        }, {id: 'extra2', title: 'extra2'}],
                    append: false
                });
                csvWriter
                    .writeRecords(rows)
                    .then(() => {
                        console.log('Value updated successfully');
                    })
                    .catch((err) => {
                        console.error('Error updating value:', err);
                    });
            } else {
                console.error('No record found with the specified txnID.');
            }
        });
};


module.exports = {
    insertTransaction,
    getTransactionHistoryMain,
    updateWithdrawStatus
}