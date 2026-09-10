# Deployment Guide - Smart Attendance System

## Pre-Deployment Checklist

- [ ] Backend `.env` file configured with strong secrets
- [ ] Frontend `.env` file configured with production API URL
- [ ] MongoDB Atlas cluster created and network access configured
- [ ] Groq API key obtained
- [ ] Git repository created and code committed
- [ ] HTTPS certificates ready (for production domains)
- [ ] Domain names registered and configured
- [ ] All tests passing
- [ ] Performance optimized (Lighthouse score > 80)
- [ ] Security audit completed

---

## Part 1: Deploy Backend

### Option A: Deploy to Render

Render is a modern platform for deploying Node.js applications.

#### Step 1: Prepare Repository
```bash
cd smart-attendance-system
git init
git add .
git commit -m "Initial commit: Smart Attendance System"
git push origin main
```

#### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Connect your GitHub repository

#### Step 3: Deploy Backend Service
1. Click "New +" → "Web Service"
2. Select your GitHub repository
3. Configure:
   - **Name**: smart-attendance-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter (free) or Pro

4. Add Environment Variables:
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smartattend
   JWT_SECRET=<generate-strong-random-string-min-32-chars>
   GROQ_API_KEY=<your-groq-api-key>
   CLIENT_URL=https://yourdomain.com
   NODE_ENV=production
   ```

5. Deploy

#### Step 4: Verify Deployment
```bash
curl https://smart-attendance-api.onrender.com/api/health
```

#### Step 5: Update Frontend URL
Update `client/src/services/api.js` or `.env`:
```
VITE_API_BASE_URL=https://smart-attendance-api.onrender.com/api
```

---

### Option B: Deploy to Railway

Railway is user-friendly and free tier available.

#### Step 1: Create Account
1. Go to https://railway.app
2. Sign up with GitHub

#### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub"
3. Choose your repository

#### Step 3: Add MongoDB
1. Click "Add Service" → "Database" → "MongoDB"
2. Railway creates MongoDB automatically
3. Copy connection string from Variables

#### Step 4: Configure Backend
1. Set service root directory: `server`
2. Add environment variables:
   ```
   PORT=5000
   MONGO_URI=<from-railway-mongodb>
   JWT_SECRET=<generate-strong-secret>
   GROQ_API_KEY=<your-key>
   CLIENT_URL=https://yourdomain.com
   NODE_ENV=production
   ```
3. Deploy

#### Step 5: Get Backend URL
Railway provides public URL automatically (e.g., `https://smartattendance-production.up.railway.app`)

---

### Option C: Deploy to Heroku

Heroku still offers free tier with limitations.

#### Step 1: Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows (download installer from heroku.com)

# Linux
sudo apt install heroku
```

#### Step 2: Login to Heroku
```bash
heroku login
```

#### Step 3: Create Heroku App
```bash
cd server
heroku create smart-attendance-api
```

#### Step 4: Add MongoDB Add-on
```bash
heroku addons:create mongolab:sandbox
```

#### Step 5: Set Environment Variables
```bash
heroku config:set JWT_SECRET="<strong-secret>"
heroku config:set GROQ_API_KEY="<your-key>"
heroku config:set CLIENT_URL="https://yourdomain.com"
heroku config:set NODE_ENV="production"
```

#### Step 6: Deploy
```bash
git push heroku main
```

#### Step 7: Verify
```bash
heroku logs --tail
heroku open
```

---

## Part 2: Deploy Frontend

### Option A: Deploy to Vercel

Vercel is optimized for React/Vite applications.

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Deploy
```bash
cd client
vercel
```

#### Step 3: Configure
- **Project Name**: smartattend-frontend
- **Framework**: Vite
- **Output Directory**: dist

#### Step 4: Set Environment Variables in Vercel Dashboard
1. Go to Project Settings
2. Environment Variables
3. Add:
   ```
   VITE_API_BASE_URL=https://your-backend-api.com/api
   ```

#### Step 5: Redeploy
```bash
vercel --prod
```

#### Step 6: Get URL
Vercel assigns URL automatically (e.g., `smartattend.vercel.app`)

---

### Option B: Deploy to Netlify

Netlify offers easy deployment for static sites.

#### Step 1: Build Frontend
```bash
cd client
npm run build
```

#### Step 2: Create Netlify Account
1. Go to https://netlify.com
2. Sign up with GitHub

#### Step 3: Connect GitHub Repository
1. Click "New site from Git"
2. Select your GitHub repository
3. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `client`

#### Step 4: Set Environment Variables
1. Go to Site Settings → Build & Deploy → Environment
2. Add:
   ```
   VITE_API_BASE_URL=https://your-backend-api.com/api
   ```

#### Step 5: Deploy
Netlify auto-deploys on Git push

#### Step 6: Custom Domain
1. Domain Settings → Domains
2. Add custom domain
3. Configure DNS or use Netlify DNS

---

### Option C: Deploy to GitHub Pages

GitHub Pages for free static hosting (requires public repo).

#### Step 1: Update vite.config.js
```javascript
export default {
  base: '/smart-attendance-system/',
  // ... rest of config
}
```

#### Step 2: Build
```bash
cd client
npm run build
```

#### Step 3: Deploy Script
Create `deploy.sh`:
```bash
#!/bin/bash
npm run build
cd dist
git init
git add .
git commit -m "Deploy"
git push -f https://github.com/yourusername/smartattend.git main:gh-pages
```

#### Step 4: Enable GitHub Pages
1. Repository Settings
2. Pages → Source: `gh-pages` branch
3. Save

---

## Part 3: Database Setup

### MongoDB Atlas Setup (Recommended)

#### Step 1: Create Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create organization

#### Step 2: Create Cluster
1. Click "Create a Deployment"
2. Select "Free Tier" (M0)
3. Choose region close to your location
4. Create cluster

#### Step 3: Create Database User
1. Go to Database Access
2. Create database user:
   - Username: `smartattend_user`
   - Password: (generate strong password)
   - Permissions: Atlas Admin

#### Step 4: Configure IP Whitelist
1. Go to Network Access
2. Add IP addresses:
   - Your development IP
   - Your server IP
   - Or "Allow access from anywhere" (0.0.0.0/0) for dev/testing

#### Step 5: Get Connection String
1. Go to Databases
2. Click "Connect" on your cluster
3. Select "Drivers"
4. Copy connection string:
   ```
   mongodb+srv://smartattend_user:password@cluster.mongodb.net/smartattend
   ```

#### Step 6: Update Backend .env
```
MONGO_URI=mongodb+srv://smartattend_user:password@cluster.mongodb.net/smartattend
```

#### Step 7: Create Initial Database
```bash
# Connect to MongoDB Atlas
mongosh "mongodb+srv://cluster.mongodb.net/smartattend" --apiVersion 1 --username smartattend_user

