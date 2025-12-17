# 🚀 Installation & Setup Guide

Complete step-by-step guide to get your modern frontend running.

---

## Prerequisites

Before starting, ensure you have:
- **Node.js** 16 or higher installed
- **npm** or **yarn** package manager
- **Backend server** running on `http://localhost:5000`
- **Git** (optional, for version control)

### Check Your Environment

```bash
# Check Node version
node --version
# Should be v16 or higher

# Check npm version
npm --version
# Should be v7 or higher
```

---

## Step 1: Install Dependencies

### Navigate to Frontend Directory
```bash
cd frontend
# or if from root:
# cd "c:\MERN Practice\Wiet-AttendenceSystem\frontend"
```

### Install npm Packages
```bash
npm install
```

This will install:
- React 19.2.0
- React Router 7.10.1
- Axios 1.13.2
- Tailwind CSS 3.4.18
- Vite 7.2.4

Expected time: 2-5 minutes

---

## Step 2: Configure Environment

### Check if `.env.local` Exists
```bash
# List files to see if .env.local exists
ls -la
```

### Create/Update `.env.local`
```bash
# Windows (PowerShell)
echo 'VITE_API_URL=http://localhost:5000/api' > .env.local

# macOS/Linux
echo 'VITE_API_URL=http://localhost:5000/api' > .env.local
```

### File Content Should Be
```
VITE_API_URL=http://localhost:5000/api
```

### Verify Backend URL
If backend is on different port/host, update accordingly:
```
VITE_API_URL=http://your-backend-host:port/api
```

---

## Step 3: Start Development Server

### Run Development Server
```bash
npm run dev
```

### Expected Output
```
  VITE v7.2.4  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

---

## Step 4: Test the Application

### Login Page
1. Go to `http://localhost:5173`
2. You should see the modern login page
3. Try logging in with your test credentials

### Verify Backend Connection
1. Check browser DevTools (F12) → Network tab
2. Try to login
3. You should see a POST request to `/api/auth/login`
4. Response should show token and user info

### Navigate Through Application
- ✅ Login with admin account → Admin Dashboard
- ✅ Admin Dashboard → Try "Create User" button
- ✅ Create a new student account
- ✅ Logout and login with new account
- ✅ Check Student Dashboard

---

## Available Scripts

### Development Mode
```bash
npm run dev
```
- Starts dev server with hot reload
- Code changes auto-refresh
- Use while developing

### Build for Production
```bash
npm run build
```
- Creates optimized production build
- Minifies CSS and JavaScript
- Output in `dist/` folder

### Preview Production Build
```bash
npm run preview
```
- Test production build locally
- Useful before deploying

### Lint Code
```bash
npm run lint
```
- Checks code for errors
- Uses ESLint configuration

---

## Project Structure Quick Reference

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── context/            # State management
│   ├── App.jsx            # Main app
│   ├── main.jsx           # Entry point
│   ├── App.css            # App styles
│   └── index.css          # Global styles
├── public/                 # Static assets
├── .env.local             # Environment variables
├── package.json           # Dependencies
├── vite.config.js         # Vite config
└── tailwind.config.js     # Tailwind config
```

---

## Troubleshooting

### Issue: "Cannot GET /"
**Cause**: Dev server not running  
**Solution**: Run `npm run dev` and wait for server to start

### Issue: "Module not found" errors
**Cause**: Dependencies not installed  
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: API calls returning 404
**Cause**: Wrong API URL or backend not running  
**Solution**: 
- Verify backend is running: `http://localhost:5000`
- Check `.env.local` has correct URL
- Check Network tab in DevTools

### Issue: Styles not showing
**Cause**: Tailwind CSS not processing  
**Solution**:
```bash
npm run dev
# Restart the dev server if needed
```

### Issue: "Permission denied" on Windows
**Cause**: PowerShell execution policy  
**Solution**: Run PowerShell as Administrator or use Git Bash

### Issue: Port 5173 already in use
**Cause**: Another process using port  
**Solution**: 
```bash
# Windows - Find process on port 5173
netstat -ano | findstr :5173
# Kill the process (replace PID with actual ID)
taskkill /PID <PID> /F

# Or run on different port
npm run dev -- --port 5174
```

### Issue: "yarn not found"
**Cause**: Yarn not installed (but npm is)  
**Solution**: Use npm instead:
```bash
npm install
npm run dev
```

