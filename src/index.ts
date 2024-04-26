import fs from 'fs';
import http from 'http';
import express from 'express';
import socketio from 'socket.io';
import wutils from 'wobbychip-utils';
import config from './game/config.js';
import { scheduleJob, Range } from 'node-schedule';
import { UnoEvents } from './game/events.js';


//Set title for process
process.title = 'UNO Game';


//Add listeners for communcation
process.on('message', (message: any) => {
    if (message.command == 'SIGINT') { process.emit('SIGINT'); }
});


//On exit close website
process.on('SIGINT', () => {
    io.sockets.emit('closed', 'Server has been closed.');
    process.exit();
});


//Clear avatars periodically
scheduleJob({ hour: 6, minute: 0, date: new Range(1, 31) }, async () => {
    if (!fs.existsSync(config.AVATARS_DIR)) { return; }

    for (const avatar of fs.readdirSync(config.AVATARS_DIR)) {
        var time = new Date().getTime() - fs.statSync(`${config.AVATARS_DIR}/${avatar}`).birthtime.getTime();
        if (time > config.IMAGE_SAVE_TIME) { fs.unlinkSync(`${config.AVATARS_DIR}/${avatar}`); console.log(`Removed avatar: ${avatar}`); }
    }
});


//Launch website
const app = express();
app.use(express.static('website', { index: 'index.html' }));
const server = http.createServer(app);
const io = new socketio.Server(server, { maxHttpBufferSize: config.MAX_IMAGE_SIZE });


//Start server
server.listen(process.env.PORT || config.PORT, () => {
    console.log(`Listening on ${wutils.IPV4Address()}:${process.env.PORT || config.PORT}`);
});


//When someone visit webpage
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/website/index.html`);
});


//When someone connects
io.sockets.on('connection', (socket) => {
    UnoEvents.execute(io, socket, 'connection');

    //Disconnect player
    socket.on('disconnect', () => UnoEvents.execute(io, socket, 'disconnect'));

    //Join player to room
    socket.on('join', (data) => UnoEvents.execute(io, socket, 'join', data));

    //Start game
    socket.on('start', () => UnoEvents.execute(io, socket, 'start'));

    //When taking +1 card
    socket.on('take_card', () => UnoEvents.execute(io, socket, 'take_card'));

    //When placing card
    socket.on('place_card', (data) => UnoEvents.execute(io, socket, 'place_card', data));

    //When changing color
    socket.on('change_color', (data) => UnoEvents.execute(io, socket, 'change_color', data));

    //When changing color
    socket.on('save_card', (data) => UnoEvents.execute(io, socket, 'save_card', data));

    //When changing color
    socket.on('uno_press', () => UnoEvents.execute(io, socket, 'uno_press'));

    //Kick player
    socket.on('kick', (data) => UnoEvents.execute(io, socket, 'kick', data));

    //Join player to room
    socket.on('avatar', (data) => UnoEvents.execute(io, socket, 'avatar', data));
});