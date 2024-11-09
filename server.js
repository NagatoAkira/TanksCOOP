const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("game")); // Обслуживаем статические файлы из папки 'game'

var all_data = {}
var user_connection = {}

setInterval(()=>{
console.log(user_connection)
for(let usr in user_connection){
    user_connection[usr] = false
}
},1000)
setTimeout(()=>{
    setInterval(()=>{
    for(let usr in user_connection){
    if(user_connection[usr] == false){
    setTimeout(()=>{
    if(user_connection[usr] == false){
        delete all_data[usr]
        delete user_connection[usr]
    }
    },1000*10)
    }
    }
    },1000)
},500)


// Обработка подключения WebSocket
wss.on("connection", (ws) => {
    console.log("User connected");

    // Обработка сообщения от клиента
    ws.on("message", (message) => {
        message = JSON.parse(`${message}`)

        all_data[message.id] = message
        user_connection[message.id] = true
        
        // Отправляем сообщение всем подключенным клиентам
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(all_data));
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
