

## Plan: Make the App Installable as a Mobile App

Since everything needs to stay within Lovable (no Android Studio, no terminal commands, no external tooling), the right approach is a **Progressive Web App (PWA)** — not Capacitor. Capacitor requires exporting the project, running CLI commands locally, and using Android Studio to build the APK, which all happen outside Lovable.

A PWA lets users install the app directly from their phone's browser to the home screen. It looks and feels like a native app (full screen, app icon, splash screen) — no app store needed.

### What will be done

1. **Create `public/manifest.json`** with app name, theme colors, display mode (`standalone`), and icon references so Android's "Add to Home Screen" / "Install App" prompt works.

2. **Generate PWA icons** — create placeholder icon files at required sizes (192x192, 512x512) in `public/`.

3. **Update `index.html`** — add `<link rel="manifest">`, mobile-optimized meta tags (`theme-color`, `apple-mobile-web-app-capable`, `viewport`), and icon references.

4. **Create an `/install` page** — a simple page with instructions on how to install the app on Android (tap browser menu → "Install app" or "Add to Home Screen"). This page will also attempt to trigger the browser's native install prompt via the `beforeinstallprompt` event.

5. **Add route** for `/install` in `App.tsx`.

### What this gives you

- On Android Chrome, users visiting the published URL will see an "Install" banner or can tap Menu → "Install app"
- The app launches full-screen with your icon, like a native app
- No app store submission, no external tools needed
- Works immediately on the published URL

### Limitations

- No offline support (would require service workers which cause issues in Lovable's editor preview)
- Advanced native features (camera, push notifications, NFC) are limited compared to a true native app
- The install experience only works on the **published** URL, not in the Lovable editor preview

