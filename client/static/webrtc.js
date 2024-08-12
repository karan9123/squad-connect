let localVideo = document.getElementById('localVideo');
let remoteVideos = document.getElementById('remoteVideos');
let muteButton = document.getElementById('muteButton');
let videoButton = document.getElementById('videoButton');

let localStream;
let peerConnections = {};
let ws;

let isAudioMuted = false;
let isVideoStopped = false;

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

    // Listen for new messages (offers, answers, and ICE candidates)
    ws.onmessage = handleSignalingMessage;

    // Set up event listeners for mute and video buttons
    muteButton.addEventListener('click', toggleMute);
    videoButton.addEventListener('click', toggleVideo);
}

function toggleMute() {
    isAudioMuted = !isAudioMuted;
    localStream.getAudioTracks()[0].enabled = !isAudioMuted;
    muteButton.textContent = isAudioMuted ? 'Unmute' : 'Mute';
}

function toggleVideo() {
    isVideoStopped = !isVideoStopped;
    localStream.getVideoTracks()[0].enabled = !isVideoStopped;
    videoButton.textContent = isVideoStopped ? 'Start Video' : 'Stop Video';
}

function handleSignalingMessage(message) {
    const data = JSON.parse(message.data);
    const participantID = data.participantID;

    if (!peerConnections[participantID]) {
        createPeerConnection(participantID);
    }

    const peerConnection = peerConnections[participantID];

    if (data.type === 'offer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        peerConnection.createAnswer().then(answer => {
            peerConnection.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp, participantID: participantID }));
        });
    } else if (data.type === 'answer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
    } else if (data.type === 'candidate') {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
}

function createPeerConnection(participantID) {
    const peerConnection = new RTCPeerConnection(config);

    // Add local stream tracks to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Set up event listeners for WebRTC events
    peerConnection.onicecandidate = event => handleICECandidateEvent(event, participantID);
    peerConnection.ontrack = event => handleTrackEvent(event, participantID);
    peerConnection.onconnectionstatechange = handleConnectionStateChange;

    peerConnections[participantID] = peerConnection;
}

function handleICECandidateEvent(event, participantID) {
    if (event.candidate) {
        ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate, participantID: participantID }));
    }
}

function handleTrackEvent(event, participantID) {
    let videoElement = document.getElementById(`video-${participantID}`);

    if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.id = `video-${participantID}`;
        videoElement.autoplay = true;
        remoteVideos.appendChild(videoElement);
    }

    videoElement.srcObject = event.streams[0];
}

function handleConnectionStateChange(event) {
    if (peerConnection.connectionState === 'connected') {
        console.log('Peers connected!');
    }
}

start();
