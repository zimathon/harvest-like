import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ProjectProvider } from './ProjectContext';
import { TimeEntryProvider } from './TimeEntryContext';
import { ExpenseProvider } from './ExpenseContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <TimeEntryProvider>
          <ExpenseProvider>
            {children}
          </ExpenseProvider>
        </TimeEntryProvider>
      </ProjectProvider>
    </AuthProvider>
  );
};