const socket = io()

let mode="text"
let localStream=null
let peer=null
let partnerId=null

const localVideo=document.getElementById("localVideo")
const remoteVideo=document.getElementById("remoteVideo")

function startText(){

mode="text"

document.getElementById("start").style.display="none"
document.getElementById("chat").style.display="block"

socket.emit("find","text")

}

async function startVideo(){

mode="video"

document.getElementById("start").style.display="none"
document.getElementById("chat").style.display="block"

localVideo.style.display="inline"
remoteVideo.style.display="inline"

localStream = await navigator.mediaDevices.getUserMedia({
video:true,
audio:true
})

localVideo.srcObject = localStream

socket.emit("find","video")

}

socket.on("online",(count)=>{
document.getElementById("users").innerText=count
})

socket.on("matched",(id)=>{

partnerId=id

addMessage("Connected to stranger")

if(mode==="video"){
startPeer()
}

})

function startPeer(){

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

socket.emit("signal",{
to:partnerId,
signal:{candidate:e.candidate}
})

}

}

peer.createOffer().then(offer=>{

peer.setLocalDescription(offer)

socket.emit("signal",{
to:partnerId,
signal:{offer:offer}
})

})

}

socket.on("signal",async(data)=>{

if(data.signal.offer){

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

socket.emit("signal",{
to:data.from,
signal:{candidate:e.candidate}
})

}

}

await peer.setRemoteDescription(data.signal.offer)

const answer=await peer.createAnswer()

await peer.setLocalDescription(answer)

socket.emit("signal",{
to:data.from,
signal:{answer:answer}
})

}

if(data.signal.answer){

await peer.setRemoteDescription(data.signal.answer)

}

if(data.signal.candidate){

try{
await peer.addIceCandidate(data.signal.candidate)
}catch(e){}

}

})

socket.on("message",(msg)=>{
addMessage("Stranger: "+msg)
})

function sendMessage(){

let input=document.getElementById("message")

socket.emit("message",input.value)

addMessage("You: "+input.value)

input.value=""

}

function addMessage(msg){

let box=document.getElementById("messages")

box.innerHTML+="<div>"+msg+"</div>"

box.scrollTop=box.scrollHeight

}

function nextUser(){

document.getElementById("messages").innerHTML=""

if(peer){
peer.close()
peer=null
}

socket.emit("next")
socket.emit("find",mode)

}

socket.on("partner-left",()=>{
addMessage("Stranger disconnected")
})