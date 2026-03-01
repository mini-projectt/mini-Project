# RentEase - Rental App

A full-stack rental application built with **React**, **Node.js**, **Express**, and **MongoDB**.

## Project Structure

```
mini project/
├── backend/          → Express + MongoDB API
│   ├── models/       → Mongoose models (Item, Order)
│   ├── routes/       → API routes (items, orders)
│   ├── server.js     → Express app entry point
│   ├── seed.js       → Database seeder
│   └── .env          → Environment variables
└── frontend/         → React app
    └── src/
        ├── api/      → Axios API calls
        ├── components/ → Navbar, ItemCard
        └── pages/    → Home, ItemDetail, Admin
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB running locally on port 27017

### 1. Start MongoDB

```bash
mongod
```

### 2. Start Backend

```bash
cd backend
npm install
npm run seed    # Seeds 12 rental items into the database
npm run dev     # Starts server on http://localhost:5000
```

### 3. Start Frontend

```bash
cd frontend
npm install     # Only first time
npm start       # Starts React app on http://localhost:3000
```

## Features

### User Side

- Browse all rental items with search and category filtering
- View item details (price, condition, availability)
- Book/rent an item by providing personal details and rental period
- Auto-calculates total cost and security deposit

### Admin Panel (`/admin`)

- **Manage Items** tab: View all items, toggle availability, edit, delete
- **Add Item** tab: Add new rental items with full details
- **Orders** tab: View all customer orders and update their status

## API Endpoints

| Method | Endpoint          | Description         |
| ------ | ----------------- | ------------------- |
| GET    | `/api/items`      | Get all items       |
| GET    | `/api/items/:id`  | Get item by ID      |
| POST   | `/api/items`      | Create item         |
| PUT    | `/api/items/:id`  | Update item         |
| DELETE | `/api/items/:id`  | Delete item         |
| GET    | `/api/orders`     | Get all orders      |
| POST   | `/api/orders`     | Place an order      |
| PUT    | `/api/orders/:id` | Update order status |

## Seeded Items

The seed script adds 12 items across categories:

- Clothing (Business Suit, Women's Formal Suit, Wedding Sherwani)
- Power Tools (Electric Drill, Rotary Hammer, Angle Grinder)
- Pumps (Submersible Pump, Centrifugal Pump)
- Construction (Cement Mixer, Ladder)
- Electrical (Generator)
- Cleaning Equipment (Pressure Washer)
