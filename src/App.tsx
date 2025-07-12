import { Box } from '@chakra-ui/react'
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './contexts/AuthContext'
import Clients from './pages/Clients'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Invoices from './pages/Invoices'
import Login from './pages/Login'
import Manage from './pages/Manage'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Team from './pages/Team'
import TimeTracking from './pages/TimeTracking'
import { UserProvider } from './contexts/UserContext'
import { InvoiceProvider } from './contexts/InvoiceContext'

// A wrapper for private routes to handle authentication and layout.
const PrivateRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Box minH="100vh">
        <UserProvider>
            <InvoiceProvider>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<PrivateRoutes />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/time" element={<TimeTracking />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/manage" element={<Manage />} />
                  <Route path="/clients" element={<Clients />} />
                </Route>

                {/* 存在しないパスの場合はダッシュボードにリダイレクト */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </InvoiceProvider>
        </UserProvider>
      </Box>
    </Router>
  )
}

export default App