import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TimeFormat, getTimeFormat, setTimeFormat as saveTimeFormat } from '../utils/timeFormat';

interface SettingsContextType {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('hhmm');

  // Load time format from localStorage on mount
  useEffect(() => {
    const storedFormat = getTimeFormat();
    setTimeFormatState(storedFormat);
  }, []);

  const setTimeFormat = (format: TimeFormat) => {
    setTimeFormatState(format);
    saveTimeFormat(format);
  };

  return (
    <SettingsContext.Provider value={{ timeFormat, setTimeFormat }}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Custom hook to access settings context
 * @throws Error if used outside of SettingsProvider
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
