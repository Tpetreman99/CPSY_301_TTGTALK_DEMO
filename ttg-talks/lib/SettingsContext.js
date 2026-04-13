import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [enterToSend, setEnterToSendState] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('enterToSend');
    return saved !== null ? saved === 'true' : true;
  });

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