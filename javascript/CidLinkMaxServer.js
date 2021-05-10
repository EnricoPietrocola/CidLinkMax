const path = require('path');
const app = require('express')();
const http = require('http');
//const http = require('http').Server(app);
const fs = require('fs');
const socketio = require('socket.io')
const rooms = require('./rooms.js')

//const io = require('socket.io')(http);

let httpsServer;
let httpServer;
let io;

const httpsArgs = process.argv.slice(2)

const key = httpsArgs[0]
const cert = httpsArgs[1]
const ca = httpsArgs[2]
let domain = httpsArgs[3]

let totalConnections = 0

const PORT = process.env.PORT || 5000

// testing homepage
app.get('/', (req, res) => {
    res.send('Server up');
});

// create https server if ssl keys are set properly and passed by argument
try {
    if (fs.existsSync(key) && fs.existsSync(cert)) {
        //file exists
        httpsServer = https.createServer({
            key: fs.readFileSync(key, 'utf8'),
            cert: fs.readFileSync(cert, 'utf8'),
            //ca: fs.readFileSync(ca, 'utf8') //hide this if your ssl keys don't include ca
        }, app).listen(443)
        io = socketio(httpsServer)
        console.log('Https server running')
    } else {
        console.log('Something went wrong with SSL certificates, starting http server')
        httpServer = http.createServer(app);
        io = socketio(httpServer)
        httpServer.listen(PORT)
    }
} catch (err) {
    console.error(err)
}

io.on('connection', (socket) => {
    console.log("new websocket connection")

    socket.on('join', (roomName) => {
        socket.join(roomName)
        totalConnections++
        rooms.addRoom(roomName, '')

        if (rooms.getRoomURL(roomName) !== '') {

            console.log('Sending room url to client ' + rooms.getRoomURL(roomName) + ' on page ' + rooms.findRoomByName(roomName).currentPage)
        } else {
            //console.log('Room Url not set')
        }
        socket.to(roomName).emit('datachannel', 'A new user joined the room')
    })

    socket.on('datachannel', (room, data) => {
        console.log(room + " " + data)
        if(isJson(data)){
            console.log(room + " " + JSON.parse(data))
        }
        socket.to(room).emit('datachannel', data)
    })

    socket.on('disconnecting', () => {
        const ioRooms = Object.keys(socket.rooms);
        const room = rooms.findRoomByName(ioRooms[1])
        rooms.decrementRoomConnection(room)
    });

    socket.on('disconnect', () => {
        io.emit('message', 'A user has left')
    })
})


function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}