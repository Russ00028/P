/*
 list-users.js
 Usage: node list-users.js
 Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON

 Prints the first 1000 users (UID and email). For more users, paginate using nextPageToken.
*/

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

async function listAllUsers(nextPageToken) {
  // List batch of users, 1000 at a time.
  try {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    result.users.forEach((userRecord) => {
      console.log(`${userRecord.uid} \t ${userRecord.email || '(no-email)'}`);
    });
    if (result.pageToken) {
      // Recurse to next page.
      await listAllUsers(result.pageToken);
    }
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

listAllUsers();
