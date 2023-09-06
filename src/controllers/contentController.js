const fs = require("fs");
const {appPdfsPath, appImagesPath} = require("../utils/fileManager");
const contentDisposition = require('content-disposition');

const getPdf = (req, res) => {
    let {option, pdf} = req.params;

    option = option.replaceAll("-[]-", "/");

    console.log(option)

    let path = appPdfsPath + option;
    fs.stat(path, (err, stats) => {
        if (err) {
            return res.status(404).send('File not found');
        }

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', contentDisposition(pdf));
        res.setHeader('Content-Length', stats.size);

        const fileStream = fs.createReadStream(path);
        fileStream.pipe(res);
    });
}

const getImage = (req, res) => {

    const fileStream = fs.createReadStream(appImagesPath + req.params.image);

    fileStream.on('error', (err) => {
        if (err.code === 'ENOENT') {
            res.status(404).send('Image Not Found');
        } else {
            res.status(500).send('Internal Server Error');
            console.error('Error reading file:', err);
        }
    });

    fileStream.on('open', () => {
        res.setHeader('Content-Disposition', `attachment; filename=${req.params.image}`);
        res.setHeader('Content-Type', 'image/jpeg');

        fileStream.pipe(res);
    });
}
module.exports = {
    getPdf, getImage
}