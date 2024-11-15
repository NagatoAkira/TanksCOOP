const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("game")); // Обслуживаем статические файлы из папки 'game'

var all_data = {}
var user_connection = {}
var timers = {}

var user_blacklist = {}


var clients = {isMessageSent:{},clientID:{},playerID:{},count:0} // Check all messages was sent
// Clear AFK and Disconnected Players
setInterval(()=>{
    for(let usr in user_connection){
        all_data[usr].isConnected = false
        user_connection[usr] = false
        let id = clients.playerID[usr]
        if(clients.clientID[id] == usr){
            if(clients.isMessageSent[id]){
                all_data[usr].isConnected = true
                user_connection[usr] = true
            }
            clients.isMessageSent[id] = false
        }
    } 
},1000)

// To clear timeout if timer got green flag
function clearTimer(usr, all_data, user_connection, timers) {
    if(user_connection[usr] == false){
        user_blacklist[usr] = usr
        delete all_data[usr]
        delete user_connection[usr]
    }
    clearTimeout(timers[usr])
}
// Kick out player if it disconnected too long
setTimeout(()=>{
    setInterval(()=>{
    for(let usr in user_connection){
    // If player is disconnected we should wait 15 seconds to kickout
    if(user_connection[usr] == false){
    timers[usr] = setTimeout(clearTimer,1000*15, usr, all_data, user_connection, timers)
    }
    // If player in blacklist we have to kick out immediately
    if(user_blacklist[usr]){
    delete all_data[usr]
    delete user_connection[usr]    
    }
    }
    },1000)
},500)
// Update Server
setInterval(()=>{
all_data = {}
user_connection = {}
timers = {}

user_blacklist = {}
},1000*60*60)


// Обработка подключения WebSocket
wss.on("connection", (ws) => {
    console.log("User connected");
    ws.id = clients.count
    clients.isMessageSent[ws.id] = false
    clients.count++

    // Обработка сообщения от клиента
    ws.on("message", (message) => {
        message = JSON.parse(`${message}`)
        clients.clientID[ws.id] = message.id
        clients.playerID[message.id] = ws.id

        all_data[message.id] = message

        all_data[message.id].isConnected = true
        user_connection[message.id] = true

        if(user_blacklist[message.id] != null){
            all_data[message.id].isKickOut = true
        }
        ws.send(JSON.stringify(all_data))
        clients.isMessageSent[ws.id] = true
    })

    // Обработка отключения клиента
    ws.on("close", () => {
        delete clients.isMessageSent[ws.id]
        delete clients.clientID[ws.id]
        console.log("User disconnected");
    })
})

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});