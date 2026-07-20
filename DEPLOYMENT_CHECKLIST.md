# WIET Attendance System - Deployment Checklist

This document contains everything you need to know before deploying the WIET Attendance Management System to a Production Environment (like AWS, DigitalOcean, or Render/Vercel).

## 1. Environment Variables (Backend)

Ensure your `.env` file on the production server contains the following variables:

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=your_production_mongodb_atlas_uri

# Security / Authentication
JWT_SECRET=your_super_strong_random_jwt_secret_key
JWT_EXPIRES_IN=7d

# Frontend URL (For CORS)
CLIENT_URL=https://attendance.wiet.edu.in
```

## 2. Frontend Configuration (`.env.production`)

Ensure you create a `.env.production` file in the `frontend` folder before building:

```env
VITE_API_URL=https://api.wiet.edu.in/api
```

## 3. Deployment Steps

### Frontend Deployment (Vercel / Netlify / Nginx)

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. The `dist/` folder will be generated. Upload this folder to your hosting provider or serve it using Nginx.

### Backend Deployment (Node.js + PM2)

1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Install PM2 globally (if not installed): `npm install -g pm2`
4. Start the server using PM2:
   ```bash
   pm2 start src/app.js --name "wiet-attendance-api"
   ```
5. Ensure PM2 restarts on server crash:
   ```bash
   pm2 save
   pm2 startup
   ```

## 4. Production Security Checklist

- [x] **CORS Configuration:** Ensure `CLIENT_URL` strictly matches your frontend domain.
- [x] **Rate Limiting:** Protects your login routes from brute-force attacks (already implemented in `app.js`).
- [x] **Helmet Security Headers:** Protects from XSS and other attacks (already implemented in `app.js`).
- [x] **File Upload Limits:** Excel upload is strictly limited to 5MB and `.xlsx` extension.
- [x] **Token Verification:** Middleware explicitly checks if user still exists in the DB, preventing hijacked tokens from working if an admin deletes the user.

## 5. Final Manual Testing (Before Go-Live)

1. **Teacher Panel on Mobile:** Open the frontend URL on a mobile device and test the "Mark Attendance" panel to ensure the UI is fully responsive.
2. **Excel Upload:** Try uploading the generated template using the Admin panel.
3. **Download Excel:** Try downloading a monthly attendance report.
4. **Soft Deletion Check:** Create a dummy branch/student, and try deleting it. Ensure the system prompts you with the DELETE confirmation, and the impact counts look correct.
5. **Auto-Create Batch:** Upload an Excel file with a new Batch name and verify the batch gets created automatically.

Once these steps are verified, you are 100% production-ready! 🚀
