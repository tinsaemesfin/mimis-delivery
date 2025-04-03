# Mimi's Delivery Password Reset Web Page

This directory contains the web files needed to implement a password reset page for Mimi's Delivery app. This page should be hosted on the `mimisdelivery.aradatech.com` domain.

## Setup Instructions

### 1. Prerequisites
- Access to cPanel for the `mimisdelivery.aradatech.com` domain
- Supabase project and credentials

### 2. Configuration

Edit the `reset.js` file and replace the placeholder values with your actual Supabase credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your actual Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual Supabase anon key
```

### 3. File Upload to cPanel

1. Log in to your cPanel account
2. Navigate to the File Manager
3. Go to the public_html directory (or the appropriate web root for your domain)
4. Create a directory called `reset-password`
5. Upload all the files from this directory to the new `reset-password` directory:
   - index.html
   - styles.css
   - reset.js
   - logo.png (make sure to upload your app logo)

### 4. Supabase Configuration

1. Log in to your Supabase dashboard
2. Go to Authentication → URL Configuration
3. Add `https://mimisdelivery.aradatech.com/reset-password` as a redirect URL
4. Save the changes

## Testing

To test the password reset flow:

1. Request a password reset from your app
2. Check the email and click the reset link
3. You should be redirected to your web page
4. Enter a new password and submit the form
5. After successful reset, you should be able to log in with the new password

## Debugging

Add `?debug=true` to the URL to see debug information about the token and other parameters.

Example: `https://mimisdelivery.aradatech.com/reset-password?debug=true`

## Customization

- Update the logo.png file with your own logo
- Modify the CSS in styles.css to match your brand colors
- Update the success page link if needed (currently points to `/login`) 