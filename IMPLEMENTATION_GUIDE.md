# Authentication Implementation Guide for Mimi's Delivery

This document provides a comprehensive guide for setting up the authentication flows for Mimi's Delivery:
- Web-based password reset flow using cPanel hosting
- App-based email confirmation using deep links

## Overview

### Password Reset Flow:
1. User requests a password reset from the mobile app
2. User receives an email with a link to the web page at mimisdelivery.aradatech.com
3. User resets password on the web page
4. User returns to the app and logs in with new password

### Email Confirmation Flow:
1. User registers in the mobile app
2. User receives an email with a confirmation link
3. Clicking the link opens the app via deep link
4. App verifies the email confirmation automatically

## Web Implementation

### Files to Upload to cPanel

Upload the following files to the `public_html/reset-password` directory on your cPanel hosting:

1. `index.html` - The password reset form
2. `styles.css` - Styling for the reset form
3. `reset.js` - JavaScript for handling the reset logic
4. `logo.png` - Your app logo

### Configuration

Edit the `reset.js` file before uploading to add your Supabase credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your actual Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual Supabase anon key
```

## Supabase Configuration

### 1. Update URL Configuration

In your Supabase dashboard:
1. Go to Authentication → URL Configuration
2. Add the following redirect URLs:
   - `https://mimisdelivery.aradatech.com/reset-password` (for password reset)
   - `mimisdelivery://auth-callback?type=signup` (for email confirmation)

### 2. Email Templates

Update your email templates in Supabase:

#### Password Reset Email
Update the password reset email template to clearly explain that users will be redirected to a web page:

```html
<p>Hello,</p>
<p>Please click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
<p>You will be redirected to our secure website to complete the password reset process.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Thanks,<br>Mimi's Delivery Team</p>
```

#### Email Confirmation 
Keep the default email confirmation template, or customize it to match your brand.

## App Configuration

### 1. Deep Link Configuration

The app already has the correct deep link configuration in `app.json`. Make sure it includes:

```json
{
  "expo": {
    "scheme": "mimisdelivery",
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "mimisdelivery"
            ]
          }
        ]
      }
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "mimisdelivery"
            }
          ],
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    }
  }
}
```

### 2. Key Files

The implementation relies on these key files:

#### `utils/supabase.ts`
Contains the utility functions for authentication operations:
- `resetPasswordForEmail` - Redirects to web page for password reset
- `signUpWithEmail` - Uses deep links for email confirmation
- `extractTokenFromResetLink` - Extracts tokens from various URL formats

#### `app/auth-callback.tsx`
Handles deep link authentication callbacks:
- For email confirmation (`type=signup`): Verifies the email in-app
- For password reset (`type=recovery`): Shows a success message after web reset

#### `app/screens/ForgotPasswordScreen.tsx`
The UI for requesting a password reset with clear messaging about the web flow.

## Testing

### Testing Password Reset

1. Request a password reset from the app
2. Check the email for the reset link
3. Click the link to open the web page
4. Reset the password on the web page
5. Return to the app and log in with the new password

### Testing Email Confirmation

1. Register in the app with a new email
2. Check the email for the confirmation link
3. Click the link - it should open the app
4. The app should verify the email and show a success message

## Troubleshooting

### Password Reset Issues

1. Check that the Supabase redirect URL is set correctly
2. Verify that the reset.js file has the correct Supabase credentials
3. Enable debug mode by adding `?debug=true` to the web reset URL

### Email Confirmation Issues

1. Verify that the deep link scheme is registered correctly
2. Check the device's default browser settings
3. Test with the Expo Go app first, then with a production build

### Debugging

1. Check the console logs in the app for detailed debugging information
2. Review the browser console for any JavaScript errors on the web page
3. Verify all URLs and tokens are being correctly extracted

## Security Considerations

1. HTTPS is required for the web page - ensure SSL is configured correctly
2. Keep your Supabase credentials secure
3. The web-based approach provides better security against token interception 