const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static("public"))

let waitingText = null
let waitingVideo = null
let onlineUsers = 0

io.on("connection", socket => {

onlineUsers++
io.emit("users", onlineUsers)

socket.on("find", mode => {

if(mode === "text"){

if(waitingText){

socket.partner = waitingText
io.to(waitingText).emit("matched", socket.id)
socket.emit("matched", waitingText)

waitingText = null

}else{

waitingText = socket.id

}

}

if(mode === "video"){

if(waitingVideo){

socket.partner = waitingVideo
io.to(waitingVideo).emit("matched", socket.id)
socket.emit("matched", waitingVideo)

waitingVideo = null

}else{

waitingVideo = socket.id

}

}

})

socket.on("signal", data => {
io.to(data.to).emit("signal", data)
})

socket.on("message", data => {
io.to(data.to).emit("message", data.msg)
})

socket.on("next", () => {

if(socket.partner){
io.to(socket.partner).emit("partner-left")
}

})

socket.on("disconnect", () => {

onlineUsers--
io.emit("users", onlineUsers)

})

})

server.listen(process.env.PORT || 3000)