const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static("public"))

let waitingUsers = []
let onlineUsers = 0

io.on("connection",(socket)=>{

onlineUsers++
io.emit("online",onlineUsers)

// FIND USER
socket.on("find",(mode)=>{

socket.mode = mode

let index = waitingUsers.findIndex(u => u.mode === mode && u.id !== socket.id)

if(index !== -1){

let partner = waitingUsers.splice(index,1)[0]

socket.partner = partner.id
partner.partner = socket.id

socket.emit("matched",partner.id)
partner.emit("matched",socket.id)

}else{

waitingUsers.push(socket)

}

})

// TEXT MESSAGE
socket.on("message",(msg)=>{

if(socket.partner){
io.to(socket.partner).emit("message",msg)
}

})

// NEXT USER
socket.on("next",()=>{

if(socket.partner){

io.to(socket.partner).emit("partner-left")

}

socket.partner=null

})

// WEBRTC SIGNAL
socket.on("signal",(data)=>{

io.to(data.to).emit("signal",{
from:socket.id,
signal:data.signal
})

})

// DISCONNECT
socket.on("disconnect",()=>{

onlineUsers--

io.emit("online",onlineUsers)

waitingUsers = waitingUsers.filter(u=>u.id!==socket.id)

if(socket.partner){

io.to(socket.partner).emit("partner-left")

}

})

})

server.listen(3000,()=>{
console.log("Server running on port 3000")
})