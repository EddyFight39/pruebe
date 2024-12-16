const express = require("express");       // Importa Express
const http = require("http");             // Módulo HTTP para el servidor
const { Server } = require("socket.io");  // Importa Socket.IO
const AWS = require("aws-sdk");           // Importa el SDK de AWS

// Configura AWS SQS
AWS.config.update({ region: "us-east-1" });  // Cambia a tu región de AWS
const sqs = new AWS.SQS();

const app = express();              // Inicializa Express
const server = http.createServer(app);
const io = new Server(server);      // Configura el servidor Socket.IO

const PORT = 3000;                  // Puerto para el servidor
const queueUrl = "https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT_ID/YOUR_QUEUE_NAME"; // URL de tu SQS

// Configura el servidor Socket.IO
io.on("connection", (socket) => {
    console.log("Un usuario se ha conectado");

    // Escucha mensajes del cliente
    socket.on("message", async (message) => {
        console.log("Mensaje recibido:", message);

        // Envía el mensaje a la cola SQS
        const params = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({ message, timestamp: Date.now() }),
        };

        try {
            await sqs.sendMessage(params).promise();
            console.log("Mensaje enviado a SQS:", message);
        } catch (error) {
            console.error("Error al enviar a SQS:", error);
        }

        // Envía una respuesta al cliente
        io.emit("message", `Mensaje enviado: ${message}`);
    });

    socket.on("disconnect", () => {
        console.log("Un usuario se ha desconectado");
    });
});

// Configura Express para servir archivos estáticos
app.use(express.static("public"));  // Asegúrate de tener un `public` con tu `index.html`

// Ruta principal
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// Inicia el servidor
server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
