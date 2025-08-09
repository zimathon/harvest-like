import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/firestore/User.js';
import { AuthRequestFirestore } from '../types/firestore.js';

// Protect routes
export const protect = async (
  req: AuthRequestFirestore, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    req.user = {
      id: user.id!,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'user'
    };
    
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
    return;
  }
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequestFirestore, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
      return;
    }

    next();
  };
};