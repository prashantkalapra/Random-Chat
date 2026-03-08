const express=require("express")
const app=express()
const http=require("http").createServer(app)
const io=require("socket.io")(http)

app.use(express.static("public"))

let waitingText=null
let waitingVideo=null

io.on("connection",(socket)=>{

socket.on("find",(type)=>{

if(type==="text"){

if(waitingText){

io.to(waitingText).emit("matched",socket.id)
socket.emit("matched",waitingText)

waitingText=null

}else{

waitingText=socket.id

}

}

if(type==="video"){

if(waitingVideo){

io.to(waitingVideo).emit("matched",socket.id)
socket.emit("matched",waitingVideo)

waitingVideo=null

}else{

waitingVideo=socket.id

}

}

})

socket.on("offer",(data)=>{

io.to(data.to).emit("offer",{
offer:data.offer,
from:socket.id
})

})

socket.on("answer",(data)=>{

io.to(data.to).emit("answer",{
answer:data.answer
})

})

socket.on("candidate",(data)=>{

io.to(data.to).emit("candidate",{
candidate:data.candidate
})

})

socket.on("message",(data)=>{

io.to(data.to).emit("message",data.msg)

})

socket.on("next",()=>{

socket.broadcast.emit("partner-disconnected")

})

})

http.listen(3000)