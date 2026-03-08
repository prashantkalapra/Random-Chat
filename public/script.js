const socket = io()

let peer
let partner = null
let mode = "text"
let localStream

const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")
const messages = document.getElementById("messages")

function msg(text){
const d=document.createElement("div")
d.innerText=text
messages.appendChild(d)
}

socket.on("users", n=>{
document.getElementById("users").innerText="Online: "+n
})

function startText(){

mode="text"
msg("Searching...")
socket.emit("find","text")

}

async function startVideo(){

mode="video"

localStream = await navigator.mediaDevices.getUserMedia({
video:true,
audio:true
})

localVideo.srcObject = localStream

msg("Searching...")
socket.emit("find","video")

}

socket.on("matched", id=>{

partner=id
msg("Stranger connected")

if(mode==="video"){
startPeer(true)
}

})

function startPeer(initiator){

peer = new RTCPeerConnection({
iceServers:[
{urls:"stun:stun.l.google.com:19302"}
]
})

localStream.getTracks().forEach(t=>{
peer.addTrack(t,localStream)
})

peer.ontrack=e=>{
remoteVideo.srcObject=e.streams[0]
}

peer.onicecandidate=e=>{
if(e.candidate){
socket.emit("signal",{to:partner,data:e.candidate,type:"candidate"})
}
}

if(initiator){

peer.createOffer().then(o=>{
peer.setLocalDescription(o)
socket.emit("signal",{to:partner,data:o,type:"offer"})
})

}

}

socket.on("signal", async d=>{

if(d.type==="offer"){

startPeer(false)

await peer.setRemoteDescription(d.data)

const ans = await peer.createAnswer()
await peer.setLocalDescription(ans)

socket.emit("signal",{to:partner,data:ans,type:"answer"})

}

if(d.type==="answer"){
await peer.setRemoteDescription(d.data)
}

if(d.type==="candidate"){
peer.addIceCandidate(d.data)
}

})

function sendMessage(){

const input=document.getElementById("msg")

if(!input.value) return

msg("You: "+input.value)

socket.emit("message",{to:partner,msg:input.value})

input.value=""

}

socket.on("message", m=>{
msg("Stranger: "+m)
})

function nextUser(){

if(peer){
peer.close()
peer=null
}

remoteVideo.srcObject=null

msg("Searching new stranger...")

socket.emit("next")

setTimeout(()=>{
socket.emit("find",mode)
},500)

}