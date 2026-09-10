# Smart Attendance System - Development Guide

## Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Groq API Key
- Git

### Installation & Setup

#### 1. Clone and Setup Root
```bash
cd smart-attendance-system
npm install -all
```

#### 2. Configure Backend

```bash
cd server
cp .env.example .env
```

**Edit `server/.env`:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartattend
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_change_this
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-real-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=SmartAttend <your-real-email@gmail.com>
```

Attendance confirmation emails are sent to the email saved on each student or staff account after attendance is saved. For Gmail, use a Google App Password rather than the normal account password. Keep these SMTP values only in `server/.env` and never commit them.

#### 3. Configure Frontend

```bash
cd ../client
cp .env.example .env
```

**File: `client/.env`:**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

#### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run dev
```
Expected output: ✓ Server running on port 5000

**Terminal 2 - Frontend:**
```bash
cd client
npm install
npm run dev
```
Expected output: ✓ Local: http://localhost:5173/

#### 5. Seed Database (Optional)

```bash
cd server
npm run seed
```

This creates:
- **Admin**: admin@smartattend.com / Admin@123456
- **Demo User**: john@example.com / User@123456

#### 6. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Project Structure Explanation

### Backend Structure (`server/`)

```
server/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/              # Business logic
│   │   ├── authController.js     # Authentication
│   │   ├── userController.js     # User management
│   │   ├── attendanceController  # Attendance marking
│   │   ├── dashboardController   # Dashboard data
│   │   ├── analyticsController   # Analytics
│   │   └── aiController.js       # Groq AI integration
│   ├── middleware/               # Express middleware
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── errorMiddleware.js    # Error handling
│   │   └── rateLimiter.js        # Rate limiting
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   └── Attendance.js
│   ├── routes/                   # Express routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── aiRoutes.js
│   ├── utils/                    # Utilities
│   │   ├── generateToken.js      # JWT generation
│   │   └── validators.js         # Input validation
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
├── package.json
└── .env.example
```

### Frontend Structure (`client/`)

```
client/
├── src/
│   ├── components/
│   │   ├── common/               # Reusable UI components
│   │   │   └── index.jsx         # Button, Input, Card, etc.
│   │   ├── layout/
│   │   │   └── Navbar.jsx        # Navigation bar
│   │   └── ProtectedRoute.jsx    # Auth-protected routes
│   ├── context/                  # React Context
│   │   ├── AuthContext.jsx       # Authentication state
│   │   └── ThemeContext.jsx      # Dark/light mode
│   ├── pages/
│   │   ├── public/
│   │   │   └── LandingPage.jsx   # Public landing
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx     # Login/Register
│   │   │   └── RegisterPage.jsx
│   │   ├── admin/                # Admin-only pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── AttendanceManagement.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   └── AttendanceAIPage.jsx
│   │   └── user/                 # User-only pages
│   │       ├── UserDashboard.jsx
│   │       ├── UserMarkAttendance.jsx
│   │       ├── UserAttendanceHistory.jsx
│   │       └── UserProfile.jsx
│   ├── services/
│   │   └── api.js                # Axios API calls
│   ├── utils/
│   │   └── toast.js              # Toast notifications
│   ├── App.jsx                   # Main app with routes
│   ├── main.jsx                  # React DOM render
│   └── index.css                 # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

## API Endpoints Summary

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
PUT    /api/auth/profile
POST   /api/auth/change-password
```

### Users
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/face          # Register face
POST   /api/users/face/recognize    # Recognize face
GET    /api/users/:id/stats         # User attendance stats
```

### Attendance
```
POST   /api/attendance/mark         # Mark attendance via face
GET    /api/attendance              # All records (admin)
GET    /api/attendance/today        # Today's attendance
GET    /api/attendance/user/:userId # User's attendance
GET    /api/attendance/report       # Generate report
PUT    /api/attendance/:id          # Update record
DELETE /api/attendance/:id          # Delete record
```

### Dashboard
```
GET    /api/dashboard/admin         # Admin dashboard data
GET    /api/dashboard/user          # User dashboard data
```

### Analytics
```
GET    /api/analytics/overview
GET    /api/analytics/monthly
GET    /api/analytics/department
GET    /api/analytics/user-percentage
GET    /api/analytics/trends
```

### AI Assistant
```
POST   /api/ai/chat                 # Chat with AttendanceAI
GET    /api/ai/summary              # Generate AI summary
```

## Key Features Implementation

### 1. Face Recognition Setup

The system uses `face-api.js` for browser-based face recognition:

```javascript
import * as faceapi from 'face-api.js';

// Load face detection models
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
]);

// Get video stream
const video = videoRef.current;

// Detect faces
const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
  .withFaceLandmarks()
  .withFaceDescriptors();

// Send descriptor to backend for matching
```

### 2. Face Registration (Admin)

Steps:
1. Admin navigates to "Register User"
2. Fills user details
3. Camera opens
4. Face is detected
5. Descriptor is generated
6. Sent to backend
7. Stored in database
8. User account created

### 3. Attendance Marking (User)

Steps:
1. User opens "Mark Attendance"
2. Camera starts
3. Face is detected
4. Descriptor is generated
5. Compared with registered users
6. If match found and confidence > threshold:
   - Check for duplicate today
   - Record attendance
   - Display success
7. If no match:
   - Show "Face not recognized"
   - Allow retry

### 4. Authentication Flow

```
User Input → Validation → Hash Password → Store in DB
                ↓
            JWT Generated
                ↓
         Token Stored (localStorage)
                ↓
       Protected Routes Check Token
                ↓
       Token Valid → Access Granted
       Token Invalid → Redirect to Login
