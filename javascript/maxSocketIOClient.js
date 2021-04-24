//this basic max client patch sends a message to the main server, which is then broadcast to all other users
const path = require('path');
const Max = require('max-api');

const io = require("socket.io-client");

//let ioClient = io.connect("http://116.203.114.204:5000");
let ioClient = io.connect("http://127.0.0.1:5000");

let roomName;
// This will be printed directly to the Max console
Max.post(`Loaded the ${path.basename(__filename)} script`);

const dictIdIn = "LinkMessageIn";
const dictIdOut = "LinkMessageOut";

//ioClient.emit('echo', 'hi');

Max.addHandler("roomName", (msg)=> {
    roomName = msg;
    ioClient.emit('join', roomName)
})

Max.addHandler("address", (msg)=> {
    ioClient.disconnect()
    ioClient.connect(msg)
})

Max.addHandler("send", (msg) => {
    //Max.post(msg);
    ioClient.emit("datachannel", roomName, msg);
});

ioClient.on('datachannel', (msg)=> {
    console.log("DEBUG received " + msg)
    Max.setDict(dictIdIn, msg)

    Max.outlet(msg)
})

ioClient.on("disconnect", (msg)=> {
    if (msg !== undefined && msg !== null) {
        if (isJson(msg)) {
            msg = JSON.parse(msg)
        } else {

        }
    }
    Max.post("disconnected")
    Max.outlet("disconnected")
})




Max.addHandler("bang", () => {
    /*Max.getDict("LinkMessage").then((result)=> {
        Max.outlet(result);

    })*/
    getLinkDict().then(r =>{
        ioClient.emit("datachannel", roomName, r);
    })
});

async function getLinkDict(){
    try {
        // dict contains the dict's contents
        return await Max.getDict(dictIdOut)
    } catch (err) {
        // handle Error here
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