---

## Backend Connection Guide

### Verify Backend is Running
```bash
# Test backend server
curl http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
```

### Check Backend CORS Configuration
Backend `app.js` should have:
```javascript
import cors from "cors";
app.use(cors());
```

### Add Frontend URL to CORS (if needed)
```javascript
app.use(cors({
  origin: ["http://localhost:5173"]
}));
```

---

## Environment Variables Reference

### `.env.local` Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | http://localhost:5000/api | Backend API base URL |

### Using in Code
```javascript
// Access in any file
const apiUrl = import.meta.env.VITE_API_URL;

// Example
const loginUrl = `${import.meta.env.VITE_API_URL}/auth/login`;
```

---

## Performance Tips

### Development
- Use `npm run dev` for fast refresh
- Keep DevTools open to monitor network
- Use browser DevTools Performance tab

### Production
```bash
# Optimize build
npm run build

# Analyze bundle
npm run build -- --sourcemap
```

### Caching
- Vite handles CSS/JS caching
- Browser caches static assets
- Clear cache: Open DevTools → Network → Disable cache

---

## Deployment Guide

### Build for Deployment
```bash
npm run build
```

### Output Files
- `dist/index.html` - Main HTML file
- `dist/assets/` - JavaScript and CSS bundles
- Ready to deploy to any static server

### Deploy Options
1. **Vercel** - `vercel deploy`
2. **Netlify** - Drag & drop `dist/` folder
3. **GitHub Pages** - Push to gh-pages branch
4. **Traditional Server** - Copy `dist/` to web root

### Update Backend URL for Production
Update `.env` (different from `.env.local`):
```
VITE_API_URL=https://your-backend-api.com/api
```

Rebuild:
```bash
npm run build
```

---

## Development Workflow

### 1. Start Everything
```bash
# Terminal 1: Backend
node server.js

# Terminal 2: Frontend
npm run dev
```

### 2. Make Changes
- Edit files in `src/` directory
- Changes auto-refresh in browser
- Check console for errors

### 3. Test Features
- Login with different roles
- Test each dashboard
- Check error messages

### 4. Commit Changes
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### 5. Deploy
```bash
npm run build
# Deploy dist/ folder
```

---

## Common Configuration Tasks

### Change API Timeout
Edit `src/services/authService.js`:
```javascript
const axiosInstance = axios.create({
  baseURL: API,
  timeout: 10000, // 10 seconds
});
```

### Add Proxy (if needed)
Edit `vite.config.js`:
```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}
```

### Change Port
```bash
npm run dev -- --port 3000
```

---

## Getting Help

### Check Documentation
- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Docs](https://vitejs.dev/guide/)
- [React Router Docs](https://reactrouter.com)

### Debug Steps
1. **Check Browser Console** - Look for JavaScript errors
2. **Check Network Tab** - See API requests/responses
3. **Check Terminal** - Dev server warnings/errors
4. **Check `.env.local`** - Verify API URL
5. **Restart Dev Server** - Sometimes fixes issues

### Common Solutions
- Clear cache: `Ctrl+Shift+Delete` (Chrome)
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Restart dev server: `Ctrl+C` then `npm run dev`
- Reinstall dependencies: `npm install`

---

## Next Steps

After setup:

1. ✅ Explore the UI in different browser sizes
2. ✅ Test all authentication flows
3. ✅ Test all dashboards (Admin, Teacher, Student)
4. ✅ Review component code in `src/components/`
5. ✅ Read COMPONENT_DOCS.md for component details
6. ✅ Customize styling with Tailwind CSS
7. ✅ Add new features as needed

---

## Quick Checklist

- [ ] Node.js v16+ installed
- [ ] npm dependencies installed
- [ ] `.env.local` created with API URL
- [ ] Backend server running
- [ ] Dev server started with `npm run dev`
- [ ] Can access `http://localhost:5173`
- [ ] Can see modern login page
- [ ] Can login with test credentials
- [ ] Can navigate to dashboards
- [ ] Network requests show in DevTools

---

## You're All Set! 🎉

Your modern frontend is now ready to use. Start developing!

```bash
npm run dev
```

For detailed component usage, see **COMPONENT_DOCS.md**  
For UI overview, see **FRONTEND_UI_GUIDE.md**  
For implementation details, see **IMPLEMENTATION_SUMMARY.md**

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: ✅ Ready to Use
