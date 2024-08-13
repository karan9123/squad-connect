package main

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// Room structure to hold room ID and participants
type Room struct {
	ID           string
	Participants map[string]*websocket.Conn
	Mutex        sync.Mutex
}

// SignalingServer structure to manage rooms
type SignalingServer struct {
	Rooms map[string]*Room
	Mutex sync.Mutex
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// HandleConnection handles new WebSocket connections
func (s *SignalingServer) HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Failed to upgrade to WebSocket:", err)
		return
	}
	defer conn.Close()

	// Read initial message to determine room and participant ID
	var msg struct {
		RoomID        string `json:"room_id"`
		ParticipantID string `json:"participant_id"`
	}
	err = conn.ReadJSON(&msg)
	if err != nil {
		fmt.Println("Failed to read JSON message:", err)
		return
	}

	// Join the participant to the room
	s.JoinRoom(msg.RoomID, msg.ParticipantID, conn)

	// Handle further signaling messages
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Failed to read message:", err)
			break
		}
		s.HandleMessage(msg.RoomID, message)
	}

	// Remove participant from room on disconnection
	s.LeaveRoom(msg.RoomID, msg.ParticipantID)
}

// JoinRoom adds a participant to the specified room
func (s *SignalingServer) JoinRoom(roomID string, participantID string, conn *websocket.Conn) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()

	room, exists := s.Rooms[roomID]
	if !exists {
		room = &Room{
			ID:           roomID,
			Participants: make(map[string]*websocket.Conn),
		}
		s.Rooms[roomID] = room
	}

	room.Mutex.Lock()
	room.Participants[participantID] = conn
	room.Mutex.Unlock()

	fmt.Printf("Participant %s joined room %s\n", participantID, roomID)
}

// LeaveRoom removes a participant from the specified room
func (s *SignalingServer) LeaveRoom(roomID string, participantID string) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()

	room, exists := s.Rooms[roomID]
	if !exists {
		return
	}

	room.Mutex.Lock()
	delete(room.Participants, participantID)
	room.Mutex.Unlock()

	fmt.Printf("Participant %s left room %s\n", participantID, roomID)

	if len(room.Participants) == 0 {
		delete(s.Rooms, roomID)
		fmt.Printf("Room %s is empty and has been removed\n", roomID)
	}
}

// HandleMessage relays signaling messages to all participants in the room
func (s *SignalingServer) HandleMessage(roomID string, message []byte) {
	room, exists := s.Rooms[roomID]
	if !exists {
		return
	}

	room.Mutex.Lock()
	defer room.Mutex.Unlock()

	for _, conn := range room.Participants {
		err := conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			fmt.Println("Failed to send message:", err)
		}
	}
}

func main() {
	server := &SignalingServer{
		Rooms: make(map[string]*Room),
	}

	http.HandleFunc("/ws", server.HandleConnection)

	fmt.Println("Signaling server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("Failed to start server:", err)
	}
}
