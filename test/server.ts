import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(bodyParser.json());

interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  imageUrl: string;
  rating: number;
  isActive: boolean;
}

interface Order {
  id: string;
  userId: string;
  productIds: string[];
  totalAmount: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
}

// Dummy data
const users: User[] = [];
const products: Product[] = [];
const orders: Order[] = [];

// Users
app.get('/users', (_, res) => res.json(users));
app.post('/users', (req, res) => {
  const user: User = { id: uuidv4(), ...req.body };
  users.push(user);
  res.status(201).json(user);
});
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  res.json(user || {});
});
app.put('/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  users[index] = { ...users[index], ...req.body };
  res.json(users[index]);
});
app.delete('/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  users.splice(index, 1);
  res.sendStatus(204);
});

// Products
app.get('/products', (_, res) => res.json(products));
app.post('/products', (req, res) => {
  const product: Product = { id: uuidv4(), ...req.body };
  products.push(product);
  res.status(201).json(product);
});
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  res.json(product || {});
});
app.put('/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});
app.delete('/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  products.splice(index, 1);
  res.sendStatus(204);
});

// Orders
app.get('/orders', (_, res) => res.json(orders));
app.post('/orders', (req, res) => {
  const order: Order = { id: uuidv4(), createdAt: new Date().toISOString(), ...req.body };
  orders.push(order);
  res.status(201).json(order);
});
app.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  res.json(order || {});
});
app.put('/orders/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  orders[index] = { ...orders[index], ...req.body };
  res.json(orders[index]);
});
app.delete('/orders/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  orders.splice(index, 1);
  res.sendStatus(204);
});

app.listen(3000, () => console.log('🚀 TypeScript server running on http://localhost:3000'));


function add(){
  console.log("hel;lo")
}