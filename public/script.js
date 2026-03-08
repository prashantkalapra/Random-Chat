const socket = io()

let localStream
let peer
let partnerId = null
let mode = "text"

const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")
const messages = document.getElementById("messages")

function addMessage(msg){
let div = document.createElement("div")
div.innerText = msg
messages.appendChild(div)
}

async function startText(){
mode="text"
socket.emit("find","text")
addMessage("Searching for stranger...")
}

async function startVideo(){

mode="video"

try{

localStream = await navigator.mediaDevices.getUserMedia({
video:true,
audio:true
})

localVideo.srcObject = localStream

socket.emit("find","video")

addMessage("Searching for stranger...")

}catch(err){
alert("Camera permission denied")
}

}

socket.on("matched",(id)=>{

partnerId=id

addMessage("Stranger connected")

if(mode==="video"){
createPeer()
}

})

function createPeer(){

peer = new RTCPeerConnection({
iceServers:[
{urls:"stun:stun.l.google.com:19302"},
{
urls:"turn:openrelay.metered.ca:80",
username:"openrelayproject",
credential:"openrelayproject"
}
]
})

localStream.getTracks().forEach(track=>{
peer.addTrack(track,localStream)
})

peer.ontrack=(event)=>{
remoteVideo.srcObject = event.streams[0]
}

peer.onicecandidate=(event)=>{
if(event.candidate){
socket.emit("candidate",{
candidate:event.candidate,
to:partnerId
})
}
}

createOffer()

}

async function createOffer(){

let offer = await peer.createOffer()

await peer.setLocalDescription(offer)

socket.emit("offer",{
offer:offer,
to:partnerId
})

}

socket.on("offer",async(data)=>{

partnerId=data.from

createPeer()

await peer.setRemoteDescription(new RTCSessionDescription(data.offer))

let answer = await peer.createAnswer()

await peer.setLocalDescription(answer)

socket.emit("answer",{
answer:answer,
to:partnerId
})

})

socket.on("answer",async(data)=>{

await peer.setRemoteDescription(new RTCSessionDescription(data.answer))

})

socket.on("candidate",async(data)=>{

try{
await peer.addIceCandidate(new RTCIceCandidate(data.candidate))
}catch(e){}

})

function sendMessage(){

let input=document.getElementById("messageInput")

let msg=input.value

if(msg==="") return

addMessage("You: "+msg)

socket.emit("message",{
msg:msg,
to:partnerId
})

input.value=""

}

socket.on("message",(msg)=>{
addMessage("Stranger: "+msg)
})

function nextUser(){

addMessage("Finding new stranger...")

// close old peer
if(peer){
peer.ontrack=null
peer.onicecandidate=null
peer.close()
peer=null
}

// stop camera
if(localStream){
localStream.getTracks().forEach(track=>track.stop())
localStream=null
}

remoteVideo.srcObject=null

socket.emit("next")

setTimeout(()=>{
socket.emit("find",mode)
},500)

}

socket.on("partner-disconnected",()=>{

addMessage("Stranger disconnected")

nextUser()

})