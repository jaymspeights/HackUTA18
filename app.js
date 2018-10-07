let path_engine = require('./path_engine.js');
let bodyParser = require('body-parser');
let CERT = '/etc/letsencrypt/live/walkmeamadeus.net/fullchain.pem';
let KEY = '/etc/letsencrypt/live/walkmeamadeus.net/privkey.pem';

let fs = require('fs');
let http = require('http');
let express = require('express');
let app = express();

let noHTTPS = false;
let PORT = 80;
process.argv.forEach((val, index, array) => {
    if (val === '-p') {
        if (!array[index+1] || !parseInt(array[index+1])) {
            console.error('Expected port after -p option');
            process.exit(1);
        }
        PORT = array[index+1];
    }
    if (val === '-d') {
        noHTTPS = true;
    }
});

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

if (!noHTTPS) {
    app.all('*', (req, res, next) => {
        if(req.secure)
            return next();
        res.redirect('https://' + req.hostname + req.url); // express 4.x
    });
}

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static('frontend/public'));

app.get('/get/path', (req, res) =>  {
    res.send(path_engine.getPath({lng:req.query.lngA, lat:req.query.latA}, {lng:req.query.lngB, lat:req.query.latB}));
});

app.post('/post/path', (req, res) => {
    res.send(path_engine.addPath(req.body));
});

if (!noHTTPS) {
    let https = require('https');

    let privateKey  = fs.readFileSync(KEY, 'utf8');
    let certificate = fs.readFileSync(CERT, 'utf8');

    let credentials = {key: privateKey, cert: certificate};
    let httpsServer = https.createServer(credentials, app);

    console.log(`Listening on 443`);
    httpsServer.listen(443);
}

console.log(`Listening on ${PORT}`);
let httpServer = http.createServer(app);
httpServer.listen(PORT);
