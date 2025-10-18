/*
 set-custom-claims.js

 Node script that sets a custom claim (admin:true) for a given user UID using Firebase Admin SDK.
 Usage:
   1) Create a service account JSON in Firebase Console -> Project Settings -> Service Accounts -> Generate new private key.
   2) Place the JSON file next to this script, or provide the path via GOOGLE_APPLICATION_CREDENTIALS env var.
   3) Run: node set-custom-claims.js <USER_UID>
*/

const admin = require('firebase-admin');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node set-custom-claims.js <USER_UID>');
  process.exit(1);
}

const uid = process.argv[2];

// Initialize the admin SDK using default credentials or a service account key
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Custom claim set for user ${uid}.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to set claims:', err);
    process.exit(2);
  });
