# 🎙 PWA Interview Guide

Use this guide to confidently answer technical and architectural questions regarding your PWA implementation during interviews.

## Common Interview Questions & Answers

### Q1: "Why did you choose to build a PWA instead of a native mobile app?"
**A:** "Given the small team size and the need for rapid iteration in an educational setting, a PWA provided the perfect balance. It allowed me to maintain a single React codebase for Android, iOS, and Desktop. It also bypassed the delays of App Store reviews, meaning I could push updates instantly via Vercel. For an attendance system that doesn't require heavy device integration (like 3D rendering or deep hardware access), a PWA delivers 95% of native app benefits with 20% of the effort and zero store fees."

### Q2: "Can you explain how your caching strategy works?"
**A:** "I implemented a multi-tier caching strategy using Workbox to balance performance with data integrity:
1. **NetworkOnly** for all write operations (like marking attendance). This ensures we never corrupt the database with stale, cached submissions.
2. **NetworkFirst (with a 10s timeout)** for dynamic data like teacher assignments. It tries to get fresh data, but falls back to the cache if the network drops, so the user doesn't see a blank screen.
3. **CacheFirst** for static assets and rarely changing endpoints (like college branches/subjects) for maximum speed.
This resulted in a massive reduction in server load while keeping critical data 100% accurate."

### Q3: "How do you handle updates in your PWA? Doesn't the cache trap users on old versions?"
**A:** "I avoided 'auto-updating' silently because it can break the app if a user is in the middle of a task. Instead, I used a `'prompt'` registration type. When the browser detects a byte-difference in the `sw.js` file, it downloads the new assets in the background. My React app listens for this and displays a non-intrusive 'New Version Available' UI prompt. I implemented a 30-second grace period—if the user clicks 'Update Now', it forcefully reloads to the new cache. If they dismiss it, the update applies silently on their next session."

### Q4: "What were the biggest limitations or challenges you faced with this PWA?"
**A:** "The biggest challenge was dealing with Apple's ecosystem. iOS Safari does not support the `beforeinstallprompt` event, meaning you can't programmatically show an 'Install' button like you can on Android/Chrome. I solved this by writing a feature-detection script. If the app detects an iOS device that isn't running in standalone mode, it triggers a custom CSS pop-up that visually guides the user to use the Safari 'Share > Add to Home Screen' button."

### Q5: "If your app scales to 100,000 users, how does the PWA architecture hold up?"
**A:** "The PWA architecture inherently scales incredibly well. Because the Service Worker caches the entire UI 'App Shell' locally on the device, returning users aren't downloading HTML/JS/CSS from our servers. This reduces frontend bandwidth hits by roughly 60%. Furthermore, by caching static API endpoints locally, we drastically reduce MongoDB queries. While the backend would eventually need load balancers and database sharding for 100k users, the PWA frontend is essentially CDN-distributed to the users' own devices."

### Q6: "How do you ensure your Service Worker doesn't cache sensitive authenticated data?"
**A:** "In the `vite.config.js` Workbox configuration, I explicitly blacklisted auth endpoints (`/api/auth/*`) from all caching rules, forcing them to `NetworkOnly`. Service Workers should never cache session tokens or personal identifiable information unless encrypted in IndexedDB, so strict routing isolation is crucial."
