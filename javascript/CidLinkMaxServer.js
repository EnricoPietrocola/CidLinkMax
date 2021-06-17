const path = require('path');
const app = require('express')();
const http = require('http');
//const http = require('http').Server(app);
const fs = require('fs');
const socketio = require('socket.io')
const rooms = require('./rooms.js')
const Max = require('max-api')

let httpsServer;
let httpServer;
let io;

const args = process.argv.slice(2)
const key = args[1]
const cert = args[2]
const ca = args[3]
let domain = args[4]

let PORT = args[0]

// testing homepage
app.get('/', (req, res) => {
    res.send('Server up');
});

createServer()

io.on('connection', (socket) => {
    console.log("new websocket connection")
    socket.emit('systemchannel', 'Connected')

    socket.on('join', (roomName, password) => {
        socket.join(roomName)
        const room = rooms.addRoom(roomName, password)

        if(room.password === password || room.password === ""){
            room.allowedList.indexOf(socket.id) === -1 ? room.allowedList.push(socket.id) : console.log("This item already exists");
            socket.to(roomName).emit('datachannel', 'A new user joined the room')
        }
    })

    socket.on('datachannel', (room, data) => {
        const requestedRoom = rooms.findRoomByName(room)
        //if user is in allowed list, send data to others
        if (requestedRoom != null) {
            if (requestedRoom.allowedList.indexOf(socket.id) !== -1) {
                socket.to(room).emit('datachannel', data)
                //console.log(data)
            } else {
                socket.emit('systemchannel', 'Wrong Password')
            }
        }
        else {
            socket.emit('systemchannel', 'You are not connected to a room')
        }
    })

    socket.on('objchannel', (room, data) => {
        const requestedRoom = rooms.findRoomByName(room)
        //if user is in allowed list, send data to others
        if (requestedRoom != null) {
            if (requestedRoom.allowedList.indexOf(socket.id) !== -1) {
                socket.to(room).emit('objchannel', data)
            } else {
                socket.emit('systemchannel', 'Wrong Password')
            }
        }
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

function createServer(){
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
            Max.post('SSL certificates set. Starting https server')
        } else {
            Max.post('SSL certificates absent. Starting http server')
            httpServer = http.createServer(app);
            io = socketio(httpServer)
            httpServer.listen(PORT)
        }
    } catch (err) {
        console.error(err)
    }
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}