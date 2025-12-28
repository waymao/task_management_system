# Google Calendar Integration Setup

This guide will help you set up Google Calendar integration for your Agenda Management application.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API** for your project:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add scopes: `https://www.googleapis.com/auth/calendar`
   - Add test users (your email) if in testing mode
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Agenda Management App"
   - Authorized redirect URIs: `http://localhost:3000/api/google/callback`
5. Copy the **Client ID** and **Client Secret**

## Step 3: Configure Environment Variables

1. Open `packages/backend/.env`
2. Add your Google OAuth credentials:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/google/callback"
```

## Step 4: Run the Application

1. Start the backend server:
   ```bash
   cd packages/backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd packages/frontend
   npm run dev
   ```

## Step 5: Connect Google Calendar

1. Navigate to the **Calendar** page in the app
2. Click "Show Google Calendar Settings"
3. Click "Connect Google Calendar"
4. Sign in with your Google account and grant permissions
5. You'll be redirected back to the app with a success message

## Features

Once connected, the integration provides:

- **Auto-sync**: New assignments are automatically synced to Google Calendar
- **Time slots**: Assignments are created as calendar events with appropriate times:
  - All Day: 12 AM - 11 PM
  - Morning: 6 AM - 12 PM
  - Afternoon: 12 PM - 6 PM
  - Evening: 6 PM - 11 PM
- **Multiple accounts**: You can connect multiple Google accounts
- **Event details**: Task title and description are synced to calendar events

## Troubleshooting

### "Access blocked: This app's request is invalid"

This error occurs when the OAuth consent screen is not properly configured. Make sure:
- The app is in "Testing" mode and you've added your email as a test user
- OR publish the app to make it available to all users

### "redirect_uri_mismatch"

Make sure the redirect URI in your Google Cloud Console exactly matches:
```
http://localhost:3000/api/google/callback
```

### Events not syncing

- Check that you've connected your Google Calendar in the app
- Check the backend logs for any sync errors
- Verify that the Google Calendar API is enabled in your project

## Security Notes

- Never commit your `.env` file with real credentials to version control
- In production, use HTTPS and update the redirect URI accordingly
- Consider implementing user-specific OAuth instead of single-user mode
- Tokens are stored securely in the database and automatically refreshed

## Production Deployment

For production deployment:

1. Update `GOOGLE_REDIRECT_URI` to your production URL:
   ```env
   GOOGLE_REDIRECT_URI="https://yourdomain.com/api/google/callback"
   ```

2. Add the production redirect URI to Google Cloud Console

3. Update the OAuth consent screen to "Production" mode

4. Update the frontend redirect in `packages/backend/src/routes/google-calendar.ts`:
   ```typescript
   return reply.redirect('https://yourdomain.com/calendar?connected=true');
   ```
