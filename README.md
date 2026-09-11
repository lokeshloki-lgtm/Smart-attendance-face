# Smart Attendance System: Secure Attendance Management Using Face Recognition and Computer Vision

A complete, production-ready full-stack attendance management system powered by facial recognition and computer vision technology.

## 🎯 Project Overview

**SmartAttend** is an intelligent attendance management platform that eliminates manual entry errors, prevents proxy attendance, and provides real-time analytics. The system uses face recognition to identify users and automatically record their attendance with date and time.

### Key Benefits
- **Automated Attendance**: Face recognition eliminates manual data entry
- **Anti-Proxy Safeguards**: One-time attendance per user per day with confidence verification
- **Real-Time Analytics**: Comprehensive dashboards and reports
- **Role-Based Access**: Separate admin and user interfaces
- **AI Assistant**: AttendanceAI for intelligent attendance insights
- **Secure & Scalable**: Production-grade security with JWT, bcrypt, and rate limiting

## 🌟 Features

### Admin Features
- User registration and management
- Facial data capture and registration
- Mark attendance for users
- View comprehensive attendance records
- Search and filter attendance by name, ID, date, department, status
- Generate daily, weekly, and monthly reports
- Export attendance data to CSV
- View advanced analytics and trends
- Use AttendanceAI for attendance insights
- Manage system settings

### User Features
- Secure login and authentication
- View personal attendance dashboard
- Mark attendance via face recognition
- View attendance history and percentage
- Track attendance trends
- View profile information
- Use AttendanceAI for personal insights

### Operational Capabilities
- **Automated Check-ins**: Identify users through the camera and record attendance with date and time
- **Real-Time Monitoring**: Track live attendance activity and surface current Present, Late, and Absent totals
- **Live Status Dashboard**: Give administrators an at-a-glance view of attendance health and user activity
- **AI-Powered Reporting**: Generate attendance insights, summaries, and trend analysis with AttendanceAI
- **Actionable Reporting**: Filter records by user, department, date, and status, then export results to CSV

## 📊 Performance Metrics

The following target metrics provide a concise reference for evaluating the platform:

| Metric | Target |
| --- | --- |
| Face recognition accuracy | **99.2%** |
| Check-in processing time | **< 1 sec** |
| Attendance records supported | **18k+** |
| Registered users supported | **500+** |

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router DOM** - Navigation
- **Axios** - HTTP client
- **React Webcam** - Camera access
- **face-api.js** - Face detection, descriptor generation, and face matching
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **CORS** - Cross-origin requests
- **Morgan** - Logging
- **Groq API** - AI-powered attendance insights and reporting

## 📋 System Architecture

```
┌─────────────────────────────────────────┐
│     React Frontend (Vite)               │
│  ┌──────────────────────────────────┐   │
│  │ Pages & Components               │   │
│  │ - Landing                        │   │
│  │ - Authentication                 │   │
│  │ - Dashboard                      │   │
│  │ - Attendance                     │   │
│  │ - Reports                        │   │
│  │ - Analytics                      │   │
│  │ - AI Assistant                   │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ Face Recognition (face-api.js)   │   │
│  │ - Face detection                 │   │
│  │ - Face descriptor generation     │   │
│  │ - Face matching                  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
              │ HTTP/HTTPS
              ▼
┌─────────────────────────────────────────┐
│   Express.js Backend (Node.js)          │
│  ┌──────────────────────────────────┐   │
│  │ API Routes                       │   │
│  │ - Authentication                 │   │
│  │ - User Management                │   │
│  │ - Attendance                     │   │
│  │ - Analytics                      │   │
│  │ - AI Chat                        │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ Middleware                       │   │
│  │ - Authentication                 │   │
│  │ - Authorization                  │   │
│  │ - Rate Limiting                  │   │
│  │ - Error Handling                 │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ Controllers & Services           │   │
│  │ - Auth Service                   │   │
│  │ - User Service                   │   │
│  │ - Attendance Service             │   │
│  │ - Groq AI Service                │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      MongoDB Database                   │
│  ┌──────────────────────────────────┐   │
│  │ Collections                      │   │
│  │ - Users                          │   │
│  │ - Attendance Records             │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    External Services                    │
│  - Groq API (AI Assistant)              │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- A Groq API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smart-attendance-system
```

