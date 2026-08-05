# 🛠 WIET Attendance - PWA Troubleshooting Guide

If you are facing issues installing or using the WIET Attendance App, please review the common issues and solutions below.

## 1. Installation Issues

### "I don't see the install prompt / button"
- **Reason:** Your browser might not support PWA installation fully, or you might have already installed it.
- **Solution (Android):** Open the Chrome menu (⋮) and manually tap "Install app" or "Add to Home screen".
- **Solution (iOS):** Apple Safari does not show an automatic prompt. You must tap the Share icon (⬆️) and select "Add to Home Screen".
- **Solution (Desktop):** Look for the small monitor/arrow icon (📥) in the address bar (Chrome/Edge). If it's missing, click the three dots menu (⋮) -> "Cast, save, and share" -> "Install page as app".

### "The app installed but the icon is broken/blank"
- **Reason:** Weak network connection during the initial install or a cache glitch.
- **Solution:** Uninstall the app, clear your browser cache, and reinstall it from the portal.

## 2. Update Issues

### "The app is showing outdated information"
- **Reason:** The app uses caching to load faster. If an update was missed, you might be seeing an older version of the UI.
- **Solution:** 
  1. When you see the "New version available!" banner at the top, click **Update Now**.
  2. If you don't see the banner, close the app completely (swipe it away from recent apps) and open it again.
  3. If data is still stale, use the pull-to-refresh gesture or click refresh on the page. Real-time data (like attendance marking) is always fetched fresh.

## 3. Offline Mode Issues

### "I can't mark attendance offline"
- **Reason:** For security and consistency, marking attendance requires a live connection to the server.
- **Solution:** You can only mark attendance when online. However, if your network drops *during* a session, wait until you are back online before hitting "Submit".

### "Offline indicator won't go away"
- **Reason:** The app thinks your device is disconnected from the internet.
- **Solution:** Check your Wi-Fi or Mobile Data connection. If your connection is fine, restart the app.

## 4. Browser Specific Tips
- **Firefox:** Firefox on mobile does not fully support PWA installations with a prompt. It acts as a standard website shortcut. Use Chrome on Android for the best experience.
- **Safari (iOS):** Always use Safari to install the app. Using Chrome on iOS will **not** give you the "Add to Home Screen" option.
