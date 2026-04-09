"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";

import { contacts, conversations } from "../lib/mockData";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebaseConfig";

export default function Layout({ children }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().displayName || "Unnamed", // <-- map displayName
          avatar: doc.data().avatar || "👤",
          role: doc.data().role || "",
          email: doc.data().email || "",
          uid: doc.data().uid || "",
        }));
        setUsers(usersList);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 0) {
      setSearchResults(
        users.filter((u) => u.name.toLowerCase().includes(text.toLowerCase())),
      );
    } else {
      setSearchResults([]);
    }
  };

  // const openChat = (contact) => {
  //   setSearch("");
  //   setSearchResults([]);
  //   setSearchFocused(false);
  //   setActiveChat(contact.id);
  //   router.push(`/conversation/${contact.id}`);
  // };

  const openChat = async (contact) => {
    console.log("Opening chat with:", contact);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("No logged-in user");
      return;
    }

    try {
      //Step 1: Find existing chat
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser.uid),
      );

      const querySnapshot = await getDocs(q);

      let existingChat = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.participants.includes(contact.uid)) {
          existingChat = { id: doc.id, ...data };
        }
      });

      //Step 2: If chat exists → open it
      if (existingChat) {
        console.log("Chat exists:", existingChat.id);
        router.push(`/conversation/${existingChat.id}`);
        return;
      }

      //Step 3: If not → create new chat
      const newChat = await addDoc(collection(db, "chats"), {
        participants: [currentUser.uid, contact.uid],
        createdAt: serverTimestamp(),
      });

      console.log("New chat created:", newChat.id);

      router.push(`/conversation/${newChat.id}`);
    } catch (err) {
      console.error("Error opening chat:", err);
    }
  };

  const getLastMessage = (contactId) => {
    const msgs = conversations[contactId];
    if (!msgs || msgs.length === 0) return "";
    const last = msgs[msgs.length - 1];
    const sender =
      last.from === "lemres"
        ? "You"
        : contacts.find((c) => c.id === last.from)?.name.split(" ")[0];
    return `${sender}: ${last.text}`;
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) return;

      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser.uid),
      );

      const unsubscribeChats = onSnapshot(q, (snapshot) => {
        const chatList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Chats updated:", chatList); // 👈 debug
        setChats(chatList);
      });

      return unsubscribeChats;
    });

    return () => unsubscribeAuth();
  }, []);

  const getOtherUser = (chat) => {
    const currentUser = auth.currentUser;
    const otherUid = chat.participants.find((uid) => uid !== currentUser.uid);

    return users.find((u) => u.uid === otherUid);
  };

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logoBox}>
          <span style={s.logoText}>TTG</span>
        </div>
        <button style={s.iconBtn}>＋</button>
        <button style={s.iconBtn}>⚙</button>
        <div style={{ flex: 1 }} />
        <button style={s.iconBtn} onClick={() => signOut(auth)}>
          ⇥
        </button>
      </div>

      {/* Chat list */}
      <div style={s.chatList}>
        <div style={s.searchBar}>
          <input
            style={s.searchInput}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 300)}
            placeholder="Search"
          />
          <span>🔍</span>
        </div>

        {searchFocused && searchResults.length > 0 && (
          <div style={s.dropdown}>
            {searchResults.map((c) => (
              <div
                key={c.id}
                style={s.dropItem}
                onMouseDown={() => openChat(c)}
              >
                <span style={s.dropAvatar}>{c.avatar}</span>
                <div>
                  <p style={s.dropName}>{c.name}</p>
                  <p style={s.dropRole}>{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {chats.map((chat) => {
          const otherUser = getOtherUser(chat);

          if (!otherUser) return null;

          return (
            <div
              key={chat.id}
              style={{
                ...s.chatRow,
                ...(activeChat === chat.id ? s.chatRowActive : {}),
              }}
              onClick={() => {
                setActiveChat(chat.id);
                router.push(`/conversation/${chat.id}`);
              }}
            >
              <span style={s.avatar}>{otherUser.avatar}</span>
              <div style={s.chatInfo}>
                <p style={s.chatName}>{otherUser.name}</p>
                <p style={s.chatPreview}>Tap to chat</p>
              </div>
              <span style={s.dots}>•••</span>
            </div>
          );
        })}
      </div>

      {/* Page content slots in here */}
      <div style={s.main}>{children}</div>
    </div>
  );
}

const ACCENT = "#7b7fd4";
const GREEN = "#5a9e5a";
const DARK = "#1a2744";

const s = {
  root: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f0f2f8",
  },
  sidebar: {
    width: 72,
    backgroundColor: DARK,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 0",
    gap: 16,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    border: "2px solid #fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 22,
    cursor: "pointer",
  },
  chatList: {
    width: 300,
    backgroundColor: "#dde4f0",
    paddingTop: 12,
    overflowY: "auto",
    position: "relative",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#b0bccc",
    borderRadius: 20,
    margin: "0 12px 8px",
    padding: "0 12px",
    height: 38,
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  dropdown: {
    position: "absolute",
    top: 54,
    left: 12,
    right: 12,
    zIndex: 99,
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  dropItem: {
    display: "flex",
    alignItems: "center",
    padding: 10,
    gap: 10,
    borderBottom: "1px solid #eee",
    cursor: "pointer",
  },
  dropAvatar: {
    fontSize: 24,
  },
  dropName: {
    fontWeight: "bold",
    fontSize: 14,
    margin: 0,
  },
  dropRole: {
    color: "#888",
    fontSize: 12,
    margin: 0,
  },
  chatRow: {
    display: "flex",
    alignItems: "center",
    padding: 12,
    borderBottom: "1px solid #c8d0e0",
    cursor: "pointer",
  },
  chatRowActive: {
    backgroundColor: "#c0cadf",
  },
  avatar: {
    fontSize: 30,
    marginRight: 10,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontWeight: "bold",
    fontSize: 14,
    color: DARK,
    margin: 0,
  },
  chatPreview: {
    color: "#555",
    fontSize: 12,
    marginTop: 2,
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dots: {
    color: "#888",
    fontSize: 10,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
};
