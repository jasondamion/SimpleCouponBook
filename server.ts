import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize data files if they don't exist
function initializeDataFiles() {
  const dataDir = path.join(__dirname, 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const couponsFile = path.join(dataDir, 'coupons.json');
  const usersFile = path.join(dataDir, 'users.json');
  
  if (!fs.existsSync(couponsFile)) {
    fs.writeFileSync(couponsFile, '[]');
  }
  
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]');
  }
}

// CORS middleware (for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize data files
initializeDataFiles();

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple Coupon Book API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Simple Coupon Book API',
    endpoints: {
      coupons: {
        'POST /api/coupons': 'Create new coupons',
        'GET /api/coupons': 'List all coupons (optional ?userId=xxx to filter)',
        'DELETE /api/coupons/:id': 'Delete a coupon',
        'PUT /api/coupons/:id/redeem': 'Redeem a coupon',
        'PUT /api/coupons/:id/schedule': 'Schedule a coupon'
      },
      users: {
        'POST /api/users': 'Create a new user',
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get a specific user',
        'PUT /api/users/:id': 'Edit a user',
        'DELETE /api/users/:id': 'Delete a user'
      },
      auth: {
        'POST /api/auth/login': 'Login with email and password'
      }
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Coupon Book API is running on port ${PORT}`);
  console.log(`📖 API Documentation available at http://localhost:${PORT}`);
  console.log(`💚 Health check available at http://localhost:${PORT}/health`);
});

export default app;
