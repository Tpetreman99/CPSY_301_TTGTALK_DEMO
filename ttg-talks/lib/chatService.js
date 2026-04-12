import {
  addDoc,
  setDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { db } from './firebaseConfig';

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export function subscribeToUsers(callback) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    callback(
      snapshot.docs.map((userDoc) => ({
        id: userDoc.id,
        ...userDoc.data(),
      }))
    );
  });
}

export async function createOrGetDirectConversation(currentUserId, otherUserId) {
  const memberIds = [currentUserId, otherUserId].sort();

  const q = query(
    collection(db, 'conversations'),
    where('memberIds', 'array-contains', currentUserId)
  );

  const snapshot = await getDocs(q);
  const existing = snapshot.docs.find(docSnap => {
    const data = docSnap.data();
    return data.type === 'direct' && data.memberIds.includes(otherUserId);
  });

  if (existing) {
    // If the current user had hidden this conversation, restore it now
    if (existing.data().hiddenFor?.includes(currentUserId)) {
      await updateDoc(doc(db, 'conversations', existing.id), {
        hiddenFor: arrayRemove(currentUserId),
      });
    }
    return existing.id;
  }

  const fallbackGroup = snapshot.docs.find((docSnap) => {
    const data = docSnap.data();
    return data.type === 'group' && data.memberIds?.length === 2 && data.memberIds.includes(otherUserId);
  });

  if (fallbackGroup) {
    const updates = {
      type: 'direct',
      updatedAt: serverTimestamp(),
    };

    if (fallbackGroup.data().hiddenFor?.includes(currentUserId)) {
      updates.hiddenFor = arrayRemove(currentUserId);
    }

    await updateDoc(doc(db, 'conversations', fallbackGroup.id), updates);
    return fallbackGroup.id;
  }

  const docRef = await addDoc(collection(db, 'conversations'), {
    type: 'direct',
    memberIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageText: '',
    lastMessageAt: null,
  });

  return docRef.id;
}

export async function getConversationById(conversationId) {
  const snapshot = await getDoc(doc(db, 'conversations', conversationId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
    type:
      snapshot.data().type === 'group' && snapshot.data().memberIds?.length === 2
        ? 'direct'
        : snapshot.data().type,
  };
}

export async function getMessagesByConversationId(conversationId) {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function sendMessage(conversationId, senderId, text) {
  const trimmedText = text.trim();

  if (!trimmedText) return;

  await addDoc(collection(db, 'messages'), {
    conversationId,
    senderId,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessageText: trimmedText,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserById(userId) {
  const snapshot = await getDoc(doc(db, 'users', userId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

// get most recent message from user ID 
export async function getConversationsByUserId(userId) {
  const q = query(
    collection(db, 'conversations'),
    where('memberIds', 'array-contains', userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function subscribeToMessages(conversationId, callback) {
  // Single-field where clause only — avoids requiring a composite Firestore index.
  // Messages are sorted client-side by createdAt.
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId)
  );
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return a.createdAt.toMillis() - b.createdAt.toMillis();
      });
    callback(msgs);
  });
}

// keeps mesage previews up to date without needing to refresh the page, this will also help with
// keeping the  most recent messages at the top
export function subscribeToConversationPreviews(userId, callback) {
  const q = query(
    collection(db, 'conversations'),
    where('memberIds', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const results = [];

    snapshot.docs.forEach((document) => {
      const data = document.data();
      const conversationType =
        data.type === 'group' && data.memberIds?.length === 2 ? 'direct' : data.type;

      if (data.hiddenFor?.includes(userId)) return;

      if (conversationType === 'group') {
        results.push({
          conversationId: document.id,
          type: 'group',
          memberIds: data.memberIds,
          createdBy: data.createdBy,
          admins: data.admins || [],
          lastMessageText: data.lastMessageText || '',
          lastMessageAt: data.lastMessageAt,
        });
      } else {
        const otherUserId = data.memberIds.find((id) => id !== userId);
        if (!otherUserId) return;
        results.push({
          conversationId: document.id,
          type: 'direct',
          otherUserId,
          lastMessageText: data.lastMessageText || '',
          lastMessageAt: data.lastMessageAt,
        });
      }
    });

    results.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.toMillis() - a.lastMessageAt.toMillis();
    });

    callback(results);
  });
}


// group chat creation
export async function createGroupConversation(memberIds, createdBy) {
  const sortedIds = [...memberIds].sort();

  // create a deterministic document ID from the member IDs
  const conversationId = 'group_' + sortedIds.join('_');

  const docRef = doc(db, 'conversations', conversationId);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    return conversationId;
  }

  await setDoc(docRef, {
    type: 'group',
    memberIds: sortedIds,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageText: '',
    lastMessageAt: null,
  });

  return conversationId;
}

// Adds a member to a conversation. Converts a direct chat to a group chat if needed.
export async function addMemberToConversation(conversationId, newUserId, currentUserId) {
  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) throw new Error('Conversation not found');

  const updates = { memberIds: arrayUnion(newUserId) };

  if (convSnap.data().type === 'direct') {
    updates.type = 'group';
    updates.createdBy = currentUserId;
    updates.admins = [];
  }

  await updateDoc(convRef, updates);
}

// Removes a member from a group conversation. Admin-only (enforced in UI).
export async function removeMemberFromConversation(conversationId, userId) {
  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) throw new Error('Conversation not found');

  const currentMemberIds = convSnap.data().memberIds || [];
  const nextMemberIds = currentMemberIds.filter((memberId) => memberId !== userId);

  const updates = {
    memberIds: nextMemberIds,
  };

  if (nextMemberIds.length === 2) {
    updates.type = 'direct';
  }

  await updateDoc(convRef, updates);
}

// Temporarily hides the conversation for this user. History is restored when they reopen the chat.
export async function hideConversation(conversationId, currentUserId) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    hiddenFor: arrayUnion(currentUserId),
  });
}

// Hides the conversation for this user only — other participants are unaffected.
export async function deleteConversation(conversationId, currentUserId) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    hiddenFor: arrayUnion(currentUserId),
  });
}

// Hard-deletes a group conversation and all its messages for everyone.
// Only admins/creators should call this.
export async function deleteGroupConversation(conversationId) {
  const messagesSnap = await getDocs(query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId)
  ));
  const batch = writeBatch(db);
  messagesSnap.docs.forEach((msgDoc) => batch.delete(msgDoc.ref));
  batch.delete(doc(db, 'conversations', conversationId));
  await batch.commit();
}

// Updates the current user's profile fields (displayName, avatar, status, presence).
export async function updateUserProfile(userId, updates) {
  await updateDoc(doc(db, 'users', userId), updates);
}

// Subscribes to a single user's profile in real time.
export function subscribeToUserProfile(userId, callback) {
  return onSnapshot(doc(db, 'users', userId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export async function deleteMessage(messageId) {
  await deleteDoc(doc(db, 'messages', messageId));
}

export async function editMessage(messageId, newText) {
  await updateDoc(doc(db, 'messages', messageId), {
    text: newText.trim(),
    editedAt: serverTimestamp(),
  });
}

// Re-authenticates then updates the user's password.
export async function changePassword(firebaseUser, currentPassword, newPassword) {
  const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
  await reauthenticateWithCredential(firebaseUser, credential);
  await updatePassword(firebaseUser, newPassword);
}
