import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        message: "Not logged in" 
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // DB-level active user verification
    const user = await User.findById(decoded.id).select("-passwordHash -resetOTP -resetOTPExpiry");
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User no longer exists" 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};
