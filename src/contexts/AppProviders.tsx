import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext.js';
import { ClientProvider } from './ClientContext.js';
import { ExpenseProvider } from './ExpenseContext.js';
import { ProjectProvider } from './ProjectContext.js';
import { TimeEntryProvider } from './TimeEntryContext.js';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <ClientProvider>
          <TimeEntryProvider>
            <ExpenseProvider>
              {children}
            </ExpenseProvider>
          </TimeEntryProvider>
        </ClientProvider>
      </ProjectProvider>
    </AuthProvider>
  );
};

export default AppProviders;