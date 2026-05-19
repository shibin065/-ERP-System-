import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Loader2, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const DashboardOverview = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('reports/dashboard/');
                setStats(res.data);
            } catch (err) {
                console.error('Failed to load dashboard data', err);
                setError('Failed to fetch dashboard statistics.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500 mt-1">Here is a quick summary of your profile and college statistics.</p>
            </div>
            
            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Students" value={stats?.total_students ?? 0} color="bg-blue-500" />
                    <StatCard title="Total Staff" value={stats?.total_staff ?? 0} color="bg-indigo-500" />
                    <StatCard title="Active Courses" value={stats?.total_courses ?? 0} color="bg-emerald-500" />
                    <StatCard title="Pending Fees" value={`$${stats?.pending_fees ?? 0}`} color="bg-rose-500" />
                </div>
            )}

            {user?.role === 'admin' && (
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 w-full transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">College Activity Trends</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">Student engagement and revenue metrics over the past 6 months.</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                    { name: 'Jan', attendance: 85, revenue: 4000 },
                                    { name: 'Feb', attendance: 88, revenue: 3000 },
                                    { name: 'Mar', attendance: 92, revenue: 5000 },
                                    { name: 'Apr', attendance: 90, revenue: 4500 },
                                    { name: 'May', attendance: 95, revenue: 6000 },
                                    { name: 'Jun', attendance: 96, revenue: 7000 },
                            ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                />
                                <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" activeDot={{ r: 6, strokeWidth: 2, fill: '#fff' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {user?.role === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard title="My Recorded Attendances" value={stats?.my_attendances ?? 0} color="bg-emerald-500" />
                    <StatCard title="My Pending Fees" value={`$${stats?.my_pending_fees ?? 0}`} color="bg-rose-500" />
                </div>
            )}

            {user?.role === 'staff' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Students" value={stats?.total_students ?? 0} color="bg-blue-500" />
                    <StatCard title="Active Courses" value={stats?.total_courses ?? 0} color="bg-emerald-500" />
                </div>
            )}

            {!['admin', 'student', 'staff'].includes(user?.role) && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                    <p className="text-slate-600">Welcome to your dashboard. Select a module from the sidebar to begin.</p>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 duration-200">
        <div className={`h-1.5 w-full ${color}`}></div>
        <div className="p-5">
            <p className="text-sm font-semibold text-slate-500 tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export default DashboardOverview;