# Or run seed script on deployed server
curl -X POST https://your-api.com/api/seed
```

---

## Part 4: Setup Custom Domain

### Configure Domain DNS

#### For Vercel Frontend
1. Get Vercel nameservers from project settings
2. Go to domain registrar
3. Update nameservers to Vercel's
4. Vercel auto-configures SSL

#### For Render Backend
1. Add custom domain in Render dashboard
2. Get Render DNS record
3. Add CNAME record to domain registrar
4. Render auto-generates SSL certificate

#### Example DNS Configuration
```
Domain: yourdomain.com

A Record: @ → Vercel IP
CNAME Record: api → render.onrender.com
CNAME Record: www → yourdomain.com
```

---

## Part 5: SSL/HTTPS Setup

Most platforms (Vercel, Render, Railway) provide free SSL certificates.

### Enable HTTPS
1. **Vercel**: Automatic
2. **Render**: Automatic after DNS setup
3. **Railway**: Automatic

### Enforce HTTPS
Update `server/src/app.js`:
```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## Part 6: Monitoring & Logging

### Setup Monitoring

#### Vercel Analytics
1. Dashboard → Analytics
2. Enable Web Analytics
3. View performance metrics

#### Render Logs
1. Dashboard → Logs
2. Real-time log streaming
3. Error notifications

#### Database Monitoring
1. MongoDB Atlas → Monitoring
2. Watch performance metrics
3. Set up alerts

### Add Error Tracking (Optional)

Install Sentry for error tracking:
```bash
npm install @sentry/node @sentry/tracing

# In server/src/server.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

---

## Part 7: Performance Optimization

### Backend Optimization
```javascript
// Enable compression
app.use(compression());

// Optimize MongoDB queries
// Add proper indexes (already in models)

// Implement caching
const redis = require('redis');
const client = redis.createClient();
```

### Frontend Optimization
```javascript
// Lazy load pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

// Code splitting with route-based splitting (already configured)

// Image optimization
// Use WebP format where possible

// Production build
npm run build
# Check bundle size
```

### Database Optimization
```javascript
// Compound indexes in Attendance model
attendanceSchema.index({ userId: 1, date: -1 });

// Query optimization
Attendance.find(query).lean().exec();
```

---

## Part 8: Backup Strategy

### MongoDB Backups

#### Automated Backups (Atlas)
1. MongoDB Atlas → Backup
2. Daily automated backups enabled by default
3. 7-day retention on free tier

#### Manual Backup
```bash
mongodump \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/smartattend" \
  --out=./backups/

# Restore
mongorestore \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/smartattend" \
  ./backups/
