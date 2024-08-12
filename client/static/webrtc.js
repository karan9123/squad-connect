let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
let ws;

const config = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

async function start() {
    // Get user media (audio and video)
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Initialize WebSocket connection
    ws = new WebSocket('ws://localhost:8080/ws?participant=client1');
    ws.onmessage = handleSignalingMessage;

    // Create WebRTC peer connection
    peerConnection = new RTCPeerConnection(config);

    // Add local stream tracks to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Set up event listeners for WebRTC events
    peerConnection.onicecandidate = handleICECandidateEvent;
    peerConnection.ontrack = handleTrackEvent;
    peerConnection.onconnectionstatechange = handleConnectionStateChange;

    // Create and send an SDP offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', sdp: offer.sdp }));
}

function handleSignalingMessage(message) {
    const data = JSON.parse(message.data);

    if (data.type === 'offer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        peerConnection.createAnswer().then(answer => {
            peerConnection.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
        });
    } else if (data.type === 'answer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
    } else if (data.type === 'candidate') {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
}

function handleICECandidateEvent(event) {
    if (event.candidate) {
        ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    }
}

function handleTrackEvent(event) {
    remoteVideo.srcObject = event.streams[0];
}

function handleConnectionStateChange(event) {
    if (peerConnection.connectionState === 'connected') {
        console.log('Peers connected!');
    }
}

start();
