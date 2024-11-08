const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("game")); // Обслуживаем статические файлы из папки 'game'

var all_data = {}

// Обработка подключения WebSocket
wss.on("connection", (ws) => {
    console.log("User connected");

    // Обработка сообщения от клиента
    ws.on("message", (message) => {
        message = JSON.parse(`${message}`)

        all_data[message.id] = message
        
        // Отправляем сообщение всем подключенным клиентам
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(all_data));
            }
        });
    });

    // Обработка отключения клиента
    ws.on("close", () => {
        console.log("User disconnected");
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
