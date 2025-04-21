const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Check for token in headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Get token from Bearer header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user data in request
    req.user = {
      userId: decoded.userId,
      accountType: decoded.accountType
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
}; 