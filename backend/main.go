package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	// Start HTTP server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// API routes
	http.HandleFunc("/api/products", productsHandler)
	http.HandleFunc("/api/orders", ordersHandler)

	// Serve frontend files
	http.Handle("/", serveFrontend())

	log.Printf("🚀 Server running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func productsHandler(w http.ResponseWriter, r *http.Request) {
	products := []map[string]interface{}{
		{
			"id":    1,
			"name":  "Classic Cotton T-Shirt",
			"price": 24.99,
			"desc":  "100% premium cotton",
		},
		{
			"id":    2,
			"name":  "Designer Denim Jeans",
			"price": 59.99,
			"desc":  "Slim fit denim",
		},
		{
			"id":    3,
			"name":  "Summer Floral Dress",
			"price": 49.99,
			"desc":  "Lightweight summer dress",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func ordersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethod