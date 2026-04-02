import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/home');
    } catch (error) {
      setError('Invalid credentials. Please try again or contact IT support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <p style={s.company}>Tartigrade Limited</p>
        <div style={s.logoBox}>
          <span style={s.logoText}>TTG</span>
        </div>

        <div style={s.field}>
          <label style={s.label}>Employee ID/Email</label>
          <input
            style={s.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoCapitalize="none"
          />
        </div>

        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && <p style={s.error}>{error}</p>}

        <button style={s.btn} onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>
      </div>
    </div>
  );
}

const s = {
  bg: {
    minHeight: '100vh',
    backgroundColor: '#e8e8e8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center' },

  card: {
    backgroundColor: '#1a2744',
    borderRadius: 12, padding: 40,
    width: 420, display: 'flex',
    flexDirection: 'column',
    alignItems: 'center' },

  company:  {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20 },

  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    border: '2px solid #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30 },
  
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold' },

  field: {
    width: '100%',
    marginBottom: 16 },

  label: {
    color: '#fff',
    marginBottom: 6,
    fontSize: 14,
    display: 'block' },
  input: {
    backgroundColor: '#8a9bbf',
    borderRadius: 6,
    padding: 10,
    color: '#fff',
    fontSize: 14,
    width: '100%',
    border: 'none',
    boxSizing: 'border-box' },

  error: {
    color: '#ff6b6b',
    marginBottom: 12,
    fontSize: 13 },

  btn: { backgroundColor: '#6b6bcc',
    borderRadius: 8,
    padding: '12px 48px',
    marginTop: 10,
    border: 'none',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    cursor: 'pointer' },
};