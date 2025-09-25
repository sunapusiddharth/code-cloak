use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

// Define a simple struct for JSON responses
#[derive(Serialize, Deserialize)]
struct Message {
    content: String,
}

// GET /hello
async fn hello() -> &'static str {
    "Hello from Rust server!"
}

// GET /ping
async fn ping() -> Json<Message> {
    Json(Message {
        content: "pong".to_string(),
    })
}

// POST /echo
async fn echo(Json(payload): Json<Message>) -> Json<Message> {
    Json(Message {
        content: format!("Echo: {}", payload.content),
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/hello", get(hello))
        .route("/ping", get(ping))
        .route("/echo", post(echo));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🚀 Server running at http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
