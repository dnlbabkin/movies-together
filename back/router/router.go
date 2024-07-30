package router

import (
	"back/service"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"log"
	"net/http"
)

func Router() {
	router := mux.NewRouter()

	router.HandleFunc("/createRoom", service.CreateRoom).Methods("GET")
	router.HandleFunc("/joinRoom/{roomId}/{userId}", service.JoinRoom).Methods("GET")
	router.HandleFunc("/leaveRoom/{roomId}/{userId}", service.LeaveRoom).Methods("GET")

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
