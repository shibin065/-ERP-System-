import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Loader2, Calendar, MapPin, Users, Award, Ticket, CheckCircle2, XCircle } from 'lucide-react';

const Events = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionId, setActionId] = useState(null);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('events/list/');
            setEvents(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load events.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user]);

    const handleRegister = async (eventId, isRegistered) => {
        try {
            setActionId(eventId);
            const endpoint = isRegistered ? 'unregister' : 'register';
            await api.post(`events/list/${eventId}/${endpoint}/`);
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to complete registration action.');
        } finally {
            setActionId(null);
        }
    };

    const getEventBadge = (type) => {
        switch (type) {
            case 'seminar': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'workshop': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'sports': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'festival': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
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
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Campus Events</h1>
                <p className="text-slate-500 mt-1">Register and participate in Seminars, Workshops, Sports, and Festivals.</p>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {events.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                    No events scheduled currently. Check back later!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => {
                        const filledRatio = (event.registered_count / event.capacity) * 100;
                        const isFull = event.registered_count >= event.capacity;

                        return (
                            <div key={event.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    {/* Header / Type */}
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <span className={`border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getEventBadge(event.event_type)}`}>
                                            {event.event_type}
                                        </span>
                                        <span className="text-slate-400 text-xs font-semibold flex items-center">
                                            <Users className="w-3.5 h-3.5 mr-1" />
                                            {event.registered_count}/{event.capacity} Filled
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="p-5 space-y-4">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-base leading-snug">{event.title}</h3>
                                            <p className="text-xs text-slate-400 font-semibold mt-1">Organized by {event.organizer}</p>
                                        </div>

                                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                                            {event.description}
                                        </p>

                                        {/* Dynamic capacity bar */}
                                        <div className="space-y-1">
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                        isFull ? 'bg-rose-500' : filledRatio > 80 ? 'bg-yellow-500' : 'bg-blue-600'
                                                    }`}
                                                    style={{ width: `${Math.min(filledRatio, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                                                <span>{new Date(event.date).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer RSVP Actions */}
                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    {user?.role === 'student' ? (
                                        <button
                                            onClick={() => handleRegister(event.id, event.is_registered)}
                                            disabled={actionId === event.id || (!event.is_registered && isFull)}
                                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                                event.is_registered
                                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                                    : isFull
                                                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                            }`}
                                        >
                                            {actionId === event.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : event.is_registered ? (
                                                <>
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Cancel Registration
                                                </>
                                            ) : isFull ? (
                                                'Sold Out'
                                            ) : (
                                                <>
                                                    <Ticket className="w-3.5 h-3.5" />
                                                    Claim RSVP Spot
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full text-center text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                            Admin View Only
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Events;
