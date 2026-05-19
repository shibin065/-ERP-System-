import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Loader2, DollarSign, Plus, Trash2 } from 'lucide-react';

const FeeList = () => {
    const { user } = useContext(AuthContext);
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ student: '', amount: '', description: '', due_date: '' });

    useEffect(() => {
        const fetchFees = async () => {
            try {
                const url = user?.role === 'student' ? `fees/records/?student=${user.user_id}` : 'fees/records/';
                const res = await api.get(url);
                setFees(res.data);
            } catch (err) {
                console.error("Failed to fetch fees", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchFees();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('fees/records/', formData);
            setFees([res.data, ...fees]);
            setShowForm(false);
            setFormData({ student: '', amount: '', description: '', due_date: '' });
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const msg = typeof err.response.data === 'string' ? err.response.data : Object.values(err.response.data).flat().join(' ');
                setError(msg || "Error creating fee record. Ensure the Student ID is valid.");
            } else {
                setError('Database connection error.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this fee record?")) return;
        try {
            await api.delete(`fees/records/${id}/`);
            setFees(fees.filter(f => f.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mt-10" />;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Fee Records</h1>
                    <p className="text-slate-500 mt-1">Manage tuition, library fines, and housing fees.</p>
                </div>
                {user?.role === 'admin' && (
                    <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-rose-600 text-white hover:bg-rose-700'} px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors`}>
                        {showForm ? 'Cancel Creation' : <><Plus className="w-5 h-5"/> Add Fee Invoice</>}
                    </button>
                )}
            </div>

            {showForm && user?.role === 'admin' && (
                <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200 mb-6 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Issue New Fee Invoice</h2>
                    {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-medium">{error}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Student User ID</label>
                            <input type="number" required value={formData.student} onChange={e => setFormData({...formData, student: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-shadow" placeholder="e.g. 3"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount ($)</label>
                            <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-shadow" placeholder="e.g. 500.00"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
                            <input type="date" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-shadow"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                            <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-shadow" placeholder="e.g. Fall Tuition"/>
                        </div>
                        <div className="lg:col-span-4 flex justify-end pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-rose-500/20 transition-all">Issue Invoice</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {fees.map(fee => (
                    <div key={fee.id} className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-red-100 transition-all duration-300 group">
                        {user?.role === 'admin' && (
                            <button onClick={() => handleDelete(fee.id)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 border border-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shadow-sm"><Trash2 className="w-4 h-4"/></button>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-full shadow-inner ring-1 ${fee.status === 'paid' ? 'bg-green-50 text-green-600 ring-green-100' : fee.status === 'overdue' ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-yellow-50 text-yellow-600 ring-yellow-100'}`}>
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-full tracking-wide shadow-sm border ${fee.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : fee.status === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                {fee.status}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{fee.description}</h3>
                        <p className="text-4xl font-black text-slate-900 mt-2 hover:text-rose-600 transition-colors">${fee.amount}</p>
                        <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-col gap-2 font-medium tracking-wide">
                            <div className="flex justify-between bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100"><span>Student ID</span><span className="text-slate-700 font-bold">#{fee.student}</span></div>
                            <div className="flex justify-between px-1"><span>Due Date</span><span>{fee.due_date}</span></div>
                            {fee.payment_date && <div className="flex justify-between px-1"><span className="text-green-600">Paid On</span><span className="text-green-700 font-bold">{fee.payment_date}</span></div>}
                        </div>
                    </div>
                ))}
                {fees.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">
                        No active fee invoices found in the system.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeeList;
