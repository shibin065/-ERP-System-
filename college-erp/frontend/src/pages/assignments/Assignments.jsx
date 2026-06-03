import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Loader2, Plus, Calendar, FileText, CheckCircle2, AlertCircle, Edit3, Send } from 'lucide-react';

const Assignments = () => {
    const { user } = useContext(AuthContext);
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);

    // Selected items
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);

    // Form inputs
    const [newAssignment, setNewAssignment] = useState({ title: '', description: '', batch: '', course: '', due_date: '' });
    const [submitFile, setSubmitFile] = useState('');
    const [gradeInput, setGradeInput] = useState({ grade: '', remarks: '' });

    // Meta options for selects
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Get assignments
            const assignRes = await api.get('assignments/list/');
            setAssignments(assignRes.data);

            // Get submissions
            const subRes = await api.get('assignments/submissions/');
            setSubmissions(subRes.data);

            // If staff/admin, get courses & batches for dropdowns
            if (user?.role !== 'student') {
                const cRes = await api.get('academics/courses/');
                const bRes = await api.get('academics/batches/');
                setCourses(cRes.data);
                setBatches(bRes.data);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch assignments and submission data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Create Assignment
    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        try {
            setError('');
            await api.post('assignments/list/', newAssignment);
            setSuccess('Assignment created successfully!');
            setShowCreateModal(false);
            setNewAssignment({ title: '', description: '', batch: '', course: '', due_date: '' });
            fetchData();
        } catch (err) {
            setError('Failed to create assignment.');
        }
    };

    // Submit Assignment
    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        try {
            setError('');
            await api.post('assignments/submissions/', {
                assignment: selectedAssignment.id,
                submission_file: submitFile || 'mock_document_submission.pdf'
            });
            setSuccess('Assignment submitted successfully!');
            setShowSubmitModal(false);
            setSubmitFile('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit assignment.');
        }
    };

    // View submissions (for Staff)
    const handleViewSubmissions = async (assignment) => {
        try {
            setSelectedAssignment(assignment);
            const res = await api.get(`assignments/submissions/?assignment=${assignment.id}`);
            setAssignmentSubmissions(res.data);
        } catch (err) {
            setError('Failed to load submissions.');
        }
    };

    // Submit Grade
    const handleGradeSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            await api.patch(`assignments/submissions/${selectedSubmission.id}/`, gradeInput);
            setSuccess('Submission graded successfully!');
            setShowGradeModal(false);
            setGradeInput({ grade: '', remarks: '' });
            // Refresh submissions list for selected assignment
            handleViewSubmissions(selectedAssignment);
            fetchData();
        } catch (err) {
            setError('Failed to grade submission.');
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
                    <h1 className="text-3xl font-bold text-slate-900">Assignments Workspace</h1>
                    <p className="text-slate-500 mt-1">Manage coursework submissions, grading, and deadlines.</p>
                </div>
                {user?.role === 'staff' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl flex items-center shadow hover:shadow-md transition-all duration-200"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Assignment
                    </button>
                )}
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
                {/* Assignments List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-slate-500" />
                        Active Assignments
                    </h2>
                    {assignments.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 shadow-sm">
                            No assignments currently active.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {assignments.map((assignment) => {
                                const isSubmitted = submissions.some(s => s.assignment === assignment.id);
                                const submissionObj = submissions.find(s => s.assignment === assignment.id);
                                const isOverdue = new Date(assignment.due_date) < new Date();

                                return (
                                    <div key={assignment.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-base">{assignment.title}</h3>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Course: {assignment.course_detail?.name} | Batch: {assignment.batch_detail?.name}
                                                </p>
                                            </div>
                                            {user?.role === 'student' ? (
                                                isSubmitted ? (
                                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center border border-emerald-100">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                        Submitted
                                                    </span>
                                                ) : isOverdue ? (
                                                    <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center border border-rose-100">
                                                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                                        Overdue
                                                    </span>
                                                ) : (
                                                    <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center border border-yellow-100">
                                                        Pending
                                                    </span>
                                                )
                                            ) : (
                                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                    {assignment.submissions_count} submissions
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-600 mt-3.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {assignment.description}
                                        </p>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
                                            <div className="flex items-center text-slate-500 font-medium">
                                                <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                                                Due Date: {new Date(assignment.due_date).toLocaleString()}
                                            </div>

                                            <div className="flex gap-2">
                                                {user?.role === 'student' ? (
                                                    !isSubmitted && !isOverdue && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAssignment(assignment);
                                                                setShowSubmitModal(true);
                                                            }}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4.5 py-1.5 rounded-lg transition-colors flex items-center"
                                                        >
                                                            <Send className="w-3.5 h-3.5 mr-1.5" />
                                                            Submit Work
                                                        </button>
                                                    )
                                                ) : (
                                                    <button
                                                        onClick={() => handleViewSubmissions(assignment)}
                                                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4.5 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Review Submissions
                                                    </button>
                                                )}
                                                {user?.role === 'student' && isSubmitted && submissionObj?.grade && (
                                                    <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-3 py-1 flex flex-col justify-center">
                                                        <span className="font-bold text-center">Grade: {submissionObj.grade}</span>
                                                        {submissionObj.remarks && <span className="text-[10px] text-blue-600 mt-0.5">{submissionObj.remarks}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Submissions Panel (visible to staff when they click review) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <Edit3 className="w-5 h-5 mr-2 text-slate-500" />
                        Submissions Manager
                    </h2>

                    {!selectedAssignment ? (
                        <p className="text-slate-400 text-sm text-center py-12">
                            Select an assignment to view and grade student submissions.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Reviewing</h3>
                                <p className="font-semibold text-slate-700 text-sm mt-0.5 truncate">{selectedAssignment.title}</p>
                            </div>

                            {assignmentSubmissions.length === 0 ? (
                                <p className="text-slate-400 text-xs text-center py-6">No submissions recorded for this assignment yet.</p>
                            ) : (
                                <div className="space-y-3.5 divide-y divide-slate-100">
                                    {assignmentSubmissions.map((sub) => (
                                        <div key={sub.id} className="pt-3.5 first:pt-0">
                                            <div className="flex justify-between items-start text-xs">
                                                <div>
                                                    <p className="font-bold text-slate-800">{sub.student_detail?.username}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                                                </div>
                                                {sub.grade ? (
                                                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                                        Grade: {sub.grade}
                                                    </span>
                                                ) : (
                                                    <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded font-bold">
                                                        Ungraded
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-slate-500 text-[11px] mt-2 italic font-mono truncate bg-slate-50 p-1.5 rounded border border-slate-100">
                                                Attachment: {sub.submission_file}
                                            </p>

                                            {user?.role === 'staff' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubmission(sub);
                                                        setGradeInput({ grade: sub.grade || '', remarks: sub.remarks || '' });
                                                        setShowGradeModal(true);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-bold mt-2.5 flex items-center"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                                                    {sub.grade ? 'Edit Grade' : 'Assign Grade'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleCreateAssignment} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">New Assignment</h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea
                                    required
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600 h-24 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Course</label>
                                    <select
                                        required
                                        value={newAssignment.course}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, course: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Batch</label>
                                    <select
                                        required
                                        value={newAssignment.batch}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, batch: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                                    >
                                        <option value="">Select Batch</option>
                                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={newAssignment.due_date}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs">Create</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Submit Assignment Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleSubmitAssignment} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Submit Work</h3>
                            <button type="button" onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <p className="text-slate-500 text-xs leading-relaxed">
                            Upload your completed project deliverable for **{selectedAssignment?.title}**.
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Attachment File Name</label>
                            <input
                                type="text"
                                required
                                value={submitFile}
                                onChange={(e) => setSubmitFile(e.target.value)}
                                placeholder="e.g. algorithm_design_final.pdf"
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowSubmitModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs">Submit Assignment</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grade Submission Modal */}
            {showGradeModal && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleGradeSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Grade Assignment</h3>
                            <button type="button" onClick={() => setShowGradeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade (A-F or Marks %)</label>
                            <input
                                type="text"
                                required
                                value={gradeInput.grade}
                                onChange={(e) => setGradeInput({ ...gradeInput, grade: e.target.value })}
                                placeholder="e.g. A+, 95"
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks</label>
                            <textarea
                                value={gradeInput.remarks}
                                onChange={(e) => setGradeInput({ ...gradeInput, remarks: e.target.value })}
                                placeholder="Excellent research and presentation."
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600 h-20 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowGradeModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs">Save Grade</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Assignments;
