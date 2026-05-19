import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
    LayoutDashboard, 
    Users, 
    BookOpen, 
    ClipboardCheck, 
    CreditCard, 
    Library, 
    Bell, 
    LogOut,
    Menu,
    X,
    UserCircle
} from 'lucide-react';
import Footer from './Footer';

const DashboardLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Define navigation based on roles
    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'student', 'librarian', 'accountant'] },
        { name: 'Academics', href: '/dashboard/academics', icon: BookOpen, roles: ['admin', 'staff'] },
        { name: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, roles: ['admin', 'staff', 'student'] },
        { name: 'Fees', href: '/dashboard/fees', icon: CreditCard, roles: ['admin', 'accountant', 'student'] },
        { name: 'Library', href: '/dashboard/library', icon: Library, roles: ['admin', 'librarian', 'student'] },
        { name: 'Notices', href: '/dashboard/notices', icon: Bell, roles: ['admin', 'staff', 'student'] },
        { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin', 'staff'] },
    ];

    const allowedNav = navigation.filter(item => user && item.roles.includes(user.role));

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 z-30 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
                    <span className="text-xl font-bold tracking-wider text-white">College ERP</span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {allowedNav.map((item) => {
                        const active = location.pathname === item.href || (location.pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors group ${
                                    active 
                                        ? 'bg-blue-600 text-white font-medium' 
                                        : 'hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={logout}
                        className="flex items-center w-full px-4 py-3 text-sm rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Navbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 flex-shrink-0 shadow-sm">
                    <div className="flex items-center">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="mr-4 lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-800 capitalize hidden sm:block">
                            Welcome, {user?.role}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-100 py-1.5 px-3 rounded-full">
                            <UserCircle className="w-5 h-5 mr-2 text-slate-500" />
                            {user?.user_id ? `Active User #${user.user_id}` : 'Profile'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 lg:p-8 flex flex-col">
                    <div className="max-w-7xl mx-auto w-full flex-grow">
                        <Outlet />
                    </div>
                    <div className="max-w-7xl mx-auto w-full">
                        <Footer />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