2. **Install dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Setup environment variables**

**Server (.env)**
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

**Client (.env)**
```bash
cd ../client
cp .env.example .env
# Edit .env with your configuration
```

### Development

1. **Start MongoDB**
```bash
# Make sure MongoDB is running on your system
# On Windows: run MongoDB service
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod
```

2. **Start the backend server**
```bash
cd server
npm run dev
```

Backend runs on `http://localhost:5000`

3. **Start the frontend development server** (in a new terminal)
```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`

4. **Access the application**
- Landing page: http://localhost:5173
- Admin dashboard: http://localhost:5173/dashboard (after login)

## 📚 API Documentation

### Authentication Endpoints

**Register User**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "USER"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

**Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

### Attendance Endpoints

**Mark Attendance**
```
POST /api/attendance/mark
Authorization: Bearer <token>
Content-Type: application/json

{
  "faceDescriptor": [...],
  "confidence": 0.85
}

Response:
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "date": "2026-08-31",
    "checkInTime": "09:15:30",
    "status": "Present",
    "recognitionConfidence": 0.85
  }
}
```

**Get Attendance Records**
```
GET /api/attendance?date=2026-08-31&department=IT&status=Present
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": {
        "name": "John Doe",
        "email": "john@example.com",
        "studentId": "STU001"
      },
      "date": "2026-08-31",
      "checkInTime": "09:15:30",
      "status": "Present"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

### User Endpoints

**Get Profile**
```
GET /api/users/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "employeeId": "EMP001",
    "role": "USER",
    "department": "IT",
    "phone": "1234567890",
    "profileImage": "url",
    "isActive": true
  }
}
```

### Dashboard Endpoints

**Admin Dashboard**
```
GET /api/dashboard/admin
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "presentToday": 120,
      "absentToday": 20,
      "lateToday": 10,
      "averageAttendance": 85.5
    },
    "recentAttendance": [...],
    "dailyAttendance": [...],
    "departmentStats": [...]
  }
}
```

### AI Assistant Endpoint

**Chat with AttendanceAI**
```
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Show me today's attendance summary"
}

Response:
{
  "success": true,
  "data": {
    "message": "Today's attendance shows 120 employees present out of 150...",
    "conversationId": "..."
  }
}
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Admin and User roles
- **Rate Limiting**: 
  - Authentication: 10 req/15 min
  - General API: 100 req/15 min
  - AI endpoint: 20 req/15 min
- **Helmet**: Security HTTP headers
- **CORS**: Configured for frontend domain
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Secure error messages (no stack traces in production)
- **MongoDB Injection Protection**: Mongoose schema validation
- **Environment Secrets**: API keys stored in .env, never exposed to frontend

## 🧬 Face Recognition Flow

### User Registration with Face
1. Admin logs in
2. Opens "Register User"
3. Enters user details
4. Camera opens for face capture
5. System detects face
6. Generates face descriptor
7. Saves descriptor securely to database
8. Creates user account

### Attendance Marking
1. User opens attendance screen
2. Camera starts
3. Face is detected and analyzed
4. System generates face descriptor
5. Descriptor compared with registered users
6. If match found with confidence > threshold:
   - User identified
   - Check for duplicate attendance today
   - Record attendance with timestamp
   - Display success message
7. If no match or low confidence:
   - Display "Face not recognized"
   - Allow retry

## 📊 Database Design

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  employeeId: String,
  studentId: String,
  role: String ("ADMIN" | "USER"),
  department: String,
  phone: String,
  profileImage: String,
  faceDescriptor: Array,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance Model
