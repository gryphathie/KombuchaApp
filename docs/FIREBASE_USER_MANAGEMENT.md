# Firebase User Management Guide

## Overview

This app uses Firebase Authentication for user management. Since this is a private app, users cannot register themselves. All users must be manually created by an administrator through the Firebase Console.

## How to Add Users Manually

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `kombuchaapp`
3. Navigate to **Authentication** in the left sidebar

### Step 2: Add New User

1. Click on the **Users** tab
2. Click **Add User** button
3. Enter the user's email address
4. Enter a temporary password (the user can change this later)
5. Click **Add user**

### Step 3: User Setup

- The user will receive an email to verify their account
- They can then log in using their email and the temporary password
- They can change their password after first login

## User Management Features

### View All Users

- In Firebase Console > Authentication > Users
- You can see all registered users, their email, creation date, and last sign-in

### Delete Users

- Select a user from the list
- Click the three dots menu
- Select "Delete user"

### Reset Password

- Select a user from the list
- Click the three dots menu
- Select "Reset password"
- An email will be sent to the user with password reset instructions

### Disable/Enable Users

- Select a user from the list
- Click the three dots menu
- Select "Disable account" or "Enable account"

## Security Best Practices

1. **Strong Passwords**: Ensure all users have strong passwords
2. **Regular Review**: Periodically review the user list and remove inactive users
3. **Email Verification**: Ensure all users have verified their email addresses
4. **Monitor Activity**: Check the "Sign-in method" tab to monitor login activity

## Troubleshooting

### User Cannot Login

1. Check if the user exists in Firebase Console
2. Verify the email is correct
3. Check if the account is disabled
4. Ensure the user has verified their email

### Password Issues

1. Use the "Reset password" feature in Firebase Console
2. The user will receive an email with reset instructions

### Account Locked

- Firebase automatically locks accounts after multiple failed login attempts
- Wait 15-30 minutes or manually unlock in Firebase Console

## Additional Security Features

### Multi-Factor Authentication (Optional)

- Enable MFA in Firebase Console > Authentication > Sign-in method
- Users can set up 2FA for additional security

### Custom Claims (Advanced)

- Add custom user roles or permissions
- Requires Firebase Admin SDK implementation

## Contact Information

For technical support or user management issues, contact the system administrator.
