// migrate.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Make sure this path is correct

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const OLD_APP_ID_DOC_ID = '1';       // The current incorrect document ID in your Firestore
const NEW_APP_ID_DOC_ID = 'zorvh-app'; // The correct APP_ID from your frontend code

// === IMPORTANT: Mappings for non-UID user documents if they exist ===
// If 'artifacts/1/users/1userdata' exists and needs to map to a real UID,
// put that mapping here. If your user documents under artifacts/1/users are ALREADY UIDs,
// then this can remain an empty object {}.
const USER_UID_MAPPINGS = {
  // '1userdata': 'THE_ACTUAL_FIREBASE_AUTH_UID_FOR_1USERDATA_HERE', // <-- IMPORTANT: REPLACE IF '1userdata' EXISTS!
};


// Recursive function to copy a single document and all its subcollections
async function copyDocumentWithSubcollections(oldDocRef, newDocRef) {
  // Try to copy the document's own fields
  const oldDocSnap = await oldDocRef.get();
  if (!oldDocSnap.exists) {
    // If the old document doesn't exist but we're creating a parent for its subcollections.
    // This could happen if 'users' or a UID document itself had no direct fields.
    await newDocRef.set({ _placeholder_user_doc: true }, { merge: true }); // Add specific placeholder
    console.log(`      Created placeholder document ${newDocRef.path}`);
    return;
  }
  const data = oldDocSnap.data();
  await newDocRef.set(data || {});
  // console.log(`      Copied data for ${oldDocRef.path}`); // Too verbose for main run


  // Get and copy all subcollections of this document
  const subcollections = await oldDocRef.listCollections();
  for (const subColRef of subcollections) {
    console.log(`        Processing nested subcollection: ${subColRef.id} under ${oldDocRef.path}`);
    const newSubColRef = newDocRef.collection(subColRef.id);

    const subColDocs = await subColRef.get();
    if (subColDocs.empty) {
      console.log(`          Subcollection ${subColRef.path} is empty. Skipping recursive copy.`);
      continue;
    }

    // For each document within this subcollection, recursively copy it
    for (const docInSub of subColDocs.docs) {
      const oldNestedDocRef = subColRef.doc(docInSub.id);
      const newNestedDocRef = newSubColRef.doc(docInSub.id);
      await copyDocumentWithSubcollections(oldNestedDocRef, newNestedDocRef); // Recursive call
    }
  }
}


// Main function to run the full migration
async function runFullMigration() {
  try {
    console.log("--- Starting Firestore Migration (Version 7 - Targeted Users Copy) ---");
    console.log(`Copying 'users' collection data from: artifacts/${OLD_APP_ID_DOC_ID}/users/...`);
    console.log(`To new location: artifacts/${NEW_APP_ID_DOC_ID}/users/...`);

    const newAppDocRef = db.collection('artifacts').doc(NEW_APP_ID_DOC_ID); // Points to artifacts/zorvh-app

    // --- Process 'users' collection (Most Critical Part) ---
    console.log(`\nStarting explicit copy for 'users' collection.`);
    const oldUsersColRef = db.collection('artifacts').doc(OLD_APP_ID_DOC_ID).collection('users');
    const newUsersColRef = newAppDocRef.collection('users'); // This is the target 'users' collection under the new APP_ID

    const usersSnapshot = await oldUsersColRef.get();
    if (usersSnapshot.empty) {
      console.log(`  'users' collection is empty under ${oldUsersColRef.path}. No user documents to copy.`);
    } else {
      for (const userDocSnap of usersSnapshot.docs) {
        const oldUserDocId = userDocSnap.id;
        let newUserDocId = oldUserDocId; // Default: assume old doc ID is already the UID

        // Apply mapping if this old ID is a non-UID document (e.g., '1userdata')
        if (USER_UID_MAPPINGS[oldUserDocId]) {
          newUserDocId = USER_UID_MAPPINGS[oldUserDocId];
          console.log(`  Mapping old user ID '${oldUserDocId}' to actual UID '${newUserDocId}'`);
        } else {
          // If no mapping, we assume it's already a valid UID.
          console.log(`  Copying user with assumed UID: '${oldUserDocId}'`);
        }

        const oldUserDocRef = oldUsersColRef.doc(oldUserDocId);
        const newUserDocRef = newUsersColRef.doc(newUserDocId);

        await copyDocumentWithSubcollections(oldUserDocRef, newUserDocRef);
      }
      console.log(`  Finished copying ${usersSnapshot.size} user documents (and their subcollections).`);
    }


    console.log("\n--- Migration Complete! ---");
    console.log("Only 'users' collection data was copied/updated. Your 'products' and 'newsletter_subscribers' should remain intact.");
    console.log("\nIMPORTANT NEXT STEPS:");
    console.log("1. **Verify in Console:** Go to your Firebase Console and visually confirm that the `users` collection now exists directly under `artifacts/zorvh-app`. Inside it, verify that documents named with actual user UIDs (e.g., `kXmctc70eHWCxCuTnXqYFBmdtEJ2`) contain their subcollections like `wishlist`, `user_data/profile`, `orders`, `address`, etc.");
    console.log("2. **Update Backend Code:** Modify all your Firebase Cloud Functions (and any other backend services) that interact with Firestore to use the new path (`artifacts/zorvh-app/...`) instead of the old (`artifacts/1/...`). Redeploy all affected backend services/functions.");
    console.log("3. **Test Thoroughly:** Test every single feature of your application (frontend and backend) to ensure everything works perfectly with the new data path.");
    console.log(`4. **DELETE OLD DATA (FINAL STEP):** ONLY AFTER you are 100% confident that everything is working, safely delete the 'artifacts/${OLD_APP_ID_DOC_ID}' document (and all its contents) from your Firestore console to avoid duplicate data and reduce costs.`);

  } catch (error) {
    console.error('\n--- MIGRATION FAILED ---');
    console.error(error);
    console.error('Please resolve the error and try again, or consult Firebase documentation.');
  }
}

runFullMigration();