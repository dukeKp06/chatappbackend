# Chat App Backend

A Node.js backend with GraphQL, WebSocket support for real-time chat functionality.

## Features

- User registration and authentication with JWT
- Real-time messaging with WebSocket subscriptions
- User online status tracking
- Message read receipts
- MongoDB integration with Mongoose

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running locally or update the MONGODB_URI in .env

3. Start the server:
```bash
npm run dev
```

The server will be available at:
- GraphQL Playground: http://localhost:4000/graphql
- WebSocket subscriptions: ws://localhost:4000/graphql

## GraphQL Operations

### Mutations
- `register(username, email, password)` - Register new user
- `login(email, password)` - Login user
- `sendMessage(receiverId, message)` - Send a message
- `markAsRead(chatId)` - Mark message as read

### Queries
- `me` - Get current user info
- `users` - Get all users except current user
- `chats(receiverId)` - Get chat history with specific user

### Subscriptions
- `messageAdded(userId)` - Listen for new messages
- `userOnlineStatus` - Listen for user online status changes

## Models

### User
- username, email, password
- isOnline, lastSeen timestamps

### Chat
- message content
- sender/receiver references
- read status and timestamps