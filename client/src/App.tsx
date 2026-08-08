import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { AccountDetail } from './pages/AccountDetail';
import { Transactions } from './pages/Transactions';
import { AddTransaction } from './pages/AddTransaction';
import { EditTransaction } from './pages/EditTransaction';
import { TransactionDetail } from './pages/TransactionDetail';
import { Goals } from './pages/Goals';
import { GoalDetail } from './pages/GoalDetail';
import { Analytics } from './pages/Analytics';
import { Categories } from './pages/Categories';
import { Settings } from './pages/Settings';
import { Trash } from './pages/Trash';
import { Budgets } from './pages/Budgets';
import { Feed } from './pages/Feed';
import { Converter } from './pages/Converter';
const ImportTransactions = React.lazy(() =>
  import('./pages/ImportTransactions').then((m) => ({ default: m.ImportTransactions }))
);
import { ProtectedRoute } from './components/ProtectedRoute';
import { BottomNav } from './components/layout/BottomNav';
import { InstallPWA } from './components/InstallPWA';

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
          path="/transactions/:id/edit"
          element={
            <ProtectedRoute>
              <EditTransaction />
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

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trash"
          element={
            <ProtectedRoute>
              <Trash />
            </ProtectedRoute>
          }
        />

        <Route
          path="/budgets"
          element={
            <ProtectedRoute>
              <Budgets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />

        <Route
          path="/converter"
          element={
            <ProtectedRoute>
              <Converter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions/import"
          element={
            <ProtectedRoute>
              <Suspense
                fallback={
                  <div className="min-h-screen bg-app flex items-center justify-center text-secondary">
                    Загрузка...
                  </div>
                }
              >
                <ImportTransactions />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideNav && <BottomNav />}
      {!hideNav && <InstallPWA />}
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
