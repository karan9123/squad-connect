# Squad Connect

**Squad Connect** is a video conferencing application developed in Go and JavaScript. It allows users to participate in video calls with multiple peers, handle audio and video streams, and supports basic controls for muting/unmuting and stopping/starting video. The application uses WebRTC for peer-to-peer communication and a signaling server to manage connections and media streaming.

## Features

- **Real-time Video Conferencing**: Participate in video calls with multiple users.
- **Audio and Video Controls**: Mute/unmute audio and start/stop video streams.
- **Multi-Peer Connections**: Handle multiple peer connections in a single room.
- **User Interface**: Basic UI for video display and control buttons.

## Architecture

The application consists of the following components:

1. **Web Client**:
   - Implemented in JavaScript.
   - Handles user interface, WebRTC peer connections, and signaling.

2. **Signaling Server**:
   - Implemented in Go.
   - Manages WebSocket connections for signaling.
   - Handles room creation and participant management.

3. **WebRTC Peer Connection**:
   - Manages direct peer-to-peer communication.
   - Handles audio and video streams.

## Setup

### Prerequisites

- Go (1.16+)
- Node.js (for client-side development)
- Web browser with WebRTC support

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/karan9123/squad-connect.git
   cd squad-connect
   ```

2. **Set Up the Server:**

   Navigate to the server directory and build the Go server:

   ```bash
   cd server
   go build -o server
   ```

   Start the server:

   ```bash
   ./server
   ```

3. **Set Up the Client:**

   Navigate to the client directory and install dependencies:

   ```bash
   cd client
   npm install
   ```

   Start the client:

   ```bash
   npm start
   ```

   Open the client in your web browser at `http://localhost:3000`.

## Usage

1. **Start the Server**: Ensure the Go server is running.

2. **Start the Client**: Run the client application and open it in multiple browser tabs or different browsers.

3. **Join a Room**: Use the client interface to connect to a room and start video conferencing.

## Development

### Directory Structure

- `client/`: Contains the client-side code and assets.
- `server/`: Contains the Go code for the signaling server.

### Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [WebRTC](https://webrtc.org/) for real-time communication.
- [Gorilla WebSocket](https://github.com/gorilla/websocket) for WebSocket handling in Go.
- [pion/webrtc](https://github.com/pion/webrtc) for WebRTC support in Go.