Firebase setup and admin instructions

1) Firestore rules
- The project includes `firestore.rules`. These rules:
  - Allow any authenticated user to create a document under `leaveRequests`.
  - Allow read access to admins (custom claim `admin:true`) or to the owner (user email matches `resource.data.user`).
  - Allow update/delete only to admins.

- To deploy rules:
  - Install Firebase CLI: `npm install -g firebase-tools`
  - Login: `firebase login`
  - Initialize (if not already): `firebase init firestore` (choose the existing project)
  - Deploy rules: `firebase deploy --only firestore:rules`

2) Setting admin custom claims
- Generate a service account JSON (Firebase Console -> Project settings -> Service accounts -> Generate new private key).
- Set `GOOGLE_APPLICATION_CREDENTIALS` to point to that JSON, or place it in the environment used when running the script.
- Run:
  node set-custom-claims.js <USER_UID>
- To find a user's UID:
  - Use the Firebase Console Auth user list, or use the Admin SDK to list users.

3) Notes and security
- Client-side `adminEmails` checks are convenient but not secure. Use custom claims + security rules to enforce admin-only operations.
- After setting custom claims, the user must sign out & sign back in on the client to obtain the updated ID token with the new claims.

4) Testing flow
- Register a new account via `register.html` (or create in Firebase Console) with the admin email.
- In the Firebase Console > Authentication, find the UID and run the `set-custom-claims.js` script to grant admin.
- Sign in as that user in the app, then open `admin.html` to confirm access.

If you'd like, I can also:
- Add a tiny helper script to list users and their UIDs using the Admin SDK.
- Add CI-friendly deployment steps.
 
5) Listing users (admin helper)
- `list-users.js` added to the repo. To use:
  - Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON.
  - Run: `node list-users.js` to print UID and email for users.

6) Cloud Function (notification template)
- The `functions/` folder contains a template Cloud Function `notifyOnStatusChange` that triggers on document updates for `leaveRequests/{requestId}` and logs a notification when `status` changes.
- To deploy functions:
  - From the `functions` folder run `npm install`.
  - Then `firebase deploy --only functions`.

Security reminder: configure an email provider and secure Cloud Functions as needed.