```

#### Backup Strategy
- Daily automated backups (MongoDB Atlas)
- Weekly manual exports to cloud storage (AWS S3, Google Cloud)
- Monthly full database archives

---

## Part 9: Security Hardening

### Before Production Deployment

1. **Change Default Secrets**
   ```
   JWT_SECRET=<generate-32-char-random>
   ```

2. **Enable Rate Limiting**
   ```
   Already configured in server/src/middleware/rateLimiter.js
   ```

3. **Setup CORS Properly**
   ```javascript
   // In server/src/app.js
   cors({
     origin: 'https://yourdomain.com',
     credentials: true
   })
   ```

4. **Enable Helmet**
   ```javascript
   // Already configured
   app.use(helmet());
   ```

5. **Environment Security**
   - Never commit `.env` files
   - Use secrets management service
   - Rotate secrets periodically

6. **API Security**
   - Use HTTPS only
   - Implement API key rotation
   - Add request logging

7. **Database Security**
   - Use strong passwords
   - IP whitelist (no 0.0.0.0/0 in production)
   - Enable encryption at rest
   - Regular security audits

---

## Part 10: Post-Deployment Verification

### Test Deployed Application

```bash
# 1. Health Check
curl https://your-api.com/api/health

# 2. Test Login
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartattend.com","password":"Admin@123456"}'

# 3. Test Protected Endpoint
curl https://your-api.com/api/dashboard/admin \
  -H "Authorization: Bearer <token-from-login>"

# 4. Verify Frontend
Open https://yourdomain.com in browser
Test login flow
Check face recognition (if camera access granted)
```

### Monitor Logs
```bash
# Render
render logs -s <service-id>

# Vercel
vercel logs

# Check browser console
# Check network tab for API calls
```

### Performance Testing
1. Run Lighthouse audit
2. Check Core Web Vitals
3. Test on slow network (Chrome DevTools)
4. Test on mobile devices

---

## Part 11: Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Verify backups completed

#### Monthly
- [ ] Update dependencies
- [ ] Security audit
- [ ] Performance optimization review
- [ ] User feedback review

#### Quarterly
- [ ] Major security update
- [ ] Database optimization
- [ ] Capacity planning

### Scaling Considerations

If traffic increases:

1. **Database**: Upgrade MongoDB cluster tier
2. **Backend**: 
   - Enable load balancing
   - Deploy multiple instances
   - Add caching layer (Redis)
3. **Frontend**: 
   - CDN caching
   - Lazy load assets
   - Optimize images

---

## Troubleshooting Deployment

### Backend Won't Start
```bash
# Check logs
heroku logs --tail
render logs -s <service-id>

# Common issues:
1. Missing environment variables
2. MongoDB connection string wrong
3. Port already in use (change PORT var)
4. Node version mismatch
```

### CORS Errors
```bash
# Verify CLIENT_URL matches frontend domain
# Check backend CORS configuration
# Browser console shows full error message
```

### Database Connection Failed
```bash
# Verify MongoDB URI
# Check IP whitelist on MongoDB Atlas
# Test connection locally first
```

### Frontend Not Loading
```bash
# Check browser network tab
# Verify VITE_API_BASE_URL is correct
# Check console for JavaScript errors
```

---

## Production Checklist

Before going live:

- [ ] Security audit completed
- [ ] Database backups configured
- [ ] SSL/HTTPS enforced
- [ ] Monitoring and logging enabled
- [ ] Error tracking configured
- [ ] Rate limiting verified
- [ ] Environment variables secured
- [ ] Database indexes optimized
- [ ] Performance tested (Lighthouse > 80)
- [ ] Mobile responsiveness tested
- [ ] All API endpoints tested
- [ ] Authentication flows tested
- [ ] Face recognition tested
- [ ] Export functionality tested
- [ ] Admin functions tested
- [ ] User functions tested

---

## Post-Launch Support

### Documentation
- [ ] User manual created
- [ ] Admin guide created
- [ ] API documentation updated
- [ ] Troubleshooting guide created
- [ ] Support email configured

### Monitoring
- [ ] Error alerts configured
- [ ] Performance alerts set up
- [ ] Database alerts configured
- [ ] Daily health check script

### Support
- [ ] Support email address established
- [ ] Bug report process created
- [ ] Feature request process created
- [ ] Update schedule communicated

---

## Rollback Plan

If deployment fails:

```bash
# For Git-based deployments
git revert <failed-commit>
git push origin main

# Render will auto-redeploy previous version
# Vercel keeps previous builds available
# For database, restore from latest backup
```

---

## Conclusion

Your Smart Attendance System is now deployed and ready for production use. Monitor the deployment closely in the first week and adjust as needed based on real-world usage patterns.

For support, refer to:
- Official documentation: docs.render.com, vercel.com, mongodb.com
- GitHub issues
- Community forums

Good luck with your deployment! 🚀
