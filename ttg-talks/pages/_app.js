import { SettingsProvider } from '../lib/SettingsContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <Component {...pageProps} />
    </SettingsProvider>
  );
}
