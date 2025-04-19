import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthRequest } from '../types/index.js';

interface JwtPayload {
  id: string;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const jwtSecret = process.env.JWT_SECRET || '';
      
      // any型を使用して型エラーを回避
      const decoded = jwt.verify(token, jwtSecret as any) as JwtPayload;

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({
        success: false,
        error: 'Not authorized, token failed'
      });
    }
  } else {
    res.status(401).json({
      success: false,
      error: 'Not authorized, no token'
    });
  }
};

// Admin only middleware
export const admin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Not authorized as an admin'
    });
  }
};