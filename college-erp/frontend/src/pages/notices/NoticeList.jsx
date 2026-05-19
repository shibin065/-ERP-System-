import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Loader2, Bell, Plus, Trash2 } from 'lucide-react';

const NoticeList = () => {
    const { user } = useContext(AuthContext);
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ title: '', content: '' });

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await api.get('notices/announcements/');
            setNotices(res.data);
        } catch (err) {
            console.error("Failed to fetch notices", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = { title: formData.title, content: formData.content, author: user.user_id };
            const res = await api.post('notices/announcements/', payload);
            setNotices([res.data, ...notices]);
            setShowForm(false);
            setFormData({ title: '', content: '' });
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const msg = typeof err.response.data === 'string' ? err.response.data : Object.values(err.response.data).flat().join(' ');
                setError(msg || 'Error publishing notice.');
            } else {
                setError('Network connection error.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this notice board post?")) return;
        try {
            await api.delete(`notices/announcements/${id}/`);
            setNotices(notices.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to delete notice", err);
        }
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mt-10" />;

    const canManageNotices = ['admin', 'staff'].includes(user?.role);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Notice Board</h1>
                    <p className="text-slate-500 mt-1">Global campus announcements and batch-specific events.</p>
                </div>
                {canManageNotices && (
                    <button 
                        onClick={() => setShowForm(!showForm)} 
                        className={`flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors`}
                    >
                        {showForm ? 'Cancel Creation' : <><Plus className="w-5 h-5"/> Post Notice</>}
                    </button>
                )}
            </div>

            {showForm && canManageNotices && (
                <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200 mb-6 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Publish Global Notification</h2>
                    {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-medium">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Headline Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. End of Semester Examinations Announced"/>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Comprehensive Content</label>
                            <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow resize-none" rows="5" placeholder="Write full details of the announcement here..."></textarea>
                        </div>
                        <div className="flex justify-end pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-indigo-500/20 transition-all">Publish Post</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-5">
                {notices.map(notice => (
                    <div key={notice.id} className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all flex gap-5 group">
                        {canManageNotices && (
                            <button onClick={() => handleDelete(notice.id)} className="absolute top-4 right-4 p-2 bg-slate-50 border border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shadow-sm">
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        )}
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-50 to-purple-50 text-indigo-600 rounded-full flex items-center justify-center shadow-inner ring-1 ring-indigo-100">
                                <Bell className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex-1 pr-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                                <h3 className="text-xl font-bold text-slate-800 leading-tight">{notice.title}</h3>
                                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 whitespace-nowrap">
                                    {new Date(notice.date_posted).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed text-sm">{notice.content}</p>
                            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm">By {notice.author_name || 'System Admin'}</span>
                                {notice.batch_name && (
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 font-semibold shadow-sm">Target Batch: {notice.batch_name}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {notices.length === 0 && (
                    <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        No announcements available immediately.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoticeList;
