import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Loader2, CheckCircle, XCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';

const AttendanceLog = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ student: '', batch: '', date: new Date().toISOString().split('T')[0], status: 'present' });

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const url = user?.role === 'student' ? `attendance/logs/?student=${user.user_id}` : 'attendance/logs/';
                const res = await api.get(url);
                setLogs(res.data);
            } catch (err) {
                console.error("Failed to fetch attendance", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchLogs();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('attendance/logs/', formData);
            setLogs([res.data, ...logs]);
            setShowForm(false);
            setFormData({ student: '', batch: '', date: new Date().toISOString().split('T')[0], status: 'present' });
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const msg = typeof err.response.data === 'string' ? err.response.data : Object.values(err.response.data).flat().join(' ');
                setError(msg || "Error logging attendance. Make sure Student ID and Batch exist.");
            } else {
                setError('Database connection error.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to reverse this attendance log?")) return;
        try {
            await api.delete(`attendance/logs/${id}/`);
            setLogs(logs.filter(l => l.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mt-10" />;

    const canManageAttendance = ['admin', 'staff'].includes(user?.role);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Attendance Records</h1>
                    <p className="text-slate-500 mt-1">Track daily student logs systematically.</p>
                </div>
                {canManageAttendance && (
                    <button 
                        onClick={() => setShowForm(!showForm)} 
                        className={`flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-teal-600 hover:bg-teal-700 text-white'} px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors`}
                    >
                        {showForm ? 'Cancel Creation' : <><Plus className="w-5 h-5"/> Log Attendance</>}
                    </button>
                )}
            </div>

            {showForm && canManageAttendance && (
                <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200 mb-6 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">New Attendance Entry</h2>
                    {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-medium">{error}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Student User ID</label>
                            <input type="number" required value={formData.student} onChange={e => setFormData({...formData, student: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-shadow" placeholder="e.g. 2"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch ID</label>
                            <input type="number" required value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-shadow" placeholder="e.g. 1"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Log Date</label>
                            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-shadow"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-shadow">
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                            </select>
                        </div>
                        <div className="lg:col-span-4 flex justify-end pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-teal-500/20 transition-all">Submit Log</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 overflow-x-auto">
                    <thead className="bg-slate-50/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Date</th>
                            {user?.role !== 'student' && <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Student ID</th>}
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                            {canManageAttendance && <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Record Option</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">{log.date}</td>
                                {user?.role !== 'student' && <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 bg-slate-50/50">#{log.student}</td>}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm border ${
                                        log.status === 'present' ? 'bg-green-100 text-green-800 border-green-200' : 
                                        log.status === 'absent' ? 'bg-red-100 text-red-800 border-red-200' : 
                                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    }`}>
                                        {log.status === 'present' ? <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-600"/> : 
                                         log.status === 'absent' ? <XCircle className="w-3.5 h-3.5 mr-2 text-red-600"/> : 
                                         <AlertCircle className="w-3.5 h-3.5 mr-2 text-yellow-600"/>}
                                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                    </span>
                                </td>
                                {canManageAttendance && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button onClick={() => handleDelete(log.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={canManageAttendance ? 4 : 3} className="px-6 py-16 text-center text-slate-500 bg-slate-50/50">
                                    No attendance records found yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceLog;
