let Express = require('express');
let app = Express();
let path_engine = require('./path_engine.js');
var bodyParser = require('body-parser');


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


app.get('/', (req, res) => {
   res.sendFile(__dirname + '/frontend/index.html');
});

app.get('/get/path', (req, res) =>  {
    res.send(path_engine.getPath(req.query.a, req.query.b));
});

app.post('post/path', (req, res) => {
    path_engine.addPath(req.body.path);
});




let PORT = 80;
process.argv.forEach((val, index, array) => {
    if (val === '-p') {
        if (!array[index+1] || !parseInt(array[index+1])) {
            console.error('Expected port after -p option');
            process.exit(1);
        }
        PORT = array[index+1];
    }
});

console.log(`Listening on ${PORT}`);
app.listen(PORT);