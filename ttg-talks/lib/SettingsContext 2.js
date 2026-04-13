import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [enterToSend, setEnterToSendState] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('enterToSend');
    if (saved !== null) setEnterToSendState(saved === 'true');
  }, []);

  const setEnterToSend = (value) => {
    setEnterToSendState(value);
    localStorage.setItem('enterToSend', String(value));
  };

  return (
    <SettingsContext.Provider value={{ enterToSend, setEnterToSend }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
