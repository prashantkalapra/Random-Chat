const socket = io()

let partner = null

const messages = document.getElementById("messages")
const users = document.getElementById("users")
const input = document.getElementById("msg")

let typingMsg = null

function addMessage(text,type="system"){

const div = document.createElement("div")

div.classList.add("msg")

if(type==="self") div.classList.add("msg-self")
else if(type==="other") div.classList.add("msg-other")
else div.classList.add("msg-system")

div.innerText = text

messages.appendChild(div)

messages.scrollTop = messages.scrollHeight

}

function startChat(){

addMessage("Searching for stranger...")

socket.emit("find","text")

}

socket.on("matched", id => {

partner = id

addMessage("Connected to stranger")

})

function sendMessage(){

const msg = input.value.trim()

if(!msg) return

addMessage(msg,"self")

socket.emit("message",{
to: partner,
msg: msg
})

input.value=""

}

socket.on("message", msg => {

if(typingMsg){
typingMsg.remove()
typingMsg = null
}

addMessage(msg,"other")

})

function nextUser(){

addMessage("Finding new stranger...")

socket.emit("next")

setTimeout(()=>{
socket.emit("find","text")
},500)

}

socket.on("users", count => {

users.innerHTML = `<span class="dot"></span> Online: ${count}`

})

input.addEventListener("keypress",function(e){

if(e.key==="Enter"){
sendMessage()
}

})

input.addEventListener("input",()=>{

if(!partner) return

socket.emit("typing",{to:partner})

})

socket.on("typing",()=>{

if(typingMsg) return

typingMsg = document.createElement("div")

typingMsg.classList.add("msg","msg-system")

typingMsg.innerText="Stranger is typing..."

messages.appendChild(typingMsg)

messages.scrollTop = messages.scrollHeight

setTimeout(()=>{

if(typingMsg){
typingMsg.remove()
typingMsg=null
}

},1500)

})