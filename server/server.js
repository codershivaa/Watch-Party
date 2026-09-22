const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();


// ================================
// HTTP + Socket.IO Server
// ================================

const server = http.createServer(app);
const io = new Server(server);


// ================================
// Serve Frontend
// ================================

app.use(express.static(path.join(__dirname, "../client")));


// ================================
// Socket Connection
// ================================

io.on("connection", (socket) => {

    console.log("A user connected:", socket.id);


    // ================================
    // Room Management
    // ================================

    socket.on("create-room", (data) => {

         socket.join(data.roomId);
        socket.roomId = data.roomId;
        socket.username = data.username;

        console.log(`${socket.id} created and joined room ${data.roomId}`);

        io.to(data.roomId).emit("room-members", [
    socket.username
]);
    });


    socket.on("join-room", (data) => {

    const room = io.sockets.adapter.rooms.get(data.roomId);

if (!room) {
    socket.emit("room-error", "Room does not exist.");
    return;
}

socket.join(data.roomId);
socket.roomId = data.roomId;
socket.username = data.username;

    console.log(`${socket.id} joined room ${data.roomId}`);

    const members = [];

    const joinedRoom = io.sockets.adapter.rooms.get(data.roomId);

    if (joinedRoom) {
    joinedRoom.forEach((socketId) => {

            const memberSocket = io.sockets.sockets.get(socketId);

            if (memberSocket) {
                members.push(memberSocket.username);
            }

        });
    }

    io.to(data.roomId).emit("room-members", members);

    socket.emit("room-joined", data.roomId);

});

    // ================================
    // Chat
    // ================================

    socket.on("send-message", (data) => {

    console.log("Message received:", data);

    data.time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    io.to(socket.roomId).emit("receive-message", data);
});
    // ================================
    // Play Synchronization
    // ================================

    socket.on("video-play", () => {

        console.log("A user started the video");

        socket.to(socket.roomId).emit("video-play");
    });


    // ================================
    // Pause Synchronization
    // ================================

    socket.on("video-pause", () => {

        console.log("A user paused the video");

        socket.to(socket.roomId).emit("video-pause");
    });


    // ================================
    // Seek Synchronization
    // ================================

    socket.on("video-seek", (time) => {

        console.log("Video seek:", time);

        socket.to(socket.roomId).emit("video-seek", time);
    });


    // ================================
    // New User Video State
    // ================================

    socket.on("request-video-state", () => {

        socket.to(socket.roomId).emit("send-video-state");
    });


    socket.on("video-state", (state) => {

        console.log("Received video state:", state);

        socket.to(socket.roomId).emit("receive-video-state", state);
    });

    // ================================
// Leave Room
// ================================

socket.on("leave-room", () => {

    const roomId = socket.roomId;

    if (!roomId) {
        return;
    }

    socket.leave(roomId);

    const members = [];

const room = io.sockets.adapter.rooms.get(roomId);

if (room) {
    room.forEach((socketId) => {

        const memberSocket = io.sockets.sockets.get(socketId);

        if (memberSocket) {
            members.push(memberSocket.username);
        }

    });
}

io.to(roomId).emit("room-members", members);


    socket.roomId = null;
    socket.username = null;

    console.log(`${socket.id} left room ${roomId}`);

});



    // ================================
    // Disconnect
    // ================================

    socket.on("disconnect", () => {

    console.log("A user disconnected:", socket.id);

    const roomId = socket.roomId;

    if (!roomId) {
        return;
    }

    const members = [];

    const room = io.sockets.adapter.rooms.get(roomId);

    if (room) {
        room.forEach((socketId) => {

            const memberSocket = io.sockets.sockets.get(socketId);

            if (memberSocket) {
                members.push(memberSocket.username);
            }

        });
    }

    io.to(roomId).emit("room-members", members);
});
});


// ================================
// Start Server
// ================================

const PORT = 3000;

server.listen(PORT, () => {

    console.log(`Watch Party running at http://localhost:${PORT}`);
});