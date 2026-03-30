# YouApp Backend API

A NestJS REST + WebSocket API for YouApp — handles user registration, authentication, profiles, and real-time chat.

---

## Tech Stack

- **NestJS** (TypeScript)
- **MongoDB** via Mongoose
- **Socket.IO** (WebSocket namespace `/chat`)
- **JWT** authentication
- **Docker / Docker Compose**

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or via Docker)

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root (or export variables directly):

```env
PORT=3000
APP_URL=http://localhost:3000
JWT_SECRET=your-secret-here
MONGODB_URI=mongodb://localhost:27017/youapp
```

### Run in development mode

```bash
npm run start:dev
```

### Run with Docker Compose

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000`.

---

## Running Tests

```bash
# all unit tests
npm run test

# unit tests with coverage
npm run test:cov

# watch mode
npm run test:dev

# e2e tests
npm run test:e2e
```

---

## API Overview

All responses are wrapped by the global `ResponseInterceptor`.
All routes under `/api` require a valid JWT (`Authorization: Bearer <token>`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | No | Create a new account |
| `POST` | `/login` | No | Obtain a JWT token |
| `POST` | `/api/createProfile` | Yes | Create a user profile |
| `GET`  | `/api/getProfile` | Yes | Get the current user's profile |
| `PUT`  | `/api/updateProfile` | Yes | Update the current user's profile |
| `GET`  | `/api/viewMessages` | Yes | List all chat rooms for the current user |
| `GET`  | `/api/viewMessages/:chatRoomId` | Yes | Get messages in a specific chat room |
| `POST` | `/api/sendMessage` | Yes | Send a message (also broadcasts via WebSocket) |

---

## Chat System — Testing Guide

The chat system has two layers:

1. **HTTP (REST)** — persistence: `POST /api/sendMessage`
2. **WebSocket** — real-time delivery: Socket.IO namespace `/chat`

When a message is sent via HTTP, the server persists it and immediately emits a `newMessage` event to all connected clients in `chatRoom:<id>`.

### Step 1 — Register two users

Send the following request twice with different credentials:

```
POST http://localhost:3000/register
Content-Type: application/json

{
  "email": "alice@example.com",
  "username": "alice",
  "password": "secret1",
  "confirmPassword": "secret1"
}
```

```
POST http://localhost:3000/register
Content-Type: application/json

{
  "email": "bob@example.com",
  "username": "bob",
  "password": "secret2",
  "confirmPassword": "secret2"
}
```

### Step 2 — Log in as both users

```
POST http://localhost:3000/login
Content-Type: application/json

{
  "identifier": "alice@example.com",
  "password": "secret1"
}
```

The response includes a `token` field. Save the token for Alice (`TOKEN_ALICE`) and repeat the login for Bob (`TOKEN_BOB`).

### Step 3 — Connect Bob to the WebSocket (listen for messages)

In Postman, open a new **WebSocket** request:

- **URL**: `ws://localhost:3000/chat`
- Under **Headers**, add:
  ```
  Authorization: Bearer <TOKEN_BOB>
  ```
  > Alternatively, pass the token as `handshake.auth.token` via the connection options.

Click **Connect**. Bob is now connected and listening.

### Step 4 — Find Bob's user ID

To send a message to Bob you need his MongoDB `_id`. You can find it in the login response (the `sub` field of the decoded JWT) or via the profile endpoint once a profile is created.

### Step 5 — Alice sends a message via HTTP

```
POST http://localhost:3000/api/sendMessage
Authorization: Bearer <TOKEN_ALICE>
Content-Type: application/json

{
  "recipientId": "<BOB_USER_ID>",
  "content": "Hey Bob, this is Alice!"
}
```

The response contains the persisted `message` and the `chatRoom` object.
Note the `chatRoom.id` — you will need it in the next step.

### Step 6 — Bob joins the chat room (to receive future messages)

In the Postman WebSocket tab connected as Bob, emit the `joinRoom` event:

- **Event name**: `joinRoom`
- **Message body**: `"<CHAT_ROOM_ID>"` (the ID from Step 5 as a plain JSON string)

Bob's socket is now subscribed to `chatRoom:<id>` and will receive all future `newMessage` events for that room.

> **Note for Postman**: Send the chatRoomId as a quoted JSON string, e.g. `"64abc123def456789abc1234"`. The server's `ParseWsBodyPipe` will handle decoding automatically.

### Step 7 — Alice joins the same room

Repeat Step 3 with Alice's token to open a second WebSocket tab as Alice, then emit `joinRoom` with the same `chatRoomId`.

### Step 8 — Send another message and observe real-time delivery

Alice sends another `POST /api/sendMessage` via HTTP. Both Alice's and Bob's WebSocket tabs should immediately receive a `newMessage` event with this payload shape:

```json
{
  "message": {
    "id": "...",
    "chatRoomId": "...",
    "senderId": "...",
    "receiverId": "...",
    "content": "Hey Bob, this is Alice!",
    "createdAt": "..."
  },
  "chatRoom": {
    "id": "...",
    "participants": ["...", "..."],
    "lastMessage": {},
    "updatedAt": "..."
  }
}
```

### Step 9 — View chat history via HTTP

List all chat rooms the current user participates in:

```
GET http://localhost:3000/api/viewMessages
Authorization: Bearer <TOKEN_ALICE>
```

Get all messages in a specific room (returns `403 Forbidden` if the user is not a participant):

```
GET http://localhost:3000/api/viewMessages/\<CHAT_ROOM_ID\>
Authorization: Bearer <TOKEN_ALICE>
```

---

## Architecture Notes

- **Gateway** (`ChatGateway`): handles WebSocket connection lifecycle (JWT auth on handshake), room joining (`joinRoom` event), and broadcasting `newMessage` events via `emitToRoom()`.
- **Controller** (`ChatController`): handles HTTP persistence and triggers `emitToRoom()` after a successful save.
- **Service** (`ChatService`): all database operations — `sendMessage`, `viewMessages`, `getMessagesInRoom`.
- The gateway does **not** persist messages. Message persistence is exclusively an HTTP concern.

---

## License

MIT
