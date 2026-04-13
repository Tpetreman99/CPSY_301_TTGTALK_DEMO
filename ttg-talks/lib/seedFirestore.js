import { db } from "./firebaseConfig";
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { contacts, conversations } from "./mockData";

export async function seedDatabase() {
// seed conversations
    for (const contact of contacts) {
      await setDoc(doc(db, 'users', contact.id), {
        name: contact.name,
        role: contact.role,
        avatar: contact.avatar,
      });
    }
// seed conversations and messages
    for (const contact of contacts) {
      const conversationId = ['lemres', contact.id].sort().join('_');

      await setDoc(doc(db, 'conversations', conversationId), {
        participants: ['lemres', contact.id],
        lastMessage: '',
        updatedAt: new Date(),
      });

      const msgs = conversations[contact.id] || [];
      for (const msg of msgs) {
        await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
          from: msg.from,
          text: msg.text,
          time: msg.time,
          createdAt: new Date(),
        });
      }
    }
    console.log('Database seeded!');
}