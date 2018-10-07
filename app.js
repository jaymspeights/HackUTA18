let path_engine = require('./path_engine.js');
let bodyParser = require('body-parser');
let CERT = '/etc/letsencrypt/live/walkmeamadeus.net/fullchain.pem';
let KEY = '/etc/letsencrypt/live/walkmeamadeus.net/privkey.pem';

let fs = require('fs');
let https = require('https');
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

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static('frontend/public'));

app.get('/get/path', (req, res) =>  {
    res.send(path_engine.getPath(req.query.a, req.query.b));
});

app.post('/post/path', (req, res) => {
    path_engine.addPath(req.body);
    res.status(200).send('success');
});

if (!noHTTPS) {
    let httpsRedirect = require('express-https-redirect');
    app.use('/', httpsRedirect());

    let privateKey  = fs.readFileSync(KEY, 'utf8');
    let certificate = fs.readFileSync(CERT, 'utf8');

    let credentials = {key: privateKey, cert: certificate};
    let httpsServer = https.createServer(credentials, app);

    console.log(`Listening on 443`);
    httpsServer.listen(443);
}

console.log(`Listening on ${PORT}`);
app.listen(PORT);
