const socket = io()

let partner = null

const messages = document.getElementById("messages")

function addMsg(text){

const div = document.createElement("div")
div.innerText = text

messages.appendChild(div)

messages.scrollTop = messages.scrollHeight

}

socket.on("users", count => {
document.getElementById("users").innerText = "Online: " + count
})

function startChat(){

addMsg("Searching for stranger...")

socket.emit("find","text")

}

socket.on("matched", id => {

partner = id

addMsg("Connected to stranger")

})

function sendMessage(){

const input = document.getElementById("msg")

if(!input.value) return

addMsg("You: " + input.value)

socket.emit("message",{
to: partner,
msg: input.value
})

input.value = ""

}

socket.on("message", msg => {

addMsg("Stranger: " + msg)

})

function nextUser(){

addMsg("Finding new stranger...")

socket.emit("next")

setTimeout(()=>{
socket.emit("find","text")
},500)

}