

## Plan: Fix Google Sign-In Redirect to Dashboard

### Problem
After Google sign-in, `redirect_uri` is set to `window.location.origin` (the root `/`), which shows the onboarding slideshow. The app never checks if a user is already authenticated on `/` to redirect them to the dashboard.

### Solution
Two changes needed:

1. **Update `src/pages/Index.tsx`** — Add an auth check at the top. If the user is already signed in, redirect them to `/admin` immediately instead of showing the onboarding slides.

2. **Update `src/pages/Login.tsx`** — Same auth check: if the user is already logged in when landing on `/login`, redirect to `/admin`.

This way, after Google OAuth completes and redirects to `/`, the app detects the authenticated session and sends the user straight to the dashboard.

### Files to modify
- `src/pages/Index.tsx` — Add `useAuth()` hook, redirect to `/admin` if `user` exists
- `src/pages/Login.tsx` — Add `useAuth()` hook, redirect to `/admin` if `user` exists

