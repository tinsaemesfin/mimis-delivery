# Supabase Configuration Instructions

## Email Template Configuration

Use the default Supabase template for password reset:

1. Log in to your Supabase dashboard
2. Go to **Authentication** → **Email Templates**
3. Select the **Reset Password** template
4. Use the default template which includes `{{ .ConfirmationURL }}`:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">reset your password</a></p>
```

5. Click **Save Changes**

## URL Configuration (CRITICAL)

1. Go to **Authentication** → **URL Configuration**
2. Make sure your app's deep link scheme is EXACTLY in this format in the **Redirect URLs** list:
   - `mimisdelivery://reset-password`
   - **IMPORTANT**: Do not add any extra slashes, parameters, or variations
   - The code parameter will be automatically added by Supabase

## Site URL Setting

1. Verify your Site URL is set correctly
2. Go to **Authentication** → **URL Configuration**
3. Set the **Site URL** to your main app URL 

## Important Notes

- The default Supabase template with `{{ .ConfirmationURL }}` ensures the correct code format
- When a user clicks the link in the email, they will be redirected to your app with the URL format:
  - `mimisdelivery://reset-password?code=YOUR_CODE_HERE`
- Our app has been updated to extract this code and use `supabase.auth.exchangeCodeForSession(code)`
- This approach fixes the "Auth Session Missing Error" by establishing a valid session first
- Test the password reset flow by requesting a new password reset link after making these changes

## Troubleshooting

If you see "Invalid reset link" or "No recovery code found", try one of these solutions:

1. **Check URL Configuration**: Make sure your redirect URL in Supabase is exactly `mimisdelivery://reset-password` without any trailing slashes or extra parameters.

2. **Use the Code Directly**: We've added a new option to paste the code directly on the reset password screen:
   - Request a password reset
   - When you receive the email, open the link in a browser
   - Look at the URL and find the `code=XXXX` parameter
   - Copy only the code part (the characters after `code=` and before any `&` character)
   - In the app, paste this code in the "Paste reset code directly" field and tap Submit

3. **Check Link Format**: Make sure the link in your email has this format:
   - `mimisdelivery://reset-password?code=XXXX`
   - If the format is different, you may need to update your Supabase configuration 