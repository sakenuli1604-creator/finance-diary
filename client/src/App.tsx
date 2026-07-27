import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { AccountDetail } from './pages/AccountDetail';
import { Transactions } from './pages/Transactions';
import { AddTransaction } from './pages/AddTransaction';
import { TransactionDetail } from './pages/TransactionDetail';
import { Goals } from './pages/Goals';
import { GoalDetail } from './pages/GoalDetail';
import { Analytics } from './pages/Analytics';
import { Categories } from './pages/Categories';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BottomNav } from './components/layout/BottomNav';

function AppContent() {
  const location = useLocation();

  // Скрываем навигацию на страницах входа/регистрации
  const hideNav = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <Accounts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/accounts/:id"
          element={
            <ProtectedRoute>
              <AccountDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions/add"
          element={
            <ProtectedRoute>
              <AddTransaction />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute>
              <TransactionDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <Goals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/goals/:id"
          element={
            <ProtectedRoute>
              <GoalDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
