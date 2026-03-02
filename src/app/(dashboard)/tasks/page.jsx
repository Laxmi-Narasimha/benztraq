/**
 * Task Manager — Full-screen Google Sheets style
 * 
 * Features:
 *   - Tabs at TOP (not bottom)
 *   - Task ID auto-generated: DIN-001, SAN-002 etc.
 *   - 7 columns: Task ID | Task | Assigned To | Created Date | Employee Update | Deadline | Last Modified
 *   - Per-task chat (slide-over panel)
 *   - Mobile responsive, full-screen layout
 *   - Push notification prompt on load
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Plus, Trash2, X, Loader2, Search, AlertCircle, ListFilter, MessageSquare, Send, Bell } from 'lucide-react';
import { isPushSupported, getNotificationPermission, requestNotificationPermission, subscribeToPush } from '@/lib/pushNotifications';

// Master user IDs (for notification targeting)
const MASTER_IDS = [
    '08f0a4c7-2dda-4236-a657-383e6a785573',
    '84ac5185-e461-4e77-8ea1-a1573bd2b394',
    'cbba91c1-7bd3-43d3-855c-cd350944608c',
    '092d9927-e3ed-4a69-9b23-a521d9a80af9',
    '480090cb-3fad-45ce-beae-b89576f4c722',
];

// Name prefix for Task IDs
const PREFIXES = {
    'e2cd37b3-f92b-4378-95d3-8c46d469315b': 'DIN',
    'c6f5ea1a-110c-4165-9433-ef6b4c8c71fa': 'PRA',
    'c5c41c1e-c16d-4936-b51b-41ef9f6c9679': 'SHI',
    '1c5b8a5c-2af5-4c96-801b-b5fc562d3ac2': 'PRE',
    '480090cb-3fad-45ce-beae-b89576f4c722': 'ISH',
    '78387321-8aad-4ec4-9eae-0f7e99eda5dc': 'SAN',
    '2970b695-b623-48c1-b036-ba14919cb443': 'SAT',
    '872fca38-39e1-468e-9901-daa0823cd36a': 'BHA',
    '2ee61597-d5e1-4d1e-aad8-2b157adb599c': 'TAR',
    '51deaf59-c580-418d-a78c-7acfa973a53d': 'JAY',
    '0edd417c-95f9-4ffa-b76f-4a51673015f0': 'UDI',
    '08f0a4c7-2dda-4236-a657-383e6a785573': 'MAN',
    '84ac5185-e461-4e77-8ea1-a1573bd2b394': 'CHA',
    'cbba91c1-7bd3-43d3-855c-cd350944608c': 'PRS',
    '092d9927-e3ed-4a69-9b23-a521d9a80af9': 'LAX',
};

function getTaskId(task) {
    const prefix = PREFIXES[task.assigned_to] || 'OTH';
    const num = String(task.task_number || 0).padStart(3, '0');
    return `${prefix}-${num}`;
}

function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

// ============================================================
// Editable Cell
// ============================================================
function EditableCell({ value, onChange, disabled, placeholder, highlight }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const ref = useRef(null);
    useEffect(() => { setDraft(value || ''); }, [value]);
    useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
    const commit = () => { setEditing(false); if (draft !== (value || '')) onChange(draft); };

    if (disabled) return <div className="px-2 py-1.5 text-[13px] text-neutral-700 min-h-[36px] flex items-center leading-snug">{value || <span className="text-neutral-300">{placeholder || '—'}</span>}</div>;
    if (editing) return (
        <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); } if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); } }}
            rows={2} className="w-full bg-white border-2 border-blue-500 rounded text-[13px] px-2 py-1 focus:outline-none resize-none shadow-sm" placeholder={placeholder} />
    );
    return (
        <div onClick={() => setEditing(true)}
            className={`px-2 py-1.5 text-[13px] cursor-text min-h-[36px] flex items-center rounded-sm transition-colors ${highlight ? 'hover:bg-yellow-100' : 'hover:bg-blue-50'} text-neutral-700 leading-snug`}>
            {value || <span className="text-neutral-400 italic text-xs">{placeholder || 'Click to edit...'}</span>}
        </div>
    );
}

// ============================================================
// Add Task Row
// ============================================================
function AddTaskRow({ assignable, onSave, onCancel }) {
    const [task, setTask] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [deadline, setDeadline] = useState('');
    const ref = useRef(null);
    useEffect(() => { if (ref.current) ref.current.focus(); }, []);
    const valid = task.trim() && assignedTo;

    return (
        <tr className="bg-blue-50 border-b-2 border-blue-400">
            <td className="border-r border-neutral-300 px-1 py-1 text-center text-xs text-blue-500 font-mono bg-blue-100">+</td>
            <td className="border-r border-neutral-300 px-1 py-1">
                <input ref={ref} value={task} onChange={e => setTask(e.target.value)} placeholder="Enter task..."
                    className="w-full bg-white border border-neutral-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-blue-500"
                    onKeyDown={e => { if (e.key === 'Enter' && valid) onSave({ title: task, assigned_to: assignedTo, deadline }); if (e.key === 'Escape') onCancel(); }} />
            </td>
            <td className="border-r border-neutral-300 px-1 py-1">
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded px-1.5 py-1.5 text-[13px] focus:outline-none focus:border-blue-500">
                    <option value="">Select...</option>
                    {assignable.map(e => <option key={e.user_id} value={e.user_id}>{e.name}</option>)}
                </select>
            </td>
            <td className="border-r border-neutral-300 px-2 py-1.5 text-xs text-neutral-400 italic">Today</td>
            <td className="border-r border-neutral-300 px-2 py-1.5 text-xs text-neutral-400">—</td>
            <td className="border-r border-neutral-300 px-1 py-1">
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded px-1.5 py-1.5 text-[13px] focus:outline-none focus:border-blue-500" />
            </td>
            <td className="border-r border-neutral-300 px-2 py-1.5 text-xs text-neutral-400">—</td>
            <td className="px-1 py-1" colSpan={2}>
                <div className="flex items-center gap-1">
                    <button onClick={() => valid && onSave({ title: task, assigned_to: assignedTo, deadline })} disabled={!valid}
                        className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded hover:bg-blue-700 disabled:opacity-40 shadow-sm">Add</button>
                    <button onClick={onCancel} className="p-1 text-neutral-400 hover:text-neutral-600 rounded"><X className="w-3.5 h-3.5" /></button>
                </div>
            </td>
        </tr>
    );
}

// ============================================================
// Sheet Tabs — TOP position
// ============================================================
function SheetTabs({ tabs, activeTab, onTabChange, taskCounts }) {
    const scrollRef = useRef(null);
    return (
        <div ref={scrollRef} className="flex items-stretch bg-[#e8ecf1] border-b border-neutral-300 overflow-x-auto flex-shrink-0 select-none scrollbar-hide" style={{ minHeight: 36, WebkitOverflowScrolling: 'touch' }}>
            <button onClick={() => onTabChange('all')}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 text-[11px] font-bold tracking-wide border-r border-neutral-300 whitespace-nowrap transition-all
                    ${activeTab === 'all' ? 'bg-white text-neutral-900 border-b-2 border-b-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/60'}`}>
                All
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[9px] font-semibold">{taskCounts?.all || 0}</span>
            </button>
            {tabs.map(tab => {
                const count = tab.user_id === 'OTHER' ? (taskCounts?.OTHER || 0) : (taskCounts?.[tab.user_id] || 0);
                const active = activeTab === tab.user_id;
                return (
                    <button key={tab.user_id} onClick={() => onTabChange(tab.user_id)}
                        className={`flex-shrink-0 flex items-center gap-1 px-3 text-[11px] font-semibold border-r border-neutral-300 whitespace-nowrap transition-all
                            ${active ? 'bg-white text-neutral-900 border-b-2 border-b-green-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/60'}`}>
                        {tab.name}
                        <span className={`text-[9px] font-medium px-1 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'}`}>{count}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ============================================================
// Chat Panel — slide-over from right
// ============================================================
function ChatPanel({ task, profile, isAdmin, onClose }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/tasks/${task.id}/comments`);
                const data = await res.json();
                if (res.ok) setComments(data.comments || []);
            } catch { }
            finally { setLoading(false); }
        })();
    }, [task.id]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [comments.length]);

    useEffect(() => {
        if (!loading && inputRef.current) inputRef.current.focus();
    }, [loading]);

    const sendMessage = async () => {
        if (!msg.trim() || sending) return;
        const body = msg.trim();
        setMsg('');
        setSending(true);

        // Optimistic
        const temp = { id: Date.now(), body, author_id: profile?.user_id, author: { full_name: profile?.full_name || 'You' }, created_at: new Date().toISOString() };
        setComments(prev => [...prev, temp]);

        try {
            const res = await fetch(`/api/tasks/${task.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body }),
            });
            const data = await res.json();
            if (res.ok) {
                setComments(prev => prev.map(c => c.id === temp.id ? data.comment : c));
            }
        } catch { }
        finally { setSending(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
                    <MessageSquare className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{task.title}</p>
                        <p className="text-[10px] text-blue-200">{task.assignee?.full_name || 'Unassigned'} • {getTaskId(task)}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X className="w-5 h-5" /></button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white" style={{ minHeight: 0 }}>
                    {loading ? (
                        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-neutral-300" /></div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12 text-neutral-400">
                            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs mt-1">Start the conversation</p>
                        </div>
                    ) : (
                        comments.map(c => {
                            const isOwn = c.author_id === profile?.user_id;
                            const isEmployee = c.author_id === task.assigned_to;
                            return (
                                <div key={c.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] ${isOwn ? 'order-last' : ''}`} >
                                        {!isOwn && (
                                            <p className={`text-[10px] font-medium mb-0.5 px-1 ${isEmployee ? 'text-green-600' : 'text-blue-600'}`}>
                                                {c.author?.full_name || 'Unknown'}
                                            </p>
                                        )}
                                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
                                            ${isOwn ? 'bg-blue-600 text-white rounded-tr-md' : 'bg-neutral-100 text-neutral-800 rounded-tl-md'}`}>
                                            <p className="whitespace-pre-wrap break-words">{c.body}</p>
                                        </div>
                                        <p className={`text-[10px] text-neutral-400 mt-0.5 px-1 ${isOwn ? 'text-right' : ''}`}>
                                            {fmtDateTime(c.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input */}
                <div className="flex items-end gap-2 p-3 border-t bg-white flex-shrink-0">
                    <textarea ref={inputRef} value={msg} onChange={e => setMsg(e.target.value)}
                        placeholder="Type a message..." rows={1}
                        className="flex-1 bg-neutral-100 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 max-h-20"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                    <button onClick={sendMessage} disabled={!msg.trim() || sending}
                        className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-40 shadow-sm flex-shrink-0">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Main Page
