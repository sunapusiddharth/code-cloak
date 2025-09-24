use axum::{
    routing::{get, post, put, delete},
    extract::{Path, Json},
    http::StatusCode,
    response::IntoResponse,
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
struct User {
    id: Uuid,
    name: String,
    email: String,
    address: String,
    phone: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct Product {
    id: Uuid,
    name: String,
    description: String,
    price: f64,
    stock: u32,
    category: String,
    brand: String,
    image_url: String,
    rating: f32,
    is_active: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct Order {
    id: Uuid,
    user_id: Uuid,
    product_ids: Vec<Uuid>,
    total_amount: f64,
    status: String,
    shipping_address: String,
    created_at: String,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        // User routes
        .route("/users", get(get_users).post(create_user))
        .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
        // Product routes
        .route("/products", get(get_products).post(create_product))
        .route("/products/:id", get(get_product).put(update_product).delete(delete_product))
        // Order routes
        .route("/orders", get(get_orders).post(create_order))
        .route("/orders/:id", get(get_order).put(update_order).delete(delete_order));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🚀 Server running at http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

// ---------------- Users ----------------
async fn get_users() -> impl IntoResponse {
    Json(vec![
        User {
            id: Uuid::new_v4(),
            name: "Alice".into(),
            email: "alice@example.com".into(),
            address: "123 Main St".into(),
            phone: "+91-9876543210".into(),
        },
        User {
            id: Uuid::new_v4(),
            name: "Bob".into(),
            email: "bob@example.com".into(),
            address: "456 Elm St".into(),
            phone: "+91-9123456780".into(),
        },
    ])
}

async fn create_user(Json(payload): Json<User>) -> impl IntoResponse {
    println!("Creating user: {:?}", payload);
    (StatusCode::CREATED, Json(payload))
}

async fn get_user(Path(id): Path<Uuid>) -> impl IntoResponse {
    Json(User {
        id,
        name: "Dummy User".into(),
        email: "dummy@example.com".into(),
        address: "789 Oak St".into(),
        phone: "+91-9000000000".into(),
    })
}

async fn update_user(Path(id): Path<Uuid>, Json(payload): Json<User>) -> impl IntoResponse {
    println!("Updating user {}: {:?}", id, payload);
    Json(payload)
}

async fn delete_user(Path(id): Path<Uuid>) -> impl IntoResponse {
    println!("Deleting user {}", id);
    StatusCode::NO_CONTENT
}

// ---------------- Products ----------------
async fn get_products() -> impl IntoResponse {
    Json(vec![
        Product {
            id: Uuid::new_v4(),
            name: "Smartphone".into(),
            description: "Latest model with 128GB storage".into(),
            price: 49999.0,
            stock: 50,
            category: "Electronics".into(),
            brand: "TechBrand".into(),
            image_url: "https://example.com/images/smartphone.jpg".into(),
            rating: 4.5,
            is_active: true,
        },
        Product {
            id: Uuid::new_v4(),
            name: "Running Shoes".into(),
            description: "Comfortable and durable".into(),
            price: 2999.0,
            stock: 120,
            category: "Footwear".into(),
            brand: "RunFast".into(),
            image_url: "https://example.com/images/shoes.jpg".into(),
            rating: 4.2,
            is_active: true,
        },
    ])
}

async fn create_product(Json(payload): Json<Product>) -> impl IntoResponse {
    println!("Creating product: {:?}", payload);
    (StatusCode::CREATED, Json(payload))
}

async fn get_product(Path(id): Path<Uuid>) -> impl IntoResponse {
    Json(Product {
        id,
        name: "Sample Product".into(),
        description: "This is a sample product.".into(),
        price: 999.0,
        stock: 10,
        category: "Misc".into(),
        brand: "Generic".into(),
        image_url: "https://example.com/images/sample.jpg".into(),
        rating: 3.8,
        is_active: true,
    })
}

async fn update_product(Path(id): Path<Uuid>, Json(payload): Json<Product>) -> impl IntoResponse {
    println!("Updating product {}: {:?}", id, payload);
    Json(payload)
}

async fn delete_product(Path(id): Path<Uuid>) -> impl IntoResponse {
    println!("Deleting product {}", id);
    StatusCode::NO_CONTENT
}

// ---------------- Orders ----------------
async fn get_orders() -> impl IntoResponse {
    Json(vec![
        Order {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            product_ids: vec![Uuid::new_v4(), Uuid::new_v4()],
            total_amount: 52998.0,
            status: "Processing".into(),
            shipping_address: "123 Main St".into(),
            created_at: "2025-09-24T20:00:00Z".into(),
        },
    ])
}

async fn create_order(Json(payload): Json<Order>) -> impl IntoResponse {
    println!("Creating order: {:?}", payload);
    (StatusCode::CREATED, Json(payload))
}

async fn get_order(Path(id): Path<Uuid>) -> impl IntoResponse {
    Json(Order {
        id,
        user_id: Uuid::new_v4(),
        product_ids: vec![Uuid::new_v4()],
        total_amount: 2999.0,
        status: "Delivered".into(),
        shipping_address: "456 Elm St".into(),
        created_at: "2025-09-20T10:00:00Z".into(),
    })
}

async fn update_order(Path(id): Path<Uuid>, Json(payload): Json<Order>) -> impl IntoResponse {
    println!("Updating order {}: {:?}", id, payload);
    Json(payload)
}

async fn delete_order(Path(id): Path<Uuid>) -> impl IntoResponse {
    println!("Deleting order {}", id);
    StatusCode::NO_CONTENT
}
