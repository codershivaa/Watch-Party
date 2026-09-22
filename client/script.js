// ================================
// Socket Connection
// ================================

const socket = io();

let isSyncing = false;
let isSeeking = false;
let username = "";

console.log("Connected to server:", socket.id);


// ================================
// Room Elements
// ================================

const createRoomButton = document.getElementById("createRoom");
const joinRoomButton = document.getElementById("joinRoom");
const copyRoomButton = document.getElementById("copyRoom");
const leaveRoomButton = document.getElementById("leaveRoom");
copyRoomButton.disabled = true;
const roomInput = document.getElementById("roomInput");
const usernameInput = document.getElementById("usernameInput");
const roomStatus = document.getElementById("roomStatus");
const memberList = document.getElementById("memberList");


// ================================
// Create Room
// ================================

createRoomButton.addEventListener("click", () => {

    const enteredUsername = usernameInput.value.trim();

    if (enteredUsername === "") {
        alert("Please enter your name.");
        return;
    }

    username = enteredUsername;

    const roomId = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

   socket.emit("create-room", {
    roomId: roomId,
    username: username
});

    roomStatus.textContent = "🟢 Room: " + roomId;

    createRoomButton.disabled = true;
    joinRoomButton.disabled = true;
    copyRoomButton.disabled = false;

    alert("Room Created!\n\nRoom ID: " + roomId);
});

// ================================
// Join Room
// ================================

joinRoomButton.addEventListener("click", () => {

    const roomId = roomInput.value.trim();
    const enteredUsername = usernameInput.value.trim();

    if (enteredUsername === "") {
        alert("Please enter your name.");
        return;
    }

    if (roomId === "") {
        alert("Please enter a Room ID.");
        return;
    }

    username = enteredUsername;

    socket.emit("join-room", {
    roomId: roomId,
    username: username
});

    

    setTimeout(() => {
        socket.emit("request-video-state");
    }, 500);

    alert("Joined Room: " + roomId);
});

// ================================
// Chat
// ================================

const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessage");
const messages = document.getElementById("messages");


// Send Message

sendMessageButton.addEventListener("click", () => {

    const message = messageInput.value.trim();

    if (message === "") {
        return;
    }

    socket.emit("send-message", {
    username: username,
    message: message
});

    messageInput.value = "";
});

messageInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        sendMessageButton.click();
    }

});

// Receive Message

socket.on("receive-message", (data) => {

    const messageElement = document.createElement("div");

const usernameElement = document.createElement("strong");
usernameElement.textContent = data.username;

const messageText = document.createElement("span");
messageText.textContent = data.message;

const timeElement = document.createElement("small");
timeElement.textContent = data.time;

messageElement.appendChild(usernameElement);
messageElement.appendChild(document.createElement("br"));
messageElement.appendChild(messageText);

messageElement.appendChild(document.createElement("br"));
messageElement.appendChild(timeElement);

    if (data.username === username) {
        messageElement.classList.add("my-message");
    } else {
        messageElement.classList.add("other-message");
    }

    messages.appendChild(messageElement);

    messages.scrollTop = messages.scrollHeight;
});
// ================================
// Video Player
// ================================

const videoPlayer = document.getElementById("videoPlayer");
const syncStatus = document.getElementById("syncStatus");


// ================================
// Play Synchronization
// ================================

videoPlayer.addEventListener("play", () => {

    console.log("Video started playing");

    if (isSyncing) {
        isSyncing = false;
        return;
    }

    socket.emit("video-play");
});


socket.on("video-play", () => {

    isSyncing = true;

    syncStatus.textContent = "🔄 Syncing video...";

    videoPlayer.play();

    setTimeout(() => {
        syncStatus.textContent = "🟢 Video synchronized";
    }, 500);
});

// ================================
// Pause Synchronization
// ================================

videoPlayer.addEventListener("pause", () => {

    console.log("Video paused");

    if (isSyncing) {
        isSyncing = false;
        return;
    }

    socket.emit("video-pause");
});


socket.on("video-pause", () => {

    isSyncing = true;

    syncStatus.textContent = "🔄 Syncing video...";

    videoPlayer.pause();

    setTimeout(() => {
        syncStatus.textContent = "🟢 Video synchronized";
    }, 500);
});

// ================================
// Seek Synchronization
// ================================

videoPlayer.addEventListener("seeked", () => {

    console.log("Video seeked:", videoPlayer.currentTime);

    if (isSeeking) {

        isSeeking = false;
        isSyncing = false;

        return;
    }

    socket.emit("video-seek", videoPlayer.currentTime);
});


socket.on("video-seek", (time) => {

    console.log("Received video position:", time);

    isSyncing = true;
    isSeeking = true;

    syncStatus.textContent = "🔄 Syncing video...";

    videoPlayer.currentTime = time;

    setTimeout(() => {
        syncStatus.textContent = "🟢 Video synchronized";
    }, 500);
});


// ================================
// New User Video State
// ================================

// Existing user sends current state

socket.on("send-video-state", () => {

    console.log("Sending current video state");

    socket.emit("video-state", {

        currentTime: videoPlayer.currentTime,
        isPlaying: !videoPlayer.paused

    });
});


// New user receives current state

socket.on("receive-video-state", (state) => {

    console.log("Received video state:", state);

    isSyncing = true;
    isSeeking = true;

    syncStatus.textContent = "🔄 Syncing video...";

    videoPlayer.currentTime = state.currentTime;

    if (state.isPlaying) {

        videoPlayer.play();

    } else {

        videoPlayer.pause();

    }

    setTimeout(() => {
        syncStatus.textContent = "🟢 Video synchronized";
    }, 500);
});


socket.on("room-members", (members) => {

    memberList.innerHTML = "";

    members.forEach((member) => {

        const listItem = document.createElement("li");

        listItem.textContent = member;

        memberList.appendChild(listItem);
    });
});

socket.on("room-error", (message) => {

    alert(message);

});

socket.on("room-joined", (roomId) => {

    roomStatus.textContent = "🟢 Room: " + roomId;

    createRoomButton.disabled = true;
    joinRoomButton.disabled = true;
    copyRoomButton.disabled = false;

});

copyRoomButton.addEventListener("click", () => {

    const roomText = roomStatus.textContent;
    const roomId = roomText.replace("🟢 Room: ", "");

    if (roomId === "Not connected to a room" || roomId === "") {
        alert("You are not in a room.");
        return;
    }

    navigator.clipboard.writeText(roomId);

    alert("Room ID copied: " + roomId);
});

leaveRoomButton.addEventListener("click", () => {

    socket.emit("leave-room");

    roomStatus.textContent = "Not connected to a room";

    createRoomButton.disabled = false;
    joinRoomButton.disabled = false;
    copyRoomButton.disabled = true;

});