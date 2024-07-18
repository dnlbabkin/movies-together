package main

import (
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"log"
	"net/http"
)

type Room struct {
	Users map[string]*websocket.Conn
}

var rooms = make(map[string]*Room)
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func createRoom(w http.ResponseWriter, r *http.Request) {
	roomId := r.URL.Query().Get("roomId")
	if roomId == "" {
		http.Error(w, "roomId is reqiered", http.StatusBadRequest)
		return
	}

	if _, exists := rooms[roomId]; exists {
		http.Error(w, "Room already exists", http.StatusConflict)
		return
	}

	rooms[roomId] = &Room{Users: make(map[string]*websocket.Conn)}
	log.Printf("Room %s created", roomId)
	w.WriteHeader(http.StatusCreated)
}

func joinRoom(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roomId := vars["roomId"]
	userId := vars["userId"]

	log.Printf("Attempting to join room %s by user %s", roomId, userId)

	room, exists := rooms[roomId]
	if !exists {
		log.Printf("Room %s not found", roomId)
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade connection:", err)
		return
	}

	room.Users[userId] = conn
	log.Printf("User %s joined room %s", userId, roomId)
	defer func() {
		conn.Close()
		delete(room.Users, userId)
		log.Printf("User %s left room %s", userId, roomId)
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		for id, userConn := range room.Users {
			if id != userId {
				err = userConn.WriteMessage(websocket.TextMessage, message)
				if err != nil {
					log.Println("Error writing message:", err)
				}
			}
		}
	}
}

func main() {
	router := mux.NewRouter()

	router.HandleFunc("/createRoom", createRoom).Methods("GET")
	router.HandleFunc("/joinRoom/{roomID}/{userID}", joinRoom).Methods("GET")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return origin == "http://localhost:3000"
		},
	})

	handler := c.Handler(router)

	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
