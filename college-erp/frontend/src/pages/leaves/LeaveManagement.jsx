import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Loader2, Plus, Calendar, FileText, Check, X, AlertCircle } from 'lucide-react';

const LeaveManagement = () => {
    const { user } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Apply Leave Form
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [formData, setFormData] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
    const [actionId, setActionId] = useState(null);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('leaves/requests/');
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch leave requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchLeaves();
        }
    }, [user]);

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            setError('');
            await api.post('leaves/requests/', formData);
            setSuccess('Leave request submitted successfully!');
            setShowApplyModal(false);
            setFormData({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
            fetchLeaves();
        } catch (err) {
            console.error(err);
            setError('Failed to submit leave request.');
        }
    };

    const handleAction = async (id, type) => {
        try {
            setActionId(id);
            setError('');
            await api.post(`leaves/requests/${id}/${type}/`);
            setSuccess(`Leave request successfully ${type}d!`);
            fetchLeaves();
        } catch (err) {
            console.error(err);
            setError(`Failed to ${type} leave request.`);
        } finally {
            setActionId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Split my leaves vs student leaves for review (for staff/admin)
    const myLeaves = leaves.filter(l => l.user === user?.user_id);
    const reviewLeaves = leaves.filter(l => l.user !== user?.user_id && l.status === 'pending');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Leave Management</h1>
                    <p className="text-slate-500 mt-1">Submit leaves, track approvals, and review pending requests.</p>
                </div>
                <button
                    onClick={() => setShowApplyModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl flex items-center shadow hover:shadow-md transition-all duration-200"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Apply For Leave
                </button>
            </div>

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-medium">
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* My Leave Applications */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-slate-500" />
                        My Leave History
                    </h2>

                    {myLeaves.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                            No leave requests submitted yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myLeaves.map((leave) => (
                                <div key={leave.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-base capitalize">{leave.leave_type} Leave</h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Period: {leave.start_date} to {leave.end_date}
                                            </p>
                                        </div>
                                        <span className={`border px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusColor(leave.status)}`}>
                                            {leave.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                                        "{leave.reason}"
                                    </p>
                                    {leave.action_by_detail && (
                                        <p className="text-[10px] text-slate-400 font-semibold mt-3">
                                            Reviewed by {leave.action_by_detail.username} on {new Date(leave.action_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Review Desk */}
                {user?.role !== 'student' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-slate-500" />
                            Approvals Desk
                        </h2>

                        {reviewLeaves.length === 0 ? (
                            <p className="text-slate-400 text-xs text-center py-8">No pending leave requests to review.</p>
                        ) : (
                            <div className="space-y-4 divide-y divide-slate-100">
                                {reviewLeaves.map((leave) => (
                                    <div key={leave.id} className="pt-4 first:pt-0 space-y-2">
                                        <div className="flex justify-between items-start text-xs">
                                            <div>
                                                <p className="font-bold text-slate-800">{leave.user_detail?.username}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{leave.leave_type} • {leave.start_date} to {leave.end_date}</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                                            "{leave.reason}"
                                        </p>
                                        <div className="flex gap-2 justify-end pt-1">
                                            <button
                                                onClick={() => handleAction(leave.id, 'reject')}
                                                disabled={actionId === leave.id}
                                                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(leave.id, 'approve')}
                                                disabled={actionId === leave.id}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleApply} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Apply For Leave</h3>
                            <button type="button" onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Leave Type</label>
                                <select
                                    required
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                >
                                    <option value="casual">Casual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="annual">Annual Leave</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason</label>
                                <textarea
                                    required
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Explain your leave requirements clearly..."
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600 h-24 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowApplyModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs">Apply</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default LeaveManagement;
