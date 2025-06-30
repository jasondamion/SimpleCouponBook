import { Router, Request, Response } from 'express';
import * as functions from './functions';

const router = Router();

// Coupon Routes

// POST /coupons - Create new coupons
router.post('/coupons', (req: Request, res: Response) => {
  try {
    const { userIds, title, content, adminId } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || !title || !content || !adminId) {
      return res.status(400).json({ error: 'Missing required fields: userIds (array), title, content, adminId' });
    }
    
    const coupons = functions.addCoupon(userIds, title, content, adminId);
    return res.status(201).json({ message: 'Coupons created successfully', coupons });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create coupons' });
  }
});

// GET /coupons - List all coupons or filter by userId
router.get('/coupons', (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const coupons = functions.listCoupons(userId as string);
    return res.json(coupons);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve coupons' });
  }
});

// DELETE /coupons/:id - Delete a coupon
router.delete('/coupons/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = functions.deleteCoupon(id);
    
    if (success) {
      return res.json({ message: 'Coupon deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Coupon not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// PUT /coupons/:id/redeem - Redeem a coupon
router.put('/coupons/:id/redeem', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    
    const coupon = functions.redeemCoupon(id, date ? new Date(date) : undefined);
    
    if (coupon) {
      return res.json({ message: 'Coupon redeemed successfully', coupon });
    } else {
      return res.status(404).json({ error: 'Coupon not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to redeem coupon' });
  }
});

// PUT /coupons/:id/schedule - Schedule a coupon
router.put('/coupons/:id/schedule', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const coupon = functions.scheduleCoupon(id, new Date(date));
    
    if (coupon) {
      return res.json({ message: 'Coupon scheduled successfully', coupon });
    } else {
      return res.status(404).json({ error: 'Coupon not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to schedule coupon' });
  }
});

// User Routes

// POST /users - Create a new user
router.post('/users', (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, isAdmin } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, password' });
    }
    
    // Convert isAdmin to proper boolean
    const isAdminBoolean = isAdmin === true || isAdmin === 'true' || isAdmin === 'True';
    
    const user = functions.addUser(firstName, lastName, email, password, isAdminBoolean);
    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /users - Get all users
router.get('/users', (req: Request, res: Response) => {
  try {
    const users = functions.getAllUsers();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// GET /users/:id - Get a specific user
router.get('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = functions.getUser(id);
    
    if (user) {
      return res.json(user);
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// PUT /users/:id - Edit a user
router.put('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const user = functions.editUser(id, updates);
    
    if (user) {
      return res.json({ message: 'User updated successfully', user });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /users/:id - Delete a user
router.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = functions.deleteUser(id);
    
    if (success) {
      return res.json({ message: 'User deleted successfully' });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Authentication Routes

// POST /auth/login - User login
router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = functions.loginUser(email, password);
    
    if (user) {
      // Remove password from response for security
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ 
        message: 'Login successful', 
        user: userWithoutPassword,
        success: true 
      });
    } else {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        success: false 
      });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Suggestion Routes

// POST /suggestions - Create a new suggestion
router.post('/suggestions', (req: Request, res: Response) => {
  try {
    const { userId, content } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'Missing required fields: userId, content' });
    }
    
    const suggestion = functions.addSuggestion(userId, content);
    return res.status(201).json({ message: 'Suggestion created successfully', suggestion });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create suggestion' });
  }
});

// GET /suggestions - Get all suggestions (admin only)
router.get('/suggestions', (req: Request, res: Response) => {
  try {
    const suggestions = functions.getAllSuggestions();
    return res.json(suggestions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve suggestions' });
  }
});

// DELETE /suggestions/:id - Delete a suggestion (admin only)
router.delete('/suggestions/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = functions.deleteSuggestion(id);
    
    if (success) {
      return res.json({ message: 'Suggestion deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete suggestion' });
  }
});

export default router;
