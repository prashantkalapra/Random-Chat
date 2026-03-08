const socket = io()

let localStream
let peer
let partnerId=null
let mode="text"

const localVideo=document.getElementById("localVideo")
const remoteVideo=document.getElementById("remoteVideo")
const messages=document.getElementById("messages")

function addMessage(msg){

let div=document.createElement("div")
div.innerText=msg
messages.appendChild(div)

}

function startText(){

mode="text"

addMessage("Searching stranger...")

socket.emit("find","text")

}

async function startVideo(){

mode="video"

try{

localStream = await navigator.mediaDevices.getUserMedia({
video:true,
audio:true
})

localVideo.srcObject=localStream

addMessage("Searching stranger...")

socket.emit("find","video")

}catch(err){

alert("Camera permission needed")

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

peer=new RTCPeerConnection({

iceServers:[
{urls:"stun:stun.l.google.com:19302"}
]

})

localStream.getTracks().forEach(track=>{
peer.addTrack(track,localStream)
})

peer.ontrack=(e)=>{
remoteVideo.srcObject=e.streams[0]
}

peer.onicecandidate=(e)=>{

if(e.candidate){

socket.emit("candidate",{
candidate:e.candidate,
to:partnerId
})

}

}

createOffer()

}

async function createOffer(){

const offer=await peer.createOffer()

await peer.setLocalDescription(offer)

socket.emit("offer",{
offer:offer,
to:partnerId
})

}

socket.on("offer",async(data)=>{

partnerId=data.from

createPeer()

await peer.setRemoteDescription(data.offer)

const answer=await peer.createAnswer()

await peer.setLocalDescription(answer)

socket.emit("answer",{
answer:answer,
to:partnerId
})

})

socket.on("answer",async(data)=>{

await peer.setRemoteDescription(data.answer)

})

socket.on("candidate",async(data)=>{

try{
await peer.addIceCandidate(data.candidate)
}catch(e){}

})

function sendMessage(){

const input=document.getElementById("messageInput")

const msg=input.value

if(!msg) return

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

if(peer){
peer.close()
peer=null
}

remoteVideo.srcObject=null

socket.emit("next")

setTimeout(()=>{
socket.emit("find",mode)
},500)

}