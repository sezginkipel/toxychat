const express = require('express');
const http = require('http');
const path = require('path');
const toxicity = require('@tensorflow-models/toxicity');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const port = 3000;
let model;

app.use(express.static(path.join(__dirname, 'public')));

const threshold = 0.9;

io.on('connection', async (socket) => {
    console.log('A user connected');

    if (!model) {
        model = await toxicity.load(threshold);
    }

    socket.on('chat message', async (msg) => {
        const predictions = await model.classify(msg);
        let isToxic = false;
        predictions.forEach((prediction) => {
            if (prediction.results[0].match) {
                isToxic = true;
            }
        });

        if (isToxic) {
            io.emit('chat message', {text: 'Message is toxic', isToxic: true});
        } else {
            io.emit('chat message', {text: msg, isToxic: false});
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});