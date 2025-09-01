const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getUser = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    return user;
  } catch (error) {
    return null;
  }
};

module.exports = { getUser };