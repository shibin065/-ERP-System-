import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Loader2, BookOpen, Plus, Trash2 } from 'lucide-react';

const CourseList = () => {
    const { user } = useContext(AuthContext);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', code: '', description: '' });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('academics/courses/');
            setCourses(res.data);
        } catch (err) {
            console.error("Failed to fetch courses", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('academics/courses/', formData);
            setCourses([...courses, res.data]);
            setShowForm(false);
            setFormData({ name: '', code: '', description: '' });
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const msg = typeof err.response.data === 'string' ? err.response.data : Object.values(err.response.data).flat().join(' ');
                setError(msg || 'Error creating course. Check if code already exists.');
            } else {
                setError('Database connection error.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this course? All associated batches may be affected.")) return;
        try {
            await api.delete(`academics/courses/${id}/`);
            setCourses(courses.filter(c => c.id !== id));
        } catch (err) {
            console.error("Failed to delete course", err);
            alert("Error deleting course. You may not have administrative permissions.");
        }
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mt-10" />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Academic Courses</h1>
                    <p className="text-slate-500 mt-1">Browse and manage active college syllabus courses.</p>
                </div>
                {user?.role === 'admin' && (
                    <button 
                        onClick={() => setShowForm(!showForm)} 
                        className={`flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 text-white'} px-4 py-2 rounded-lg font-medium shadow-sm transition-colors`}
                    >
                        {showForm ? 'Cancel Creation' : <><Plus className="w-5 h-5"/> Add Course</>}
                    </button>
                )}
            </div>

            {showForm && user?.role === 'admin' && (
                <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200 mb-8 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Create New Course Database Record</h2>
                    {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-medium">{error}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Course Name</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="e.g. Computer Science"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Course Code</label>
                            <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow uppercase" placeholder="e.g. CS101"/>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none" rows="3" placeholder="In-depth course syllabus description..."></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end pt-2 border-t border-slate-100">
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-blue-500/20 transition-all">Save Course</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
                        {user?.role === 'admin' && (
                            <button onClick={() => handleDelete(course.id)} className="absolute top-3 right-3 p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-slate-100">
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        )}
                        <div className="p-4 bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 rounded-full mb-4 shadow-inner ring-1 ring-blue-100">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{course.name}</h3>
                        <p className="text-blue-700 mt-2 font-mono font-bold bg-blue-50 px-3 py-1 rounded-md text-sm border border-blue-100">{course.code}</p>
                        <p className="text-sm text-slate-500 mt-3">{course.description}</p>
                    </div>
                ))}
                {courses.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-500 bg-white border border-slate-200 border-dashed rounded-xl">
                        No courses available at the moment. Admin users can create them.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseList;
