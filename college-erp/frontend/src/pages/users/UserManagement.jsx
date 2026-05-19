import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Loader2, Search, UserPlus, MoreVertical, Edit2, Trash2, Mail } from 'lucide-react';

const UserManagement = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'student' });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('auth/management/');
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('auth/management/', formData);
            setUsers([res.data, ...users]);
            setShowForm(false);
            setFormData({ username: '', email: '', password: '', role: 'student' });
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const msg = typeof err.response.data === 'string' ? err.response.data : Object.values(err.response.data).flat().join(' ');
                setError(msg || 'Validation failed. Ensure username is unique.');
            } else {
                setError('Database connection error.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permenantly remove this user from the system?")) return;
        try {
            await api.delete(`auth/management/${id}/`);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            console.error(err);
            alert("Delete failed.");
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mt-10" />;

    const canManageUsers = ['admin', 'staff'].includes(user?.role);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Student & Staff Management</h1>
                    <p className="text-slate-500 mt-1">Manage active college user accounts and roles seamlessly.</p>
                </div>
                {canManageUsers && (
                    <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 hover:bg-blue-700 text-white'} px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-blue-600/30`}>
                        {showForm ? 'Cancel Creation' : <><UserPlus className="w-5 h-5" /> <span>Add Enrollment</span></>}
                    </button>
                )}
            </div>

            {showForm && canManageUsers && (
                <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200 mb-6 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Enroll New System Profile</h2>
                    {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-medium">{error}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username Identifier</label>
                            <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="e.g. john_doe"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valid Email</label>
                            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="john@uni.edu"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Secure Password</label>
                            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="••••••••"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Role Context</label>
                            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                                <option value="student">Student Account</option>
                                {user?.role === 'admin' && (
                                    <>
                                        <option value="staff">Teaching Staff</option>
                                        <option value="admin">System Admin</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="lg:col-span-4 flex justify-end pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-blue-500/20 transition-all">Generate Account Profile</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-transparent">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="text" placeholder="Search actively by name, email, or role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 hover:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm font-medium"/>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">User Profile</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Role Identifier</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Active State</th>
                                {canManageUsers && <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-inner flex items-center justify-center text-white font-bold uppercase tracking-wider text-lg ring-2 ring-white shadow-md">
                                                    {u.username.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{u.username} <span className="text-xs text-slate-400 ml-2 font-mono">#{u.id}</span></div>
                                                <div className="text-xs text-slate-500 flex items-center mt-1 font-medium"><Mail className="w-3 h-3 mr-1.5 inline text-slate-400"/> {u.email || 'No email provided'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold tracking-wide capitalize border shadow-sm ${
                                            u.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                            u.role === 'staff' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                            u.role === 'student' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                            'bg-slate-100 text-slate-800 border-slate-200'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border shadow-sm ${
                                            u.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                                        }`}>
                                            <span className={`w-2 h-2 rounded-full mr-2 ${u.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></span>
                                            {u.is_active ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    {canManageUsers && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={canManageUsers ? 4 : 3} className="px-6 py-16 text-center text-slate-500 font-medium">
                                        No users match your criteria. Verify database entries.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
