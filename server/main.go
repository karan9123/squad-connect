package main

import (
	"log"
	"net/http"
)

func main() {
	// Set up a simple HTTP server
	http.HandleFunc("/health", healthCheckHandler)

	// Start the server on port 8080
	log.Println("Starting server on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// healthCheckHandler responds with a simple health check message
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Server is up and running!"))
	log.Println("Health check endpoint hit")
}
