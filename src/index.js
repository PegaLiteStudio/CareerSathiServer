const express = require('express')
const route = require('./route/route.js')
const dotenv = require('dotenv').config();
const app = express()
const compression = require('compression');


app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(compression({
    level: 6,
    threshold: 0
}));

app.use('/', route);
app.use(function (req, res) {
    return res.status(400).send({status: false, message: "Path Not Found"})
});


const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Express app running on Port " + port)
})

