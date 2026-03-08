const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(__dirname))

let waitingUser = null

io.on("connection",(socket)=>{

console.log("User connected")

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

socket.on("next",()=>{

if(socket.partner){

socket.partner.emit("message","Stranger left chat")

socket.partner.partner = null

}

socket.partner = null

findPartner()

})

socket.on("disconnect",()=>{

if(socket.partner){

socket.partner.emit("message","Stranger disconnected")

socket.partner.partner = null

}

})

})

server.listen(3000,()=>{

console.log("Server running on port 3000")

})