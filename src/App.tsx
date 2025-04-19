import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TimeTracking from './pages/TimeTracking'
import Projects from './pages/Projects'
import Team from './pages/Team'
import Reports from './pages/Reports'
import Invoices from './pages/Invoices'
import Expenses from './pages/Expenses'
import Manage from './pages/Manage'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

// 認証が必要なルートのラッパーコンポーネント
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // 認証状態の読み込み中は何も表示しない
  if (isLoading) {
    return null;
  }
  
  // 認証されていない場合はログインページにリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Box minH="100vh">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/time" element={
            <PrivateRoute>
              <Layout>
                <TimeTracking />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/expenses" element={
            <PrivateRoute>
              <Layout>
                <Expenses />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/projects" element={
            <PrivateRoute>
              <Layout>
                <Projects />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/team" element={
            <PrivateRoute>
              <Layout>
                <Team />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/reports" element={
            <PrivateRoute>
              <Layout>
                <Reports />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/invoices" element={
            <PrivateRoute>
              <Layout>
                <Invoices />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/manage" element={
            <PrivateRoute>
              <Layout>
                <Manage />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* 存在しないパスの場合はダッシュボードにリダイレクト */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Router>
  )
}

export default App