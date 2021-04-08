//this basic max client patch sends a message to the main server, which is then broadcast to all other users
const path = require('path');
const Max = require('max-api');

const io = require("socket.io-client");

let ioClient = io.connect("http://116.203.114.204:5000");
//let ioClient = io.connect("http://127.0.0.1:5000");

let roomName;
// This will be printed directly to the Max console
Max.post(`Loaded the ${path.basename(__filename)} script`);

//ioClient.emit('echo', 'hi');

Max.addHandler("roomName", (msg)=> {
    roomName = msg;
    ioClient.emit('join', roomName)
})

Max.addHandler("address", (msg)=> {
    ioClient.disconnect().then(() => {
        ioClient = io.connect(msg)
    })
})

Max.addHandler("send", (msg) => {
    //Max.post(msg);
    ioClient.emit("datachannel", roomName,  msg);
});

ioClient.on('datachannel', (msg)=> {
    console.log("DEBUG received " + msg)
    Max.outlet(msg)
})

ioClient.on("disconnect", (msg)=> {
    Max.post("disconnected")
    console.log("disconnected")
    Max.outlet("disconnected")
})