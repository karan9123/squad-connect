package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// Room structure to manage participants
type Room struct {
	ID           string
	Participants map[string]*websocket.Conn
	mu           sync.Mutex
}

// SignalingServer structure to manage rooms
type SignalingServer struct {
	Rooms map[string]*Room
	mu    sync.Mutex
}

var server = SignalingServer{
	Rooms: make(map[string]*Room),
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Handle WebSocket connection
func (s *SignalingServer) HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade connection:", err)
		return
	}
	defer conn.Close()

	// Placeholder: In a real-world scenario, handle room joining here
	roomID := "default" // Simplified for now
	participantID := r.URL.Query().Get("participant")

	s.JoinRoom(roomID, participantID, conn)

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		s.HandleMessage(roomID, participantID, message)
	}
}

// Handle incoming signaling messages
func (s *SignalingServer) HandleMessage(roomID string, participantID string, message []byte) {
	room, exists := s.Rooms[roomID]
	if !exists {
		log.Println("Room not found:", roomID)
		return
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	for id, conn := range room.Participants {
		if id != participantID {
			err := conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Println("Write error:", err)
				conn.Close()
				delete(room.Participants, id)
			}
		}
	}
}

// JoinRoom allows a participant to join a room
func (s *SignalingServer) JoinRoom(roomID string, participantID string, conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, exists := s.Rooms[roomID]
	if !exists {
		room = &Room{
			ID:           roomID,
			Participants: make(map[string]*websocket.Conn),
		}
		s.Rooms[roomID] = room
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	room.Participants[participantID] = conn
	log.Printf("Participant %s joined room %s", participantID, roomID)
}

func main() {
	http.HandleFunc("/ws", server.HandleConnection)
	http.HandleFunc("/health", healthCheckHandler)

	log.Println("Signaling server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// healthCheckHandler responds with a simple health check message
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Yooo!, this is a running server"))
	log.Println("Health check endpoint hit")
}
