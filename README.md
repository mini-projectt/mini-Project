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
python3 -m venv ../.venv
../.venv/bin/pip install -r nlp_chatbot/requirements.txt
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

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| GET    | `/api/items`          | Get all items        |
| GET    | `/api/items/:id`      | Get item by ID       |
| POST   | `/api/items`          | Create item          |
| PUT    | `/api/items/:id`      | Update item          |
| DELETE | `/api/items/:id`      | Delete item          |
| GET    | `/api/orders`         | Get all orders       |
| POST   | `/api/orders`         | Place an order       |
| PUT    | `/api/orders/:id`     | Update order status  |
| POST   | `/api/chatbot/query`  | Query NLP chatbot    |
| GET    | `/api/chatbot/health` | Chatbot health check |

## NLP Chatbot Module (TF-IDF + Naive Bayes)

The project includes a local NLP chatbot module implemented in Python + scikit-learn.

### Architecture Pipeline

1. Raw text input
2. Preprocessing (lowercase, punctuation removal, stop-word removal)
3. TF-IDF vectorization
4. Multinomial Naive Bayes intent classification
5. Structured JSON response (intent, confidence, suggestions, recommendations)

### Why this module

- Zero external NLP API cost
- Local data privacy
- Fast inference latency
- Deterministic and explainable pipeline

### Example chatbot request

```bash
curl -X POST http://localhost:5000/api/chatbot/query \\
    -H "Content-Type: application/json" \\
    -d '{"text":"I need a DSLR camera for 2 days"}'
```

## Seeded Items

The seed script adds 12 items across categories:

- Clothing (Business Suit, Women's Formal Suit, Wedding Sherwani)
- Power Tools (Electric Drill, Rotary Hammer, Angle Grinder)
- Pumps (Submersible Pump, Centrifugal Pump)
- Construction (Cement Mixer, Ladder)
- Electrical (Generator)
- Cleaning Equipment (Pressure Washer)
