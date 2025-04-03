# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Mimi's Delivery App

## Authentication Flows

### Password Reset Flow (Web-based)

For security and improved reliability, password reset is handled through a web-based flow:

1. User requests a password reset from the app
2. A reset link is sent to the user's email
3. Clicking the link redirects to the web interface: `https://mimisdelivery.aradatech.com/reset-password`
4. User sets new password on the web interface
5. After successful reset, user is redirected back to the app login screen

The web-based reset page is located in the `web-reset` directory and should be deployed to the cPanel hosting at `mimisdelivery.aradatech.com`.

### Email Confirmation Flow (Deep Links)

Email confirmation for new user registration uses app deep links:

1. User registers in the app
2. A confirmation link is sent to the user's email
3. Clicking the link opens the app directly (using the `mimisdelivery://` scheme)
4. App handles the confirmation internally

## Configuration

### Supabase Configuration

#### Password Reset (Web)
- Redirect URL: `https://mimisdelivery.aradatech.com/reset-password`

#### Email Confirmation (Deep Links)
- Redirect URL: `mimisdelivery://auth-callback?type=signup`

### App Configuration

The app is configured to handle deep links with the scheme `mimisdelivery://`.

In `app.json`:
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

## Implementation Details

### Web Reset Page
- Located in the `web-reset` directory
- Files to upload to cPanel:
  - `index.html`
  - `styles.css`
  - `reset.js`
  - `logo.png`

### App Changes
- Modified `resetPasswordForEmail` function to redirect to the web page
- Updated UI to clearly communicate the web-based flow to users
- Preserved deep linking functionality for email confirmation

## Testing

### Password Reset
1. Request a password reset from the app
2. Check the email and click the reset link
3. Complete the reset on the web page
4. Sign in to the app with the new password

### Email Confirmation
1. Register a new account
2. Check the email and click the confirmation link
3. App should open and handle the confirmation automatically
