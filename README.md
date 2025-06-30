# Simple Coupon Book API

A Node.js API for managing coupons and users with TypeScript support.

## Features

- **Coupon Management**: Create, delete, redeem, schedule, and list coupons
- **User Management**: Create, edit, delete, and retrieve users
- **File-based Storage**: Uses JSON files for simple data persistence
- **TypeScript Support**: Full TypeScript implementation
- **Express.js Framework**: RESTful API with proper error handling

## Installation

1. Navigate to the SimpleCouponBook directory:
```bash
cd SimpleCouponBook
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Or run the production server:
```bash
npm start
```

The server will start on port 3000 by default. You can access it at `http://localhost:3000`

## API Endpoints

### Root Endpoint
- `GET /` - API documentation and available endpoints

### Health Check
- `GET /health` - Server health status

### Coupon Endpoints

#### Create Coupons
- **POST** `/api/coupons`
- **Body**: 
```json
{
  "userIds": ["user-id-1", "user-id-2"],
  "title": "Special Discount",
  "content": "20% off your next purchase",
  "adminId": "admin-user-id"
}
```
- **Description**: Creates individual coupon records for each user ID provided, with adminId tracking who created them

#### List Coupons
- **GET** `/api/coupons` - Get all coupons
- **GET** `/api/coupons?userId=USER_ID` - Get coupons for specific user (backend supports this)
- **Frontend**: Searches by title/content instead of userId

#### Delete Coupon
- **DELETE** `/api/coupons/:id`
- **Description**: Removes a coupon by ID

#### Redeem Coupon
- **PUT** `/api/coupons/:id/redeem`
- **Body** (optional):
```json
{
  "date": "2024-01-15T10:30:00Z"
}
```
- **Description**: Sets coupon as active with optional date

#### Schedule Coupon
- **PUT** `/api/coupons/:id/schedule`
- **Body**:
```json
{
  "date": "2024-01-15T10:30:00Z"
}
```
- **Description**: Adds a scheduled date to the coupon

### User Endpoints

#### Create User
- **POST** `/api/users`
- **Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "isAdmin": false
}
```

#### Get All Users
- **GET** `/api/users`

#### Get Specific User
- **GET** `/api/users/:id`

#### Edit User
- **PUT** `/api/users/:id`
- **Body** (any combination of fields):
```json
{
  "firstName": "Jane",
  "email": "jane.doe@example.com",
  "isAdmin": true
}
```

#### Delete User
- **DELETE** `/api/users/:id`

### Authentication Endpoints

#### Login
- **POST** `/api/auth/login`
- **Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```
- **Success Response**:
```json
{
  "message": "Login successful",
  "success": true,
  "user": {
    "id": "uuid-here",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "isAdmin": false
  }
}
```
- **Error Response** (401):
```json
{
  "error": "Invalid email or password",
  "success": false
}
```

## Data Models

### Coupon Object
```typescript
{
  id: string;           // Auto-generated UUID
  userId: string;       // ID of the user who owns the coupon
  adminId: string;      // ID of the admin who created the coupon
  title: string;        // Coupon title
  content: string;      // Coupon description/content
  isActive: boolean;    // Whether the coupon is redeemed
  scheduledDate?: Date; // Optional scheduled date
}
```

### User Object
```typescript
{
  id: string;          // Auto-generated UUID
  firstName: string;   // User's first name
  lastName: string;    // User's last name
  email: string;       // User's email address
  password: string;    // User's password (plain text - for demo only)
  isAdmin: boolean;    // Admin privileges flag
}
```

## Example Usage

### 1. Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Create Coupons for Multiple Users
```bash
curl -X POST http://localhost:3000/api/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user-id-1", "user-id-2"],
    "title": "Holiday Special",
    "content": "50% off all items",
    "adminId": "admin-user-id"
  }'
```

### 3. List All Coupons
```bash
curl http://localhost:3000/api/coupons
```

### 4. Redeem a Coupon
```bash
curl -X PUT http://localhost:3000/api/coupons/COUPON_ID/redeem \
  -H "Content-Type: application/json"
```

### 5. Login with Email and Password
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## File Structure

```
SimpleCouponBook/
├── data/
│   ├── coupons.json    # Coupon data storage
│   └── users.json      # User data storage
├── docs/
│   ├── index.html      # Frontend HTML interface
│   ├── style.css       # Custom CSS styles
│   └── script.js       # Frontend JavaScript functionality
├── model.ts            # TypeScript interfaces
├── functions.ts        # Business logic functions
├── routes.ts           # Express routes
├── server.ts           # Main server file
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## Development

- **Start development server**: `npm run dev` (auto-restart on changes)
- **Build project**: `npm run build`
- **Start production server**: `npm start`

## Notes

- This is a personal project with no security features
- Passwords are stored in plain text (not recommended for production)
- Data is persisted in JSON files in the `data/` directory
- The server includes CORS headers for development purposes
- UUIDs are automatically generated for all IDs 

## Frontend Interface

The project includes a complete HTML frontend located at `docs/index.html` with the following features:

### **Login System**
- Beautiful login form with email/password authentication
- Automatically saves user data to localStorage
- Login form disappears after successful authentication
- Persistent login (remembers user on page refresh)

### **User Interface**
- **Admin Users**: Full access to all features
- **Regular Users**: Limited access (no delete buttons)
- User info displayed in header with admin badge
- Logout functionality

### **Coupon Management**
- **Search Coupons**: Search by title or content (frontend filtering)
- **Visual Status**: Color-coded cards (green=active, gray=inactive)
- **Admin Actions**: Delete, redeem, and schedule buttons
- **User Actions**: Only redeem and schedule (no delete)
- **Add Coupons**: Modal form for admins with multiselect user dropdown

### **Features**
- **Responsive Design**: Bootstrap 5 with modern styling
- **Real-time Updates**: Automatic refresh after actions
- **User Directory**: View all users with quick filter options
- **Error Handling**: Proper error messages and confirmations
- **Icons**: Font Awesome icons throughout the interface

### **How to Use the Frontend**

1. **Start the Server**:
```bash
npm run dev
```

2. **Open the Frontend**:
   - Navigate to `SimpleCouponBook/docs/index.html` in your browser
   - Or serve it with a local server for full functionality

3. **Login**:
   - Use any existing user's email and password
   - The interface will adapt based on admin status

4. **Admin Features**:
   - Create new coupons with multiselect user dropdown
   - Delete any coupon using the delete button
   - View all users and search functionality

5. **User Features**:
   - Search coupons by title or content
   - Redeem and schedule coupons
   - Cannot delete coupons (admin only) 