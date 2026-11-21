# 🍕 PizzaHub – Backend API

PizzaHub Backend is the server-side application of PizzaHub, a modern online pizza marketplace. It provides RESTful APIs to manage menu items, user profiles, vendor operations, orders, administrative functionalities, and subscription payments.

Built with Node.js and Express.js, the backend uses MongoDB for data storage and Stripe for payment processing. It is designed to provide secure, reliable, and efficient communication between the frontend and backend.

## 🌐 Project Links

- **Live Website:** https://pizzahub-y5rh.vercel.app
- **Backend API:** https://pizzahub-server-lovat.vercel.app
- **Frontend Repository:** https://github.com/NayeemurRahman0017/pizzahub
- **Backend Repository:** https://github.com/NayeemurRahman0017/pizzahub-backend

## ✨ Key Features

- **RESTful API:** Provides structured API endpoints for seamless communication between the frontend and backend.
- **User Authentication:** Supports secure authentication and token-based authorization.
- **Menu Management:** Handles pizza menu items, featured products, filtering, sorting, and pagination.
- **Vendor Management:** Provides APIs for vendor-related operations and management.
- **Order Management:** Handles customer orders and order-related operations.
- **Admin Management:** Provides administrative APIs for managing users and platform operations.
- **Subscription Management:** Supports premium subscription functionality.
- **Stripe Payment Integration:** Integrates Stripe for secure payment processing and subscription transactions.
- **Stripe Webhooks:** Handles Stripe webhook events to process payment-related updates.
- **MongoDB Integration:** Uses MongoDB for efficient and flexible database management.
- **Input Validation:** Uses Zod for validating incoming API data.
- **Security:** Implements Helmet, CORS, and Express Rate Limit for improved API security.

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- JavaScript (ES Modules)
- MongoDB
- JOSE (JWT)
- Zod

### Payment Integration
- Stripe

### Security & Middleware
- CORS
- Helmet
- Express Rate Limit
- Dotenv

### Development Tools
- Nodemon
- Git
- GitHub
- Vercel

## 📡 API Endpoints

The backend provides the following API routes:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API server status |
| GET | `/api/menu` | Retrieve menu items |
| GET | `/api/menu/featured` | Retrieve featured menu items |
| GET | `/api/vendor` | Vendor-related operations |
| GET/POST | `/api/orders` | Order-related operations |
| GET | `/api/admin` | Administrative operations |
| GET | `/api/subscriptions` | Subscription operations |
| GET | `/api/profile` | User profile operations |
| POST | `/api/webhooks/stripe` | Handle Stripe webhook events |

*Note: Some endpoints support additional HTTP methods and nested routes.*

## 🚀 Getting Started

Follow these instructions to run the backend locally.

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB database (local or MongoDB Atlas)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/NayeemurRahman0017/pizzahub-backend.git
```

### 2. Navigate to the Project Directory

```bash
cd pizzahub-backend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

Add the following environment variables:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=pizzahub

FRONTEND_URL=http://localhost:3000

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

PREMIUM_PRICE_AMOUNT=999
PREMIUM_PRICE_CURRENCY=usd
```

**Important:** Replace the placeholder values with your actual credentials. Never commit your `.env` file or expose secret keys publicly.

### 5. Run the Development Server

```bash
npm run dev
```

### 6. Run in Production

```bash
npm start
```

The backend will run on:

```text
http://localhost:5000
```

### 7. Check API Status

Open the following endpoint in your browser:

```text
http://localhost:5000/api/health
```

## 🗂️ Project Structure

```text
pizzahub-backend/
│
├── scripts/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── app.js
│
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

## 🔗 Frontend Integration

The PizzaHub backend is connected to the Next.js frontend through RESTful APIs.

**Frontend:** https://pizzahub-y5rh.vercel.app

**Backend API:** https://pizzahub-server-lovat.vercel.app

The frontend communicates with the backend to retrieve menu data, manage user operations, process orders, and handle payment-related functionality.

## 🎯 Project Objective

The main objective of PizzaHub Backend is to build a reliable and scalable server-side architecture for an online pizza marketplace.

It focuses on API development, database management, authentication, payment integration, security, and efficient communication between the frontend and backend.

## 👨‍💻 Developer

**Nayeemur Rahman**

- GitHub: https://github.com/NayeemurRahman0017
- Frontend Repository: https://github.com/NayeemurRahman0017/pizzahub
- Backend Repository: https://github.com/NayeemurRahman0017/pizzahub-backend

---
