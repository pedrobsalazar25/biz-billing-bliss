
The user wants me to test Google sign-in on the Vercel deployment. This requires browser automation (navigate + interact with Google OAuth), which is available in default mode.

Plan:
1. Navigate to `https://invoice-two-delta.vercel.app/login`
2. Click the "Continue with Google" button
3. Observe the redirect — verify it goes to Google's OAuth consent screen (accounts.google.com) and not a 404
4. Report back what happened. I will NOT complete the actual Google login (requires user credentials) — I'll just confirm the redirect chain works correctly through Lovable Cloud's callback URL and lands on Google's auth page

If the redirect succeeds → OAuth is correctly configured for Vercel.
If a 404 or error appears → I'll capture the failing URL and diagnose (likely a missing redirect URL in either Google Cloud Console or Lovable Cloud Auth Settings).
