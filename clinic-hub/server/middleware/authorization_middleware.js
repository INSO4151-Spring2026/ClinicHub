import jwt from "jsonwebtoken";
// middleware/authorization_middleware.js
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token" });

    try {
      // DEBUG: Hardcode the secret here to match Flask exactly
      const decoded = jwt.verify(token, "your-super-secret-key");
      req.user = decoded;
      console.log("DEBUG: Decoded Role:", decoded.role);
      console.log("DEBUG: Allowed Roles:", allowedRoles);

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Role mismatch" });
      }
      next();
    } catch (err) {
      console.log("JWT Verify Failed:", err.message); // Check your Node console!
      return res.status(401).json({ message: err.message });
    }
  };
};
export default authorize;