```

### 5. Role-Based Access

```
Routes Protected by Role:
├── ADMIN
│   ├── Dashboard
│   ├── User Management
│   ├── Attendance Management
│   ├── Reports
│   ├── Analytics
│   └── AI Assistant
└── USER
    ├── Dashboard
    ├── Mark Attendance
    ├── Attendance History
    ├── Profile
    └── AI Assistant (limited)
```

## Frontend Component Implementation Guide

### Building a Page Component

Template:
```jsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Loading } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/toast';
import { someAPI } from '../../services/api';

const PageName = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await someAPI.getAll();
      setData(response.data.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Page Title</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(item => (
          <Card key={item._id}>
            {/* Card content */}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PageName;
```

### Using Form Hook

```jsx
import { useForm } from 'react-hook-form';
import { Input, Button } from '../../components/common';

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

const onSubmit = async (data) => {
  try {
    const response = await api.create(data);
    showSuccess('Created successfully');
  } catch (err) {
    showError(err.response?.data?.message);
  }
};

<form onSubmit={handleSubmit(onSubmit)}>
  <Input
    label="Name"
    placeholder="Enter name"
    error={errors.name?.message}
    {...register('name', { required: 'Name is required' })}
  />
  <Button type="submit" isLoading={isSubmitting}>
    Submit
  </Button>
</form>
```

## Building Complete Pages

### Admin Dashboard
- Display stats cards (total users, present today, etc.)
- Show recent attendance table
- Display daily/weekly/monthly charts
- Quick action buttons

### User Management
- Table with pagination
- Search by name/ID
- Filter by role/department
- Edit/Delete buttons
- Register new user button

### Mark Attendance
- Webcam preview
- Face detection box
- User info display
- Status display
- Retry button

### Reports
- Date range picker
- Filter options
- Export to CSV
- Display table with data
- Summary statistics

### Analytics
- Multiple charts (line, bar, pie)
- Department comparison
- User attendance percentages
- Trend analysis

### AI Assistant
- Chat interface
- Message bubbles
- Suggested prompts
- Loading states
- Error handling

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
Solution: Ensure MongoDB is running
  Windows: net start MongoDB
  Mac: brew services start mongodb-community
  Linux: sudo systemctl start mongod
```

### CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS policy
Solution: Check CLIENT_URL in server/.env matches your frontend URL
```

### JWT Token Error
```
Error: Invalid token
Solution: Clear localStorage and login again
  localStorage.clear()
```

### Face Recognition Not Working
```
Solution:
1. Check camera permissions
2. Ensure good lighting
3. Face models loaded from /public/models
4. Check browser console for errors
```

## Testing the Application

### Test Users
```
Admin:
  Email: admin@smartattend.com
  Password: Admin@123456

Demo User:
  Email: john@example.com
  Password: User@123456
```

### Test Scenarios

1. **Authentication**
   - Register new user
   - Login with credentials
   - Logout
   - Access protected routes

2. **Face Recognition**
   - Admin registers user's face
   - User marks attendance with face
   - System rejects unregistered faces
   - System prevents duplicate attendance

3. **Data Management**
   - Create/Read/Update/Delete users
   - View attendance records
   - Generate reports
   - Export CSV

4. **Analytics**
   - View dashboard charts
   - Check attendance percentages
   - Monitor trends

## Performance Optimization

### Frontend
- Lazy load pages with React.lazy()
- Implement pagination for large tables
- Cache API responses
- Optimize images
- Use React.memo for expensive components

### Backend
- Add indexes to frequently queried fields
- Implement caching (Redis)
- Optimize MongoDB queries
- Compress responses
- Use pagination for large datasets

## Deployment Checklist

### Before Deployment
- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB Atlas
- [ ] Set appropriate CORS origin
- [ ] Test all API endpoints
- [ ] Verify face recognition works
- [ ] Test authentication flows
- [ ] Check error handling
- [ ] Review rate limiting settings
- [ ] Enable HTTPS

### Production Environment Variables

**Backend**
```
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartattend
JWT_SECRET=<strong-random-secret-here>
GROQ_API_KEY=<your-groq-key>
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
```

**Frontend**
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Next Steps

1. **Complete Frontend Pages**: Implement all page components using templates provided
2. **Add Advanced Features**: 
   - Email notifications
   - SMS alerts
   - Calendar view
   - Mobile app
3. **Security Enhancements**:
   - 2FA authentication
   - Biometric backup
   - IP whitelisting
4. **Scalability**:
   - Database optimization
   - Caching layer
   - Load balancing
5. **Testing**:
   - Unit tests
   - Integration tests
   - E2E tests

## Support & Resources

- Face-api.js: https://github.com/vladmandic/face-api
- Mongoose Docs: https://mongoosejs.com
- Express Docs: https://expressjs.com
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion
- Groq API: https://groq.com
