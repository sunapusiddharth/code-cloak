package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/google/uuid"
    "github.com/gorilla/mux"
)

type User struct {
    ID      string `json:"id"`
    Name    string `json:"name"`
    Email   string `json:"email"`
    Address string `json:"address"`
    Phone   string `json:"phone"`
}

type Product struct {
    ID          string  `json:"id"`
    Name        string  `json:"name"`
    Description string  `json:"description"`
    Price       float64 `json:"price"`
    Stock       int     `json:"stock"`
    Category    string  `json:"category"`
    Brand       string  `json:"brand"`
    ImageURL    string  `json:"image_url"`
    Rating      float32 `json:"rating"`
    IsActive    bool    `json:"is_active"`
}

type Order struct {
    ID              string   `json:"id"`
    UserID          string   `json:"user_id"`
    ProductIDs      []string `json:"product_ids"`
    TotalAmount     float64  `json:"total_amount"`
    Status          string   `json:"status"`
    ShippingAddress string   `json:"shipping_address"`
    CreatedAt       string   `json:"created_at"`
}

var users []User
var products []Product
var orders []Order

func main() {
    r := mux.NewRouter()

    // Users
    r.HandleFunc("/users", getUsers).Methods("GET")
    r.HandleFunc("/users", createUser).Methods("POST")
    r.HandleFunc("/users/{id}", getUser).Methods("GET")
    r.HandleFunc("/users/{id}", updateUser).Methods("PUT")
    r.HandleFunc("/users/{id}", deleteUser).Methods("DELETE")

    // Products
    r.HandleFunc("/products", getProducts).Methods("GET")
    r.HandleFunc("/products", createProduct).Methods("POST")
    r.HandleFunc("/products/{id}", getProduct).Methods("GET")
    r.HandleFunc("/products/{id}", updateProduct).Methods("PUT")
    r.HandleFunc("/products/{id}", deleteProduct).Methods("DELETE")

    // Orders
    r.HandleFunc("/orders", getOrders).Methods("GET")
    r.HandleFunc("/orders", createOrder).Methods("POST")
    r.HandleFunc("/orders/{id}", getOrder).Methods("GET")
    r.HandleFunc("/orders/{id}", updateOrder).Methods("PUT")
    r.HandleFunc("/orders/{id}", deleteOrder).Methods("DELETE")

    fmt.Println("🚀 Go server running on http://localhost:3000")
    http.ListenAndServe(":3000", r)
}

// Handlers for Users
func getUsers(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(users)
}

func createUser(w http.ResponseWriter, r *http.Request) {
    var u User
    json.NewDecoder(r.Body).Decode(&u)
    u.ID = uuid.New().String()
    users = append(users, u)
    json.NewEncoder(w).Encode(u)
}

func getUser(w http.ResponseWriter, r *http.Request) {
    id := mux.Vars(r)["id"]
    for _, u := range users {
        if u.ID == id {
            json.NewEncoder(w).Encode(u)
            return
        }
    }
    w.WriteHeader(http.StatusNotFound)
}

func updateUser(w http.ResponseWriter, r *http.Request) {
    id := mux.Vars(r)["id"]
    var updated User
    json.NewDecoder(r.Body).Decode(&updated)
    for i, u := range users {
        if u.ID == id {
            updated.ID = id
            users[i] = updated
            json.NewEncoder(w).Encode(updated)
            return
        }
    }
    w.WriteHeader(http.StatusNotFound)
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
    id := mux.Vars(r)["id"]
    for i, u := range users {
        if u.ID == id {
            users = append(users[:i], users[i+1:]...)
            w.WriteHeader(http.StatusNoContent)
            return
        }
    }
    w.WriteHeader(http.StatusNotFound)
}

// Handlers for Products
func getProducts(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(products)
}

func createProduct(w http.ResponseWriter, r *http.Request) {
    var p Product
    json.NewDecoder(r.Body).Decode(&p)
    p.ID = uuid.New().String()
    products = append(products, p)
    json.NewEncoder(w).Encode(p)
}

func getProduct(w http.ResponseWriter, r *http.Request) {
    id := mux.Vars(r)["id"]
    for _, p := range products {
        if p.ID == id {
            json.NewEncoder(w).Encode(p)
            return
        }
    }
    w.WriteHeader(http.StatusNotFound)
}

func updateProduct(w http.ResponseWriter, r *http.Request) {
    id := mux.Vars(r)["id"]
    var updated Product
    json.NewDecoder(r.Body).Decode(&updated)
    for i, p := range products {
        if p.ID == id {
            updated.ID = id
