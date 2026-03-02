/**
 * Task Manager — STRICTLY 6 columns only:
 *   1. Task
 *   2. Assigned To
 *   3. Created Date
 *   4. Employee Update
 *   5. Deadline
 *   6. Last Modified
 * 
 * Tabs (10 CRMs + Other): Dinesh | Pradeep | Shikha | Preeti | Isha | Sandeep | Satender | Bhandari | Tarun | Jayshree | Other
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Plus, Trash2, X, Loader2, Search, AlertCircle, ListFilter } from 'lucide-react';

function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function EditableCell({ value, onChange, disabled, placeholder, highlight }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const ref = useRef(null);
    useEffect(() => { setDraft(value || ''); }, [value]);
    useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
    const commit = () => { setEditing(false); if (draft !== (value || '')) onChange(draft); };

    if (disabled) return <div className="px-3 py-2 text-[13px] text-neutral-700 min-h-[38px] flex items-center">{value || <span className="text-neutral-300">{placeholder || '—'}</span>}</div>;

    if (editing) return (
        <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); } if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); } }}
            rows={2} className="w-full bg-white border-2 border-blue-500 rounded text-[13px] px-3 py-1.5 focus:outline-none resize-none shadow-sm" placeholder={placeholder} />
    );

    return (
        <div onClick={() => setEditing(true)}
            className={`px-3 py-2 text-[13px] cursor-text min-h-[38px] flex items-center rounded-sm transition-colors ${highlight ? 'hover:bg-yellow-100' : 'hover:bg-blue-50'} text-neutral-700`}>
            {value || <span className="text-neutral-400 italic text-xs">{placeholder || 'Click to edit...'}</span>}
        </div>
    );
}

function AddTaskRow({ assignable, onSave, onCancel }) {
    const [task, setTask] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [deadline, setDeadline] = useState('');
    const ref = useRef(null);
    useEffect(() => { if (ref.current) ref.current.focus(); }, []);
    const valid = task.trim() && assignedTo;

    return (
        <tr className="bg-blue-50 border-b-2 border-blue-400">
            <td className="border-r border-neutral-300 px-2 py-2 text-center text-xs text-blue-500 font-mono bg-blue-100">+</td>
            <td className="border-r border-neutral-300 px-1 py-1">
                <input ref={ref} value={task} onChange={e => setTask(e.target.value)} placeholder="Enter task..."
                    className="w-full bg-white border border-neutral-300 rounded px-2.5 py-2 text-[13px] focus:outline-none focus:border-blue-500"
                    onKeyDown={e => { if (e.key === 'Enter' && valid) onSave({ title: task, assigned_to: assignedTo, deadline }); if (e.key === 'Escape') onCancel(); }} />
            </td>
            <td className="border-r border-neutral-300 px-1 py-1">
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded px-2 py-2 text-[13px] focus:outline-none focus:border-blue-500">
                    <option value="">Select person...</option>
                    {assignable.map(e => <option key={e.user_id} value={e.user_id}>{e.name}</option>)}
                </select>
            </td>
            <td className="border-r border-neutral-300 px-3 py-2 text-xs text-neutral-400 italic">Today</td>
            <td className="border-r border-neutral-300 px-3 py-2 text-xs text-neutral-400">—</td>
            <td className="border-r border-neutral-300 px-1 py-1">
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded px-2 py-2 text-[13px] focus:outline-none focus:border-blue-500" />
            </td>
            <td className="border-r border-neutral-300 px-3 py-2 text-xs text-neutral-400">—</td>
            <td className="px-2 py-2">
                <div className="flex items-center gap-1.5">
                    <button onClick={() => valid && onSave({ title: task, assigned_to: assignedTo, deadline })} disabled={!valid}
                        className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded hover:bg-blue-700 disabled:opacity-40 shadow-sm">Add</button>
                    <button onClick={onCancel} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"><X className="w-3.5 h-3.5" /></button>
                </div>
            </td>
        </tr>
    );
}

function SheetTabs({ tabs, activeTab, onTabChange, taskCounts }) {
    return (
        <div className="flex items-stretch bg-[#dadfe5] border-t-2 border-neutral-300 overflow-x-auto flex-shrink-0 select-none" style={{ minHeight: 40 }}>
            <button onClick={() => onTabChange('all')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 text-[11px] font-bold tracking-wide border-r border-neutral-300 whitespace-nowrap transition-all
                    ${activeTab === 'all' ? 'bg-white text-neutral-900 border-t-[3px] border-t-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/60'}`}>
                All Tasks
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[9px] font-semibold">{taskCounts?.all || 0}</span>
            </button>
            {tabs.map(tab => {
                const count = tab.user_id === 'OTHER' ? (taskCounts?.OTHER || 0) : (taskCounts?.[tab.user_id] || 0);
                const active = activeTab === tab.user_id;
                return (
                    <button key={tab.user_id} onClick={() => onTabChange(tab.user_id)}
                        className={`flex-shrink-0 flex items-center gap-1 px-3 text-[11px] font-semibold border-r border-neutral-300 whitespace-nowrap transition-all
                            ${active ? 'bg-white text-neutral-900 border-t-[3px] border-t-green-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/60'}`}>
                        {tab.name}
                        <span className={`text-[9px] font-medium px-1 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'}`}>{count}</span>
                    </button>
                );
            })}
        </div>
    );
}

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
            if (res.ok) { setTasks(prev => [data.task, ...prev]); setAddingTask(false); }
            else setError(data.error);
        } catch { setError('Failed to create task'); }
    };

    const updateTask = async (id, patch) => {
        setSaving(s => ({ ...s, [id]: true }));
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
            const data = await res.json();
            if (res.ok) setTasks(prev => prev.map(t => t.id === id ? data.task : t));
            else setError(data.error);
        } catch { setError('Failed to update'); }
        finally { setSaving(s => ({ ...s, [id]: false })); }
    };

    const deleteTask = async (id) => {
        if (!confirm('Delete this task permanently?')) return;
        try { await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); setTasks(prev => prev.filter(t => t.id !== id)); }
        catch { setError('Failed to delete'); }
    };

    if (loading) return <div className="flex items-center justify-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-neutral-300" /></div>;

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-200 flex-shrink-0 bg-white">
                <div className="flex-1 min-w-0">
                    <h1 className="text-[15px] font-bold text-neutral-800 tracking-tight">📋 {isAdmin ? 'Task Manager' : 'My Tasks'}</h1>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{visible.length} task{visible.length !== 1 ? 's' : ''}{activeTab !== 'all' && isAdmin ? ` • ${tabs.find(t => t.user_id === activeTab)?.name || 'Other'}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                            className="pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-md bg-neutral-50 w-36 focus:w-52 transition-all focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                    {isAdmin && (
                        <button onClick={() => { setAddingTask(true); setActiveTab('all'); }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Add Task
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-600 flex-shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                    <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* Spreadsheet — ONLY 6 COLUMNS */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse" style={{ minWidth: 900 }}>
                    <colgroup>
                        <col style={{ width: 36 }} />
                        <col style={{ minWidth: 280 }} />
                        <col style={{ width: 130 }} />
                        <col style={{ width: 110 }} />
                        <col style={{ minWidth: 240 }} />
                        <col style={{ width: 115 }} />
                        <col style={{ width: 155 }} />
                        {isAdmin && <col style={{ width: 44 }} />}
                    </colgroup>
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th className="border border-neutral-300 py-2 text-center bg-[#dce3ed]" />
                            <th className="border border-neutral-300 px-3 py-2 text-[10px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Task</th>
                            <th className="border border-neutral-300 px-3 py-2 text-[10px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Assigned To</th>
                            <th className="border border-neutral-300 px-3 py-2 text-[10px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Created Date</th>
                            <th className="border border-neutral-300 px-3 py-2 text-[10px] font-bold tracking-widest text-left bg-[#fef3c7] text-amber-700 uppercase">Employee Update</th>
                            <th className="border border-neutral-300 px-3 py-2 text-[10px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Deadline</th>
                            <th className="border border-neutral-300 px-3 py-2 text-[10px] font-bold tracking-widest text-left bg-[#dce3ed] text-neutral-600 uppercase">Last Modified</th>
                            {isAdmin && <th className="border border-neutral-300 bg-[#dce3ed]" />}
                        </tr>
                    </thead>
                    <tbody>
                        {addingTask && isAdmin && <AddTaskRow assignable={assignable} onSave={createTask} onCancel={() => setAddingTask(false)} />}
                        {visible.length === 0 && (
                            <tr><td colSpan={isAdmin ? 8 : 7} className="py-20 text-center">
                                <div className="flex flex-col items-center gap-2 text-neutral-400">
                                    <ListFilter className="w-8 h-8 opacity-30" />
                                    <p className="text-sm">{search ? 'No tasks match your search' : isAdmin ? 'No tasks yet.' : 'No tasks assigned to you.'}</p>
                                </div>
                            </td></tr>
                        )}
                        {visible.map((task, idx) => (
                            <tr key={task.id} className="group transition-colors hover:bg-blue-50/50"
                                style={{ opacity: saving[task.id] ? 0.5 : 1, background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td className="border border-neutral-200 text-center text-[11px] font-mono text-neutral-400 bg-[#e8edf3]">{idx + 1}</td>
                                <td className="border border-neutral-200">
                                    <EditableCell value={task.title} onChange={v => updateTask(task.id, { title: v })} disabled={!isAdmin} placeholder="Task..." />
                                </td>
                                <td className="border border-neutral-200 px-1">
                                    {isAdmin ? (
                                        <select value={task.assigned_to} onChange={e => updateTask(task.id, { assigned_to: e.target.value })}
                                            className="w-full bg-transparent text-[13px] px-2 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded cursor-pointer">
                                            {assignable.map(e => <option key={e.user_id} value={e.user_id}>{e.name}</option>)}
                                        </select>
                                    ) : (
                                        <div className="px-3 py-2 text-[13px] text-neutral-700">{task.assignee?.full_name || '—'}</div>
                                    )}
                                </td>
                                <td className="border border-neutral-200 px-3 py-2 text-[12px] text-neutral-500 whitespace-nowrap">{fmtDate(task.created_at)}</td>
                                <td className="border border-neutral-200" style={{ background: '#fffde7' }}>
                                    <EditableCell value={task.employee_update} onChange={v => updateTask(task.id, { employee_update: v })} placeholder="Add update..." highlight />
                                </td>
                                <td className="border border-neutral-200 px-1">
                                    {isAdmin ? (
                                        <input type="date" value={task.deadline || ''} onChange={e => updateTask(task.id, { deadline: e.target.value })}
                                            className="w-full bg-transparent text-[12px] px-2 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded" />
                                    ) : (
                                        <div className="px-3 py-2 text-[12px] text-neutral-600">{task.deadline ? fmtDate(task.deadline) : '—'}</div>
                                    )}
                                </td>
                                <td className="border border-neutral-200 px-3 py-2 text-[11px] text-neutral-500 whitespace-nowrap">{fmtDateTime(task.employee_updated_at || task.updated_at)}</td>
                                {isAdmin && (
                                    <td className="border border-neutral-200 text-center">
                                        <button onClick={() => deleteTask(task.id)} className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tab bar — master users only */}
            {isAdmin && tabs.length > 0 && <SheetTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} taskCounts={counts} />}
        </div>
    );
}
