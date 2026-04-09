import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function createOrGetDirectConversation(currentUserId, otherUserId) {
  const memberIds = [currentUserId, otherUserId].sort();

  const q = query(
    collection(db, 'conversations'),
    where('type', '==', 'direct'),
    where('memberIds', '==', memberIds)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
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

// keeps mesage previews up to date without needing toi refresh the page, this will also help with
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
      const otherUserId = data.memberIds.find((id) => id !== userId);
      if (!otherUserId) return;
      results.push({
        otherUserId,
        lastMessageText: data.lastMessageText || '',
        lastMessageAt: data.lastMessageAt,
      });
    });

    results.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.toMillis() - a.lastMessageAt.toMillis();
    });

    callback(results);
  });
}