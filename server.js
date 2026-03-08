const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(__dirname))

let waitingUser = null
let onlineUsers = 0

io.on("connection",(socket)=>{

onlineUsers++
io.emit("onlineUsers",onlineUsers)

function findPartner(){

if(waitingUser && waitingUser !== socket){

socket.partner = waitingUser
waitingUser.partner = socket

socket.emit("matched")
waitingUser.emit("matched")

waitingUser = null

}else{

waitingUser = socket

}

}

findPartner()

socket.on("message",(msg)=>{
if(socket.partner){
socket.partner.emit("message",msg)
}
})

socket.on("signal",(data)=>{
if(socket.partner){
socket.partner.emit("signal",data)
}
})

socket.on("next",()=>{

if(socket.partner){
socket.partner.emit("message","Stranger left")
socket.partner.partner=null
}

socket.partner=null
findPartner()

})

socket.on("disconnect",()=>{

onlineUsers--
io.emit("onlineUsers",onlineUsers)

if(socket.partner){
socket.partner.emit("message","Stranger disconnected")
socket.partner.partner=null
}

})

})

const PORT = process.env.PORT || 3000

server.listen(PORT,()=>{

console.log("Server running")

})