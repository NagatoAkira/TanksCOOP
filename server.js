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

// Clear AFK and Disconnected Players
setInterval(()=>{
for(let usr in user_connection){
    all_data[usr].isConnected = false
    user_connection[usr] = false
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
    if(user_connection[usr] == false){
    timers[usr] = setTimeout(clearTimer,1000*15, usr, all_data, user_connection, timers)
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

    // Обработка сообщения от клиента
    ws.on("message", (message) => {
        message = JSON.parse(`${message}`)

        all_data[message.id] = message

        all_data[message.id].isConnected = true
        user_connection[message.id] = true

        if(user_blacklist[message.id] != null){
            all_data[message.id].isKickOut = true
        }

        // Отправляем сообщение всем подключенным клиентам
        wss.clients.forEach((client) => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(all_data))
            }
        })
    })

    // Обработка отключения клиента
    ws.on("close", () => {
        console.log("User disconnected");
    })
})

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
