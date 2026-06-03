import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Calendar, MapPin, Clock, User, Loader2, Sparkles, RefreshCw } from 'lucide-react';

const Timetable = () => {
    const { user } = useContext(AuthContext);
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generating, setGenerating] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const days = {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
        7: 'Sunday'
    };

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            setError('');
            let url = 'timetable/schedules/';
            if (user?.role === 'student') {
                url += `?student=${user.user_id}`;
            } else if (user?.role === 'staff') {
                url += `?faculty=${user.user_id}`;
            }
            const res = await api.get(url);
            setTimetable(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch timetable entries.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTimetable();
        }
    }, [user]);

    const handleAutoGenerate = async () => {
        try {
            setGenerating(true);
            setSuccessMsg('');
            const res = await api.post('timetable/schedules/generate/');
            setSuccessMsg(res.data.message);
            fetchTimetable();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to auto-generate timetable.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Academic Timetable</h1>
                    <p className="text-slate-500 mt-1">
                        {user?.role === 'student' ? 'Weekly class schedules, timings, and classrooms.' : 'Manage course schedules, class hours, and faculty allocations.'}
                    </p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={handleAutoGenerate}
                        disabled={generating}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium px-4 py-2 rounded-xl flex items-center shadow hover:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                        {generating ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2 text-yellow-300 fill-yellow-300" />
                        )}
                        Auto-Generate Schedule
                    </button>
                )}
            </div>

            {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-medium">
                    {successMsg}
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {timetable.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-700 text-lg">No Schedule Found</h3>
                    <p className="text-slate-400 mt-1">There are no classes scheduled for your batches currently.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Group by Day of Week */}
                    {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                        const daySchedules = timetable.filter(
                            (t) => t.time_slot_detail?.day_of_week === dayNum
                        );

                        if (daySchedules.length === 0) return null;

                        return (
                            <div key={dayNum} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-slate-900 text-white px-5 py-3.5 font-bold tracking-wide text-sm flex items-center justify-between">
                                    <span>{days[dayNum]}</span>
                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">
                                        {daySchedules.length} {daySchedules.length === 1 ? 'Class' : 'Classes'}
                                    </span>
                                </div>
                                <div className="p-4 divide-y divide-slate-100">
                                    {daySchedules.map((entry) => (
                                        <div key={entry.id} className="py-4 first:pt-0 last:pb-0 space-y-3.5">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm leading-snug">
                                                    {entry.course_detail?.name || 'Course'}
                                                </h4>
                                                <p className="text-xs text-blue-600 font-bold mt-1">
                                                    {entry.batch_detail?.name || 'All'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                                                <div className="flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                                    <span>
                                                        {entry.time_slot_detail?.start_time?.substring(0, 5)} - {entry.time_slot_detail?.end_time?.substring(0, 5)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                                    <span className="truncate">{entry.room_detail?.name || 'Classroom'}</span>
                                                </div>
                                                <div className="flex items-center col-span-2 mt-1">
                                                    <User className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                                    <span className="truncate">Instructor: {entry.faculty_detail?.username || 'Staff'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Timetable;
