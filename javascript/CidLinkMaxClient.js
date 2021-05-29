const path = require('path');
const Max = require('max-api');

const io = require("socket.io-client");

let address = "http://127.0.0.1:5000";
let ioClient = io.connect(address);

let roomName;
let password = "";
// This will be printed directly to the Max console
Max.post(`Loaded the ${path.basename(__filename)} script`);

let dictIdIn = "LinkMessageIn";
let dictIdOut = "LinkMessageOut";

makeClient()

function makeClient() {

    Max.addHandler("roomName", (msg) => {
        roomName = msg;
        ioClient.emit('join', roomName, password)
    })

    Max.addHandler("password", (msg) => {
        password = msg
    })

    Max.addHandler("address", (msg) => {
        address = msg
        //ioClient = io.disconnect()
        ioClient = io.connect(null, {'force new connection': false}); //disconnect, io.disconnect() is been buggy for long in the history of socketio apparently
        ioClient = io.connect(address)
        makeClient()
    })

    Max.addHandler("send", (msg) => {
        //Max.post(msg);
        ioClient.emit("datachannel", roomName, msg);
    });

    Max.addHandler("setDictionary", (msg) => {
        Max.post(msg + " dictionary set");
        dictIdOut = msg
    });

    ioClient.on('datachannel', (msg) => {
        Max.post(msg)
        Max.outlet(msg)

    })

    ioClient.on('objchannel', (msg) => {
        Max.setDict(dictIdIn, msg)
        Max.outlet("bang")
    })

    ioClient.on('systemchannel', (msg) => {
        Max.post(msg)
        Max.outlet(msg)
    })

    ioClient.on("disconnect", (msg) => {
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
        getLinkDict().then(r => {
            ioClient.emit("objchannel", roomName, r);
        })
    });

    async function getLinkDict() {
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
}