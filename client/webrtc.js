let localVideo = document.getElementById('localVideo');
let remoteVideos = document.getElementById('remoteVideos');
let muteButton = document.getElementById('muteButton');
let videoButton = document.getElementById('videoButton');

let localStream;
let peerConnections = {};
let ws;

let isAudioMuted = false;
let isVideoStopped = false;

let signalingConnection;

const config = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

async function connectToRoom() {
    const roomID = document.getElementById('roomID').value;
    const participantID = document.getElementById('participantID').value;

    if (!roomID || !participantID) {
        alert('Please enter both Room ID and Participant ID.');
        return;
    }

    signalingConnection = new WebSocket(`ws://localhost:8080/ws?participant=${participantID}`);

    signalingConnection.onopen = async () => {
        signalingConnection.send(JSON.stringify({ room_id: roomID, participant_id: participantID }));

        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        signalingConnection.onmessage = handleSignalingMessage;
    };

    signalingConnection.onclose = () => {
        console.log('Connection closed');
    };
}

function handleSignalingMessage(message) {
    const data = JSON.parse(message.data);
    const participantID = data.participant_id;

    if (!peerConnections[participantID]) {
        peerConnections[participantID] = createPeerConnection(participantID);
    }

    const peerConnection = peerConnections[participantID];

    if (data.type === 'offer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        peerConnection.createAnswer().then(answer => {
            peerConnection.setLocalDescription(answer);
            signalingConnection.send(JSON.stringify({
                type: 'answer',
                answer: answer,
                participant_id: participantID
            }));
        });
    } else if (data.type === 'answer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.type === 'ice-candidate') {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
}

async function createPeerConnection(participantID) {
    const peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = event => handleTrackEvent(event, participantID);
    peerConnection.onicecandidate = event => handleICECandidateEvent(event, participantID);

    return peerConnection;
}

function handleICECandidateEvent(event, participantID) {
    if (event.candidate) {
        signalingConnection.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            participant_id: participantID
        }));
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

async function start() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Initialize WebSocket connection
    ws = new WebSocket('ws://localhost:8080/ws?participant=client1');
    ws.onmessage = handleSignalingMessage;

    // Set up event listeners for mute and video buttons
    muteButton.addEventListener('click', toggleMute);
    videoButton.addEventListener('click', toggleVideo);
}

start();
