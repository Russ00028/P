/**
 * Cloud Functions template (Node 18) to send notification when a leave request's status changes.
 * This is a template — configure an email provider (SendGrid, Mailgun) or use Firebase Extensions.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Example: trigger on update and send a notification when status changes
exports.notifyOnStatusChange = functions.firestore
  .document('leaveRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status === after.status) {
      return null; // no status change
    }

    const email = after.user; // assuming user email stored in `user`
    const status = after.status;

    // TODO: integrate with an email provider. This template logs the event.
    console.log(`Notify ${email}: your leave request ${context.params.requestId} is now ${status}`);

    return null;
  });
