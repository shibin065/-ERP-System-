import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import CourseList from './pages/academics/CourseList';
import AttendanceLog from './pages/attendance/AttendanceLog';
import FeeList from './pages/fees/FeeList';
import NoticeList from './pages/notices/NoticeList';
import LibraryList from './pages/library/LibraryList';
import UserManagement from './pages/users/UserManagement';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Auth...</div>;
    
    if (!user) {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            
            {/* Dashboard routes wrapped in ProtectedRoute and Layout */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardOverview />} />
                <Route path="academics" element={<CourseList />} />
                <Route path="attendance" element={<AttendanceLog />} />
                <Route path="fees" element={<FeeList />} />
                <Route path="library" element={<LibraryList />} />
                <Route path="notices" element={<NoticeList />} />
                <Route path="users" element={<UserManagement />} />
            </Route>

            {/* Redirect any unknown route to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
