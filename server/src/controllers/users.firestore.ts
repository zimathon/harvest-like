import { Request, Response } from 'express';
import User from '../models/firestore/User.js';
import { sendInvitationEmail } from '../services/emailService.js';

// @desc    Get all users
// @route   GET /api/v2/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.list();
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    res.status(200).json({
      success: true,
      count: users.length,
      data: usersWithoutPasswords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get single user
// @route   GET /api/v2/users/:id
// @access  Private/Admin
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Create user
// @route   POST /api/v2/users
// @access  Private/Admin
export const createUser = async (req: any, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const inviterName = req.user?.name || 'Administrator';

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      isActive: true
    });

    // Send invitation email
    try {
      await sendInvitationEmail(email, name, password, inviterName);
      console.log(`✅ Invitation email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue even if email fails - user is already created
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: 'User created successfully. Invitation email has been sent.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/v2/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow password updates through this endpoint
    delete updateData.password;

    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const existingUser = await User.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
        return;
      }
    }

    const user = await User.update(id, updateData);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/v2/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    await User.delete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update user password
// @route   PUT /api/v2/users/:id/password
// @access  Private/Admin or Own account
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Verify current password
    const isMatch = await User.comparePassword(user, currentPassword);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
      return;
    }

    // Update password (will be hashed in the model)
    await User.update(id, { password: newPassword });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};