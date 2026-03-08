const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static("public"))

let waitingUser = null
let onlineUsers = 0

io.on("connection", socket => {

onlineUsers++
io.emit("users", onlineUsers)

socket.on("find", () => {

if(waitingUser){

socket.partner = waitingUser
io.to(waitingUser).emit("matched", socket.id)
socket.emit("matched", waitingUser)

waitingUser = null

}else{

waitingUser = socket.id

}

})

socket.on("message", data => {

io.to(data.to).emit("message", data.msg)

})

socket.on("typing", data => {

io.to(data.to).emit("typing")

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