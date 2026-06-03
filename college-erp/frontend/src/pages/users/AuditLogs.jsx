import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Loader2, ShieldAlert, Clock, User, MessageSquareCode } from 'lucide-react';

const AuditLogs = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await api.get('audit_logs/trail/');
                setLogs(res.data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || 'Failed to load system audit logs.');
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === 'admin') {
            fetchLogs();
        } else {
            setError('Access Denied. Only administrators are allowed to view audit logs.');
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error && user?.role !== 'admin') {
        return (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-8 rounded-2xl flex items-center space-x-4">
                <ShieldAlert className="w-12 h-12 text-rose-500 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-lg">Unauthorized Access</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Security Audit Logs</h1>
                <p className="text-slate-500 mt-1">Enterprise audit trail tracking logins, database adjustments, and security records.</p>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-900 text-white uppercase font-bold tracking-wider text-[10px] border-b border-slate-800">
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Operator</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Log Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-400">
                                        No audit entries registered on record.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 whitespace-nowrap text-slate-400 flex items-center">
                                            <Clock className="w-3.5 h-3.5 mr-2 text-slate-300" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-slate-900">
                                            <span className="inline-flex items-center bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold">
                                                <User className="w-3 h-3 mr-1 text-slate-400" />
                                                {log.user_detail?.username || 'System/Guest'}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${
                                                log.action.includes('payment') || log.action.includes('fee')
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : log.action.includes('login')
                                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                        : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600 font-mono text-[10px] bg-slate-50/50">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