```javascript
{
  userId: ObjectId (ref: User),
  date: Date,
  checkInTime: String,
  checkOutTime: String,
  status: String ("Present" | "Late" | "Absent"),
  recognitionConfidence: Number,
  verificationMethod: String ("Face Recognition" | "Manual"),
  deviceInfo: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Database Indexes
- User: `email`, `studentId`, `employeeId`
- Attendance: `userId`, `date`, `userId+date` (compound)

## 🎨 UI Features

- **Modern SaaS Design**: Glassmorphism with soft shadows
- **Dark/Light Mode**: Theme switching with localStorage persistence
- **Responsive Design**: Mobile, tablet, and desktop support
- **Smooth Animations**: Framer Motion transitions
- **Loading States**: Skeleton loaders for all sections
- **Error Handling**: Friendly error messages with retry options
- **Accessibility**: Semantic HTML, keyboard navigation, ARIA labels

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🚢 Production Deployment

### Frontend Deployment

**Vercel**
```bash
npm run build
vercel deploy
```

**Netlify**
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Backend Deployment

**Render**
1. Push code to GitHub
2. Create new Web Service on Render
3. Select your repository
4. Set environment variables in Render dashboard
5. Deploy

**Railway**
1. Push code to GitHub
2. Create new project on Railway
3. Add MongoDB plugin
4. Set environment variables
5. Deploy

**Fly.io**
```bash
fly launch
fly secrets set MONGO_URI=your_mongodb_uri
fly secrets set JWT_SECRET=your_jwt_secret
fly deploy
```

### Environment Variables for Production

**Backend (.env)**
```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smartattend
JWT_SECRET=your_strong_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
```

**Frontend (.env.production)**
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## 📝 Environment Setup

### Local Development

**Server .env**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartattend
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client .env**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

See `.env.example` files for complete configuration options.

## 🧪 Testing

### Backend Tests
```bash
cd server
npm run test
```

### Frontend Tests
```bash
cd client
npm run test
```

## 📄 Project Structure

```
smart-attendance-system/
├── client/                          # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   ├── attendance/
│   │   │   └── ai/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── seed.js
│
├── README.md
├── .gitignore
└── package.json
```

## 🔐 Privacy & Security

Facial recognition data is sensitive biometric information. This system:

- Collects only necessary facial descriptors
- Processes camera frames locally in the browser
- Stores descriptors securely in MongoDB
- Restricts administrative access to biometric data
- Does not upload unnecessary camera footage
- Implements proper access controls

**Important**: Before deploying to production, ensure compliance with applicable privacy laws and regulations (GDPR, CCPA, FERPA, etc.).

## 🤝 Contributing

This project is ideal for:
- Academic final-year projects
- Portfolio demonstration
- Real-world deployment with customization
- Educational institutions
- Corporate environments

## 📖 Documentation

Comprehensive documentation is included in:
- `API_DOCUMENTATION.md` - Detailed API endpoints
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `DEVELOPMENT.md` - Development setup
- Code comments throughout the project

## 📞 Support

For issues, questions, or feature requests, refer to the documentation or review the code comments.

## ⚠️ Important Notes

1. **Face Recognition Accuracy**: Depends on lighting, camera quality, face angle, and model quality
2. **Anti-Proxy Safeguards**: Face recognition is one layer of security, not a complete guarantee
3. **Demo Mode**: Optional demo mode available for presentations (controlled via environment variable)
4. **Deployment Checklist**:
   - Set strong JWT secret
   - Configure MongoDB securely
   - Set appropriate CORS origins
   - Enable HTTPS in production
   - Implement proper backups
   - Set rate limits appropriately
   - Review privacy compliance

## 📄 License

This project is suitable for academic and commercial use. Ensure proper attribution and compliance with all dependencies' licenses.

---

**Built with ❤️ as a comprehensive Smart Attendance Management System**

Last Updated: 2026-08-31
Version: 1.0.0
#   S m a r t - a t t e n d a n c e - f a c e - r e c o g n i t i o n -  
 #   S m a r t - a t t e n d a n c e - f a c e - r e c o g n i t i o n -  
 #   S m a r t - a t t e n d a n c e - f a c e - r e c o g n i t i o n -  
 #   S m a r t - a t t e n d a n c e - f a c e - r e c o g n i t i o n  
 #   S m a r t - a t t e n d a n c e - f a c e - r e c o g n i t i o n  
 #   S m a r t - a t t e n d a n c e - f a c e - r e c o g n i t i o n - a p p  
 #   S m a r t - a t t e n d a n c e - f a c e - r e c o g n i t i o n - a p p  
 #   S m a r t - a t t e n d a n c e - f a c e  
 #   S m a r t - a t t e n d a n c e - f a c e  
 #   S m a r t - a t t e n d a n c e - f a c e  
 