

## Deploying to Vercel

Your project is a standard Vite + React SPA, which Vercel supports out of the box. Here's what's needed:

### 1. Add SPA rewrite config (`vercel.json`)
Since you use React Router with client-side routing, you need a `vercel.json` to rewrite all routes to `index.html` — otherwise refreshing on `/admin/invoices` or `/i/some-slug` will 404.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. Set environment variables in Vercel
In your Vercel project settings → Environment Variables, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Use the same values currently in your `.env` file. These are public/publishable keys so it's safe.

### 3. Update Google OAuth redirect URI
Your Google sign-in currently uses `window.location.origin` as the redirect URI. Once deployed to Vercel (e.g. `your-app.vercel.app` or a custom domain), you'll need to make sure that domain is allowed in the Cloud authentication settings. Go to **Cloud → Users → Auth Settings** and add the Vercel domain as an allowed redirect URL.

### 4. No build changes needed
Vercel auto-detects Vite projects. The build command (`vite build`) and output directory (`dist`) work by default.

### Summary of changes
| What | Action |
|------|--------|
| `vercel.json` | Create with SPA rewrites |
| Vercel env vars | Add 3 `VITE_SUPABASE_*` variables |
| Auth redirect | Add Vercel domain to allowed redirects |

No code changes are needed — only the `vercel.json` file and Vercel dashboard configuration.

