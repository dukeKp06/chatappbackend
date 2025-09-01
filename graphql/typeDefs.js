const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    isOnline: Boolean!
    lastSeen: String!
    createdAt: String!
  }

  type Chat {
    id: ID!
    message: String!
    sender: User!
    receiver: User!
    isRead: Boolean!
    readAt: String
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    users: [User!]!
    chats(receiverId: ID!): [Chat!]!
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    sendMessage(receiverId: ID!, message: String!): Chat!
    markAsRead(chatId: ID!): Chat!
  }

  type Subscription {
    messageAdded(userId: ID!): Chat!
    userOnlineStatus: User!
  }
`;
module.
exports = typeDefs;