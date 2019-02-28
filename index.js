const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const fs = require('fs');
const rl = require('readline');
const dns = require('dns');

const PORT = 8880;

const app = express();
app.use(cors());

var hostsArray = getArray();

function connection(query, callback) {
    var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "check_hosts"
    });
    connection.connect();
    connection.query(query, callback);
    connection.end();
}

function getArray() {

    let hostsArray = [];
    connection('SELECT `host` FROM `hosts`', function (error, results) {
        if (error) throw error;
        const arrayResults = Object.values(results);
        for (var i = 0; i < arrayResults.length; i++) {
            hostsArray.push(arrayResults[i].host);
        }
    });

    return hostsArray;
}

function checkhost(host) {

    let hostStatus = true;
    for (let i = 0; i < hostsArray.length; i++) {
        if (hostsArray[i] === host) {
            hostStatus = false;
            break;
        }
    }
    return hostStatus;
}

function handleHost(host) {

    hostsArray.push(host);
    dns.resolve4(host, function (err, d) {
        if (err) {
            enterSql(err);
        } else {
            enterSql(host);
        }
    });
};

function enterSql(content) {

    if (typeof content === 'string')
        var query = 'INSERT INTO `hosts`(`host`) VALUES("' + content + '")';
    else
        var query = 'INSERT INTO `hosts`(`host`, `dns-error`) VALUES("' + content.hostname + '","' + content.message + '")';

    connection(query, function (error, results) {
        if (error) throw error;
    });
};

app.get('/h', function (req, res) {

    var lineReader = rl.createInterface({
        input: fs.createReadStream('list.txt')
    });

    lineReader.on('line', function (line) {
        var hostStatus = checkhost(line);
        if (hostStatus)
            handleHost(line);
    });

    showData(res);
});

function showData(res) {

    connection('SELECT * FROM `hosts`', function (error, results) {
        if (error) throw error;
        res.send(results);
    });
}

app.listen(PORT, function () {
    console.log('server started at port ' + PORT)
});
