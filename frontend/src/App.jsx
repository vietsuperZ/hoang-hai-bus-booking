import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import store from './redux/store';
import DriverDashboard from './pages/DriverDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import SearchTrips from './pages/SearchTrips';
import BookingPage from './pages/BookingPage';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import TicketDetail from './pages/TicketDetail';
import TripManagement from './pages/TripManagement';
import TripDetail from './pages/TripDetail';
// Components
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';

import './App.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={viVN}>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<SearchTrips />} />

              {/* Private routes */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/booking/:tripId"
                element={
                  <PrivateRoute>
                    <BookingPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <PrivateRoute>
                    <MyBookings />
                  </PrivateRoute>
                }
              />

              <Route
                path="/booking-details"
                element={
                  <PrivateRoute>
                    <TicketDetail />
                  </PrivateRoute>
                }
              />
              <Route path="/driver" element={
  <ProtectedRoute allowedRoles={['Tài xế']}>
    <DriverDashboard />
  </ProtectedRoute>
} />
              {/* Employee route */}
              <Route
                path="/employee"
                element={
                  <PrivateRoute>
                    <EmployeeDashboard />
                  </PrivateRoute>
                }
              />
              <Route 
  path="/employee/trips" 
  element={
    <ProtectedRoute requiredRole="Nhân viên">
      <TripManagement />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/employee/trips/:id" 
  element={
    <ProtectedRoute requiredRole="Nhân viên">
      <TripDetail />
    </ProtectedRoute>
  } 
/>
              {/* Admin routes */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;