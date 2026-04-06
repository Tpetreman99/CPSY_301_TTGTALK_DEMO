import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import Layout from '../components/Layout';
import { seedDatabase } from '../lib/seedFirestore';


export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/');
    });
    return unsub;
  }, []);

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.headerTitle}>TTG TALKS</h1>
      </div>
      <div style={s.welcome}>
        <h2 style={s.welcomeTitle}>Welcome back!</h2>
        <p style={s.welcomeSub}>You have 28 unread messages</p>
        <div style={s.actions}>
          <div style={s.actionBtn}>
            <span style={s.actionIcon}>＋</span>
            <span style={s.actionLabel}>Create chat</span>
          </div>
          <div style={s.actionBtn}>
            <span style={s.actionIcon}>⚙</span>
            <span style={s.actionLabel}>Settings</span>
          </div>
          <div style={s.actionBtn} onClick={() => signOut(auth)}>
            <span style={s.actionIcon}>⇥</span>
            <span style={s.actionLabel}>Log out</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const ACCENT = '#7b7fd4';
const GREEN = '#5a9e5a';

const s = {
  header: {
    backgroundColor: GREEN,
    padding: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    margin: 0,
  },
  welcome: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 40,
    color: ACCENT,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 20,
    color: ACCENT,
    marginBottom: 48,
  },
  actions: {
    display: 'flex',
    gap: 24,
  },
  actionBtn: {
    width: 140,
    height: 140,
    backgroundColor: '#e8eaf6',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    cursor: 'pointer',
  },
  actionIcon: {
    fontSize: 40,
    color: ACCENT,
  },
  actionLabel: {
    color: ACCENT,
    fontSize: 16,
  },
};