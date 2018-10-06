let Express = require('express');
let app = Express();

app.get('/', (req, res) => {
   res.sendFile(__dirname + '/frontend/index.html');
});

app.get('/get/path', (req, res) =>  {

    res.status(500).send('This endpoint has not been implemented!')
});

app.post('post/path', (req, res) => {

    res.status(500).send('This endpoint has not been implemented!')
});

app.listen(8080);