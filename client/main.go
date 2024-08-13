package main

import (
	"html/template"
	"log"
	"net/http"
)

// HomeHandler serves the main page with the WebRTC client
func HomeHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("index.html")
	if err != nil {
		log.Println("Error parsing template:", err)
		return
	}
	tmpl.Execute(w, nil)
}

func main() {
	http.HandleFunc("/", HomeHandler)
	http.HandleFunc("/health", healthCheckHandler)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("client/static"))))

	log.Println("Client server started on :8081")
	err := http.ListenAndServe(":8081", nil)
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
