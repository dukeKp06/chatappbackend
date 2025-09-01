require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const mongoose = require('mongoose');
const cors = require('cors');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { getUser } = require('./middleware/auth');

async function startServer() {
  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  const app = express();
  app.use(cors());

  // Create executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const user = await getUser(req);
      return { user };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  useServer(
    {
      schema,
      context: async (ctx) => {
        // Get token from connection params
        const token = ctx.connectionParams?.authorization?.replace('Bearer ', '');
        let user = null;
        
        if (token) {
          try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const User = require('./models/User');
            user = await User.findById(decoded.userId);
          } catch (error) {
            console.error('WebSocket auth error:', error);
          }
        }
        
        return { user };
      },
    },
    wsServer
  );

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(error => {
  console.error('Error starting server:', error);
});