const jwt = require('jsonwebtoken');
const { PubSub, withFilter } = require('graphql-subscriptions');
const User = require('../models/User');
const Chat = require('../models/Chat');

const pubsub = new PubSub();

const MESSAGE_ADDED = 'MESSAGE_ADDED';
const USER_ONLINE_STATUS = 'USER_ONLINE_STATUS';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return user;
    },
    
    users: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return User.find({ _id: { $ne: user.id } });
    },
    
    chats: async (_, { receiverId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      return Chat.find({
        $or: [
          { sender: user.id, receiver: receiverId },
          { sender: receiverId, receiver: user.id }
        ]
      })
      .populate('sender receiver')
      .sort({ createdAt: 1 });
    }
  },

  Mutation: {
    register: async (_, { username, email, password }) => {
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
      
      if (existingUser) {
        throw new Error('User already exists');
      }

      const user = new User({ username, email, password });
      await user.save();
      
      const token = generateToken(user.id);
      return { token, user };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();

      pubsub.publish(USER_ONLINE_STATUS, { userOnlineStatus: user });

      const token = generateToken(user.id);
      return { token, user };
    },

    sendMessage: async (_, { receiverId, message }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const chat = new Chat({
        message,
        sender: user.id,
        receiver: receiverId
      });

      await chat.save();
      await chat.populate('sender receiver');

      pubsub.publish(MESSAGE_ADDED, { 
        messageAdded: chat,
        receiverId 
      });

      return chat;
    },

    markAsRead: async (_, { chatId }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const chat = await Chat.findByIdAndUpdate(
        chatId,
        { isRead: true, readAt: new Date() },
        { new: true }
      ).populate('sender receiver');

      return chat;
    }
  },

  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([MESSAGE_ADDED]),
        (payload, variables) => {
          return payload.receiverId === variables.userId;
        }
      )
    },

    userOnlineStatus: {
      subscribe: () => pubsub.asyncIterator([USER_ONLINE_STATUS])
    }
  }
};

module.exports = resolvers;