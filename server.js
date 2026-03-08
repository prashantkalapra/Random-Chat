const express = require("express")
const app = express()
const http = require("http").createServer(app)
const io = require("socket.io")(http)

app.use(express.static("public"))

let waitingVideo = null
let waitingText = null

let users = 0

io.on("connection", socket => {

users++
io.emit("users", users)

socket.on("find", type => {

if(type === "video"){

if(waitingVideo){

io.to(waitingVideo).emit("matched", socket.id)
socket.emit("matched", waitingVideo)

waitingVideo = null

}else{

waitingVideo = socket.id

}

}

if(type === "text"){

if(waitingText){

io.to(waitingText).emit("matched", socket.id)
socket.emit("matched", waitingText)

waitingText = null

}else{

waitingText = socket.id

}

}

})

socket.on("offer", data => {

io.to(data.to).emit("offer",{
offer:data.offer,
from:socket.id
})

})

socket.on("answer", data => {

io.to(data.to).emit("answer",{
answer:data.answer
})

})

socket.on("candidate", data => {

io.to(data.to).emit("candidate",{
candidate:data.candidate
})

})

socket.on("message", data => {

io.to(data.to).emit("message", data.msg)

})

socket.on("next", data => {

io.to(data.to).emit("partner-left")

})

socket.on("disconnect", () => {

users--
io.emit("users", users)

})

})

http.listen(process.env.PORT || 3000)