
const authorize = (allowedRoles) => {
  return (req, res, next) => {

    console.log(`Checking access: User Role [${req.user?.role}] vs Allowed [${allowedRoles}]`);
    
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: You do not have the required permissions (${allowedRoles.join(' or ')})` 
      });
    }

    next();
  };
};

module.exports = authorize;