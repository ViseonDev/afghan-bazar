## 1. Introduction

This document defines the Minimum Viable Product (MVP) specifications for the Afghanistan Marketplace mobile application. The app connects users across Afghanistan with local merchants by listing products, categories, and store locations. No online purchasing is supported in the MVP; instead, the app focuses on discovery and directions (future map integration).

**Key Objectives:**

- Provide a simple, low-bandwidth marketplace interface for Afghan users.
- Enable product and category search.
- Display merchant details and static store location.
- Lay groundwork for future map-based directions and real‑time location features.

## 2. Target Users & Personas

- **Everyday Shopper**: Fluent in Dari/Pashto; limited data plan; uses entry‑level smartphones.
- **Traveling Professional**: Occasionally seeks products while moving between cities.
- **Local Merchant**: Uses the app to list products and share store information.
- **Moderator**: Reviews user reports, flags inappropriate listings or merchants, and enforces content guidelines via moderation tools.
- **Administrator**: Full access to manage users, merchants, products, categories, reports, and system settings through an admin dashboard.

## 3. Platform & Technology Stack. Platform & Technology Stack

For a cross-platform MVP targeting iOS, Android, and Web all from a single codebase while leveraging your existing React expertise:

**Front-end (Cross-Platform)**

- **Framework:** React Native + Expo + React Native Web
  - Language: JavaScript / TypeScript
  - **Expo**: Zero-config native builds, over-the-air updates, built‑in modules for camera, location, and notifications
  - **React Navigation**: Stack, tab, and drawer navigation
  - **Styling:** Tailwind RN or Dripsy (utility-first styling consistent with Tailwind CSS)
  - **React Native Web**: Reuse nearly all components in the browser

**Back-end**

- **Runtime & Framework:** Node.js + Express (or NestJS for a more opinionated structure)
- **Language:** TypeScript (end‑to‑end)
- **Database:** MongoDB Atlas for flexible schemas (or MySQL/PostgreSQL for relational needs)
- **Auth:** JWT-based REST API endpoints
- **Optional GraphQL:** For more flexible data querying

**Alternative BaaS (Accelerated MVP)**

- **Firebase:** Firestore, Auth, Functions
- **Supabase:** PostgreSQL, Auth, Storage

**Monorepo Structure**

```
/ (root)
├─ app/      # Expo React Native + Web
└─ api/      # Node.js/Express (or NestJS) backend
```

- Shared linting, formatting, and CI workflows

**CI/CD**

- **Expo Application Services (EAS):** Build and deploy mobile/web bundles
- **GitHub Actions:** Run tests and deploy backend services

## 4. Architecture Overview Architecture Overview

```
[Mobile App (React)] <--> [REST API (Express)] <--> [MongoDB Database]
```

- Stateless API endpoints.
- CDN for static assets and placeholder images.
- Caching layer (Redis) for frequent queries (optional in MVP).

## 5. Functional Requirements

### 5.0. Access Levels

- **Guest (unauthenticated)**: Search products and categories, browse listings, view store details (read-only).
- **Authenticated Shopper**: All guest capabilities plus flag inappropriate listings/merchants and chat with merchants.
- **Merchant**: Manage own product listings and respond to chats.
- **Moderator**: Review and process flags, enforce content policies.
- **Administrator**: Full management of users, content, and settings.

### 5.1. Authentication & Profile

- **Register**: Email + password (simplified—optional phone OTP in later versions).
- **Login/Logout**: Standard token-based session.
- **Profile**: View name, language preference. (MVP: read-only)
- **Roles**: Each user is assigned a role (`guest`, `shopper`, `merchant`, `moderator`, or `admin`) stored in their profile for access control. Authentication & Profile
- **Register**: Email + password (simplified—optional phone OTP in later versions).
- **Login/Logout**: Standard token-based session.
- **Profile**: View name, language preference. (MVP: read-only)
- **Roles**: Each user is assigned a role (`shopper`, `merchant`, `moderator`, or `admin`) stored in their profile for access control.

### 5.2. Product & Category Browsing

- **Search**: Free-text search for products and categories.
- **Category Chips**: Quick filter categories on Home.
- **Listings**: Paginated lists/grids for products and stores.

### 5.3. Product Detail

- Display: Name, description, optional price, images carousel.
- Merchant Info: Store name, location text (district/city).
- Actions for all users: “Call Store”, “Message on WhatsApp”, “View Location” (static).
- **Chat**: Authenticated shoppers can initiate an in-app chat with the merchant.
- **Report Listing**: Only authenticated shoppers and moderators can flag a product for review.

### 5.4. Store Profile

- Display: Store name, cover image, description, full address, contact.
- Listings: All products associated with store.
- **Chat**: Authenticated shoppers see “Chat with Merchant” button.
- **Report Merchant**: Only authenticated shoppers and moderators can flag a store for review.

### 5.5. Moderation Interface Store Profile

- Display: Store name, cover image, description, full address, contact.
- Listings: All products associated with store.
- **Report Merchant**: Shopper or moderator can flag a store for review.

### 5.5. Moderation Interface

- **Report Management**: Moderators and admins view a list of flagged listings and merchants.
- **Action Buttons**: Approve, remove listing/store, or ban merchant.
- **Audit Log**: Record of moderation actions taken, by whom, and timestamp.

### 5.6. Admin Dashboard

- **User Management**: CRUD operations on all users, promote/demote roles.
- **Content Management**: Full oversight of products, categories, and stores.
- **Reports Overview**: Summary of active and resolved reports.
- **System Settings**: Configuration of categories, languages, and moderation policies.

### 5.7. Favorites & History

- Authenticated shoppers and guests can save products and stores to their **Favorites**, viewable from their profile.
- Browsing **History** tracks viewed products and stores per session for quick access.

### 5.8. Merchant Portal

- Merchants can create, update, and delete their own product listings via an in-app dashboard.
- View chat requests and respond to shopper messages.
- Access analytics on view counts and favorites for their listings.

### 5.9. Multilingual Support

- Full localization for **Dari** and **Pashto**, with language selector in the UI.
- All static text, categories, and system messages available in English, Dari, and Pashto.

### 5.10. Ratings & Reviews

- Authenticated shoppers can leave ratings (1–5 stars) and text reviews for products and merchants.
- Display average rating and review count on product and store profiles.
- Moderators can moderate reviews (approve, hide, or delete) via the moderation interface.

## 6. API Endpoints. API Endpoints API Endpoints

| Method | Path                | Description                                       |
| ------ | ------------------- | ------------------------------------------------- |
| GET    | /api/products       | List products (filter & search query)             |
| GET    | /api/products/\:id  | Get product details                               |
| GET    | /api/categories     | List all categories                               |
| GET    | /api/stores         | List stores (filter & search query)               |
| GET    | /api/stores/\:id    | Get store details and its products                |
| POST   | /api/auth/register  | Register new user                                 |
| POST   | /api/auth/login     | Authenticate user, return JWT                     |
| POST   | /api/flags          | Flag a product or store (requires authentication) |
| GET    | /api/chat/\:storeId | Retrieve chat messages with a merchant            |
| POST   | /api/chat/\:storeId | Send a chat message to a merchant                 |

## 7. Data Models (Mongoose Schemas)

**Product**

```js
{
  name: String,
  description: String,
  price: Number,         // Optional
  category: String,
  storeId: ObjectId,
  images: [String],      // URLs
  createdAt: Date,
}
```

**Store**

```js
{
  name: String,
  description: String,
  address: String,
  city: String,
  phone: String,
  whatsapp: String,
  images: [String],      // URLs
  createdAt: Date,
}
```

**User**

```js
{
  email: String,
  passwordHash: String,
  language: String,      // "en", "fa", "ps"
  role: String,          // "guest", "shopper", "merchant", "moderator", "admin"
  createdAt: Date,
}
```

**Flag**

```js
{
  reporterId: ObjectId,
  targetType: String, // "product" or "store"
  targetId: ObjectId,
  reason: String,
  status: String,     // "pending", "resolved", "dismissed"
  createdAt: Date,
}
```

**ChatMessage**

```js
{
  storeId: ObjectId,
  senderId: ObjectId,
  message: String,
  timestamp: Date,
}
```

## 8. UI Wireframes & Flow

**Store**

```js
{
  name: String,
  description: String,
  address: String,
  city: String,
  phone: String,
  whatsapp: String,
  images: [String],      // URLs
  createdAt: Date,
}
```

**User**

```js
{
  email: String,
  passwordHash: String,
  language: String,      // "en", "fa", "ps"
  createdAt: Date,
}
```

## 8. UI Wireframes & Flow

1. **Splash Screen** → **Login/Registration** → **Home Screen**
2. **Search** → **Product List** → **Product Detail** → **Call/WHATSAPP**
3. **Switch to Stores Tab** → **Store List** → **Store Profile**

*Wireframes should be sketched and stored in the design repository.*

## 9. Non‑Functional Requirements

- **Performance**: <2s load on 3G connections.
- **Usability**: Large touch targets, simple typography.
- **Localization**: Support UTF‑8; prepare for RTL text.
- **Security**: Basic JWT auth; sanitize inputs to prevent injection.

## 10. Deployment & CI/CD

- **GitHub Actions** for testing and build pipelines.
- **Staging Environment**: For internal QA.
- **Production**: AWS-hosted; environment variables for secrets.

## 11. Docker Development Environment

Provide a consistent, isolated development setup using Docker and Docker Compose:

### 11.1. Dockerfile (app)

```dockerfile
# app/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY app/ .
RUN npm run build:web    # build web assets for React Native Web

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY app/package*.json ./
RUN npm install --production
EXPOSE 19006            # Expo web port
CMD ["npm", "run", "start:web"]
```

### 11.2. Dockerfile (api)

```dockerfile
# api/Dockerfile
FROM node:18-alpine
WORKDIR /api
COPY api/package*.json ./
RUN npm install
COPY api/ .
EXPOSE 4000
CMD ["npm", "run", "start"]
```

### 11.3. docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: app/Dockerfile
    volumes:
      - ./app:/app
      - /app/node_modules
    ports:
      - "19006:19006"
    environment:
      - NODE_ENV=development
      - API_URL=http://localhost:4000
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: api/Dockerfile
    volumes:
      - ./api:/api
      - /api/node_modules
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/afg_marketplace
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### 11.4. Usage

```bash
# Build and start all services
docker-compose up --build

# Stop and remove containers
docker-compose down
```

## 12. Future Roadmap

1. **Map Integration**: Live turn-by-turn navigation to stores.
2. **Enhanced Geolocation**: “Stores Near Me” leveraging device GPS.
3. **Offline Mode**: Cache listings for offline browsing in low-connectivity areas.

---

**End of MVP Specification**

