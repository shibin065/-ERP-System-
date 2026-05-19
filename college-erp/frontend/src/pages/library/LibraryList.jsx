import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Loader2, Book, Plus, Trash2 } from 'lucide-react';

const LibraryList = () => {
    const { user } = useContext(AuthContext);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ title: '', author: '', isbn: '', available_copies: '' });

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const res = await api.get('library/books/');
            setBooks(res.data);
        } catch (err) {
            console.error("Failed to fetch books", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('library/books/', formData);
            setBooks([res.data, ...books]);
            setShowForm(false);
            setFormData({ title: '', author: '', isbn: '', available_copies: '' });
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const msg = typeof err.response.data === 'string' ? err.response.data : Object.values(err.response.data).flat().join(' ');
                setError(msg || "Error adding book to catalog. Verify ISBN is unique.");
            } else {
                setError('Database connection error.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this book from the catalog?")) return;
        try {
            await api.delete(`library/books/${id}/`);
            setBooks(books.filter(b => b.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mt-10" />;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Library Catalog</h1>
                    <p className="text-slate-500 mt-1">Search and manage the entire college literature collection.</p>
                </div>
                {user?.role === 'admin' && (
                    <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors`}>
                        {showForm ? 'Cancel Creation' : <><Plus className="w-5 h-5"/> Add Book</>}
                    </button>
                )}
            </div>

            {showForm && user?.role === 'admin' && (
                <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200 mb-6 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Register New Book</h2>
                    {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-medium">{error}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Book Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" placeholder="e.g. Calculus Vol 1"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Author</label>
                            <input type="text" required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" placeholder="e.g. James Stewart"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ISBN Number</label>
                            <input type="text" required value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" placeholder="e.g. 9780538497817"/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Available Copies</label>
                            <input type="number" required value={formData.available_copies} onChange={e => setFormData({...formData, available_copies: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" placeholder="e.g. 5"/>
                        </div>
                        <div className="lg:col-span-4 flex justify-end pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-emerald-500/20 transition-all">List Book</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/80">
                        <tr>
                            <th className="px-8 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Book Name & Detail</th>
                            <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</th>
                            <th className="px-6 py-5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ISBN</th>
                            <th className="px-6 py-5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Availability</th>
                            {user?.role === 'admin' && <th className="px-6 py-5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {books.map((book) => (
                            <tr key={book.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-tr from-emerald-50 to-teal-50 text-emerald-600 rounded-lg flex items-center justify-center shadow-inner ring-1 ring-emerald-100 transition-transform group-hover:scale-105">
                                            <Book className="h-6 w-6" />
                                        </div>
                                        <div className="ml-5">
                                            <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{book.title}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 font-medium">{book.author}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-sm font-mono text-slate-500 bg-slate-50/50 px-2 rounded-md border border-slate-100">{book.isbn}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm border ${
                                        book.available_copies > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full mr-2 ${book.available_copies > 0 ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}></span>
                                        {book.available_copies > 0 ? `${book.available_copies} Copies` : 'Checked Out'}
                                    </span>
                                </td>
                                {user?.role === 'admin' && (
                                    <td className="px-6 py-5 whitespace-nowrap text-right">
                                        <button onClick={() => handleDelete(book.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {books.length === 0 && (
                            <tr>
                                <td colSpan={user?.role === 'admin' ? 5 : 4} className="px-6 py-20 text-center text-slate-500 bg-slate-50/50 border-t border-dashed border-slate-200">
                                    No books available in the catalog.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LibraryList;