// ============================================================
export default function TasksPage() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [tabIds, setTabIds] = useState([]);
    const [assignable, setAssignable] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [addingTask, setAddingTask] = useState(false);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState({});
    const [error, setError] = useState('');
    const [chatTask, setChatTask] = useState(null);
    const [pushPromptDismissed, setPushPromptDismissed] = useState(false);

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch('/api/tasks');
            const data = await res.json();
            if (res.ok) {
                setTasks(data.tasks || []);
                setTabs(data.tabs || []);
                setTabIds(data.tabIds || []);
                setAssignable(data.assignable || []);
                setIsAdmin(data.isAdmin);
            } else setError(data.error);
        } catch { setError('Failed to load tasks'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // Push notification prompt
    useEffect(() => {
        if (profile && isPushSupported() && getNotificationPermission() === 'default') {
            // Will show prompt banner
        } else {
            setPushPromptDismissed(true);
        }
    }, [profile]);

    const handleEnablePush = async () => {
        const permission = await requestNotificationPermission();
        if (permission === 'granted' && profile) {
            await subscribeToPush(profile.user_id);
        }
        setPushPromptDismissed(true);
    };

    const visible = tasks.filter(t => {
        if (activeTab === 'all') { /* all */ }
        else if (activeTab === 'OTHER') { if (tabIds.includes(t.assigned_to)) return false; }
        else { if (t.assigned_to !== activeTab) return false; }
        if (search) {
            const q = search.toLowerCase();
            return t.title?.toLowerCase().includes(q) || t.assignee?.full_name?.toLowerCase().includes(q) || t.employee_update?.toLowerCase().includes(q);
        }
        return true;
    });

    const counts = { all: tasks.length, OTHER: 0 };
    tasks.forEach(t => {
        if (tabIds.includes(t.assigned_to)) counts[t.assigned_to] = (counts[t.assigned_to] || 0) + 1;
        else counts.OTHER++;
    });

    const createTask = async (form) => {
        try {
            const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const data = await res.json();
            if (res.ok) {
                setTasks(prev => [data.task, ...prev]);
                setAddingTask(false);
            } else setError(data.error);
        } catch { setError('Failed to create task'); }
    };

    const updateTask = async (id, patch) => {
        setSaving(s => ({ ...s, [id]: true }));
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
            const data = await res.json();
            if (res.ok) {
                setTasks(prev => prev.map(t => t.id === id ? data.task : t));
            } else setError(data.error);
        } catch { setError('Failed to update'); }
        finally { setSaving(s => ({ ...s, [id]: false })); }
    };

    const deleteTask = async (id) => {
        if (!confirm('Delete this task permanently?')) return;
        try { await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); setTasks(prev => prev.filter(t => t.id !== id)); }
        catch { setError('Failed to delete'); }
    };

    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-neutral-300" /></div>;

    return (
        <>
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slide-in-right 0.25s ease-out; }
            `}</style>

            <div className="h-[calc(100vh-56px)] flex flex-col bg-white">
                {/* Push notification prompt */}
                {!pushPromptDismissed && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs flex-shrink-0">
                        <Bell className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">Enable notifications to get alerts for new tasks, updates, and deadlines</span>
                        <button onClick={handleEnablePush} className="px-3 py-1 bg-white text-blue-700 font-semibold rounded-full text-[11px] hover:bg-blue-50 shadow-sm">Enable</button>
                        <button onClick={() => setPushPromptDismissed(true)} className="p-0.5 hover:bg-white/20 rounded"><X className="w-3.5 h-3.5" /></button>
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 flex-shrink-0 bg-white">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-[14px] font-bold text-neutral-800 tracking-tight">📋 {isAdmin ? 'Task Manager' : 'My Tasks'}</h1>
                        <p className="text-[10px] text-neutral-400">{visible.length} task{visible.length !== 1 ? 's' : ''}{activeTab !== 'all' && isAdmin ? ` • ${tabs.find(t => t.user_id === activeTab)?.name || 'Other'}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                                className="pl-7 pr-2 py-1 text-xs border border-neutral-300 rounded bg-neutral-50 w-28 sm:w-36 focus:w-44 transition-all focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>
                        {isAdmin && (
                            <button onClick={() => { setAddingTask(true); setActiveTab('all'); }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded shadow-sm transition-colors">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 border-b border-red-200 text-xs text-red-600 flex-shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" /> {error}
                        <button onClick={() => setError('')} className="ml-auto"><X className="w-3 h-3" /></button>
                    </div>
                )}

                {/* Tabs — TOP position */}
                {isAdmin && tabs.length > 0 && <SheetTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} taskCounts={counts} />}

                {/* Spreadsheet */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full border-collapse" style={{ minWidth: 800 }}>
                        <colgroup>
                            <col style={{ width: 72 }} />
                            <col style={{ minWidth: 220 }} />
                            <col style={{ width: 110 }} />
                            <col style={{ width: 90 }} />
                            <col style={{ minWidth: 200 }} />
                            <col style={{ width: 100 }} />
                            <col style={{ width: 120 }} />
                            <col style={{ width: 34 }} />
                            {isAdmin && <col style={{ width: 34 }} />}
                        </colgroup>
                        <thead className="sticky top-0 z-20">
                            <tr>
                                <th className="border border-neutral-300 px-1 py-1.5 text-[9px] font-bold tracking-widest text-center bg-[#dce3ed] text-neutral-600 uppercase">ID</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Task</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Assigned To</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Created</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#fef3c7] text-amber-700 uppercase">Employee Update</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Deadline</th>
                                <th className="border border-neutral-300 px-2 py-1.5 text-[9px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Last Modified</th>
                                <th className="border border-neutral-300 bg-[#dce3ed] px-1 py-1.5 text-[9px] font-bold text-center text-neutral-500">💬</th>
                                {isAdmin && <th className="border border-neutral-300 bg-[#dce3ed]" />}
                            </tr>
                        </thead>
                        <tbody>
                            {addingTask && isAdmin && <AddTaskRow assignable={assignable} onSave={createTask} onCancel={() => setAddingTask(false)} />}
                            {visible.length === 0 && (
                                <tr><td colSpan={isAdmin ? 9 : 8} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                                        <ListFilter className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">{search ? 'No tasks match your search' : isAdmin ? 'No tasks yet.' : 'No tasks assigned to you.'}</p>
                                    </div>
                                </td></tr>
                            )}
                            {visible.map((task, idx) => (
                                <tr key={task.id} className="group transition-colors hover:bg-blue-50/50"
                                    style={{ opacity: saving[task.id] ? 0.5 : 1, background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td className="border border-neutral-200 text-center text-[10px] font-mono text-blue-600 bg-[#e8edf3] font-semibold px-1">{getTaskId(task)}</td>
                                    <td className="border border-neutral-200">
                                        <EditableCell value={task.title} onChange={v => updateTask(task.id, { title: v })} disabled={!isAdmin} placeholder="Task..." />
                                    </td>
                                    <td className="border border-neutral-200 px-1">
                                        {isAdmin ? (
                                            <select value={task.assigned_to} onChange={e => updateTask(task.id, { assigned_to: e.target.value })}
                                                className="w-full bg-transparent text-[12px] px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded cursor-pointer">
                                                {assignable.map(e => <option key={e.user_id} value={e.user_id}>{e.name}</option>)}
                                            </select>
                                        ) : (
                                            <div className="px-2 py-1.5 text-[12px] text-neutral-700">{task.assignee?.full_name || '—'}</div>
                                        )}
                                    </td>
                                    <td className="border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-500 whitespace-nowrap">{fmtDate(task.created_at)}</td>
                                    <td className="border border-neutral-200" style={{ background: '#fffde7' }}>
                                        <EditableCell value={task.employee_update} onChange={v => updateTask(task.id, { employee_update: v })} placeholder="Add update..." highlight />
                                    </td>
                                    <td className="border border-neutral-200 px-1">
                                        {isAdmin ? (
                                            <input type="date" value={task.deadline || ''} onChange={e => updateTask(task.id, { deadline: e.target.value })}
                                                className="w-full bg-transparent text-[11px] px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded" />
                                        ) : (
                                            <div className="px-2 py-1.5 text-[11px] text-neutral-600">{task.deadline ? fmtDate(task.deadline) : '—'}</div>
                                        )}
                                    </td>
                                    <td className="border border-neutral-200 px-2 py-1.5 text-[10px] text-neutral-500 whitespace-nowrap">{fmtDateTime(task.employee_updated_at || task.updated_at)}</td>
                                    <td className="border border-neutral-200 text-center">
                                        <button onClick={() => setChatTask(task)} className="p-1 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Chat">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                    {isAdmin && (
                                        <td className="border border-neutral-200 text-center">
                                            <button onClick={() => deleteTask(task.id)} className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all" title="Delete">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chat slide-over */}
            {chatTask && <ChatPanel task={chatTask} profile={profile} isAdmin={isAdmin} onClose={() => setChatTask(null)} />}
        </>
    );
}
