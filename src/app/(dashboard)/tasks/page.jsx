/**
 * Task Manager — Google Sheets Replica
 * 
 * 6 columns only:
 *   1. Task          — what needs to be done
 *   2. Assigned To   — who does it
 *   3. Created Date  — auto (when task was created)
 *   4. Employee Update — filled by the employee
 *   5. Deadline      — due date
 *   6. Last Modified — auto (employee's last update timestamp)
 * 
 * Admin/Isha: sees master sheet + employee tabs at bottom
 * Employee: sees only their tasks, can fill Employee Update
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Plus, Trash2, X, Loader2, Search, ChevronDown, AlertCircle, ListFilter } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────

function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

// ─── Editable Text Cell ────────────────────────────────────────

function EditableCell({ value, onChange, disabled, placeholder, highlight }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const ref = useRef(null);

    useEffect(() => { setDraft(value || ''); }, [value]);
    useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

    const commit = () => {
        setEditing(false);
        if (draft !== (value || '')) onChange(draft);
    };

    if (disabled) {
        return (
            <div className="px-2 py-1.5 text-[13px] text-neutral-700 dark:text-neutral-300 min-h-[36px] flex items-center">
                {value || <span className="text-neutral-300 dark:text-neutral-600">{placeholder || '—'}</span>}
            </div>
        );
    }

    if (editing) {
        return (
            <textarea
                ref={ref}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
                    if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); }
                }}
                rows={2}
                className="w-full bg-white dark:bg-neutral-900 border-2 border-blue-500 rounded text-[13px] px-2 py-1 focus:outline-none resize-none"
                placeholder={placeholder}
            />
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            className={`px-2 py-1.5 text-[13px] cursor-text min-h-[36px] flex items-center rounded-sm
                ${highlight ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/20' : 'hover:bg-blue-50 dark:hover:bg-blue-900/10'}
                text-neutral-700 dark:text-neutral-300`}
        >
            {value || <span className="text-neutral-400 dark:text-neutral-600 italic text-xs">{placeholder || 'Click to edit...'}</span>}
        </div>
    );
}

// ─── Add Task Row ──────────────────────────────────────────────

function AddTaskRow({ employees, onSave, onCancel }) {
    const [task, setTask] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [deadline, setDeadline] = useState('');
    const ref = useRef(null);
    useEffect(() => { if (ref.current) ref.current.focus(); }, []);

    const valid = task.trim() && assignedTo;

    return (
        <tr className="border-b-2 border-blue-300 dark:border-blue-700" style={{ background: '#eef6ff' }}>
            {/* # */}
            <td className="border-r border-neutral-300 dark:border-neutral-700 px-2 py-2 text-center text-xs text-neutral-400 bg-[#e2e8f0] dark:bg-neutral-800 font-mono">
                +
            </td>
            {/* Task */}
            <td className="border-r border-neutral-300 dark:border-neutral-700 px-1 py-1">
                <input
                    ref={ref}
                    value={task}
                    onChange={e => setTask(e.target.value)}
                    placeholder="Enter task..."
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-blue-500"
                    onKeyDown={e => { if (e.key === 'Enter' && valid) onSave({ title: task, assigned_to: assignedTo, deadline }); if (e.key === 'Escape') onCancel(); }}
                />
            </td>
            {/* Assigned To */}
            <td className="border-r border-neutral-300 dark:border-neutral-700 px-1 py-1">
                <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-blue-500"
                >
                    <option value="">Select employee...</option>
                    {employees.map(e => (
                        <option key={e.user_id} value={e.user_id}>{e.full_name || e.email}</option>
                    ))}
                </select>
            </td>
            {/* Created Date */}
            <td className="border-r border-neutral-300 dark:border-neutral-700 px-2 py-2 text-xs text-neutral-400 italic">Today</td>
            {/* Employee Update */}
            <td className="border-r border-neutral-300 dark:border-neutral-700 px-2 py-2 text-xs text-neutral-400">—</td>
            {/* Deadline */}
            <td className="border-r border-neutral-300 dark:border-neutral-700 px-1 py-1">
                <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-blue-500"
                />
            </td>
            {/* Last Modified */}
            <td className="border-r border-neutral-300 dark:border-neutral-700 px-2 py-2 text-xs text-neutral-400">—</td>
            {/* Actions */}
            <td className="px-2 py-2 text-center">
                <div className="flex items-center gap-1 justify-center">
                    <button
                        onClick={() => valid && onSave({ title: task, assigned_to: assignedTo, deadline })}
                        disabled={!valid}
                        className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-medium rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Add
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Employee Tabs (Google Sheets tab bar) ─────────────────────

function SheetTabs({ employees, activeTab, onTabChange, taskCounts }) {
    return (
        <div className="flex items-end bg-[#e8ecf0] dark:bg-neutral-900 border-t border-neutral-300 dark:border-neutral-700 overflow-x-auto flex-shrink-0 select-none">
            {/* Master Tasks tab */}
            <button
                onClick={() => onTabChange('all')}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-r border-neutral-300 dark:border-neutral-700 transition-all
                    ${activeTab === 'all'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-t-[3px] border-t-blue-600 shadow-sm rounded-t'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800/50'}`}
            >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v12H1V2zm1 1v10h12V3H2zm1 1h4v2H3V4zm5 0h4v2H8V4zM3 8h4v2H3V8zm5 0h4v2H8V8z" /></svg>
                MASTER TASKS
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 rounded-full text-[10px]">
                    {taskCounts?.all || 0}
                </span>
            </button>

            {/* Per-employee tabs */}
            {employees.map(emp => {
                const name = (emp.full_name || emp.email).split(' ')[0];
                const count = taskCounts?.[emp.user_id] || 0;
                const active = activeTab === emp.user_id;
                return (
                    <button
                        key={emp.user_id}
                        onClick={() => onTabChange(emp.user_id)}
                        title={emp.full_name || emp.email}
                        className={`flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-[12px] font-medium border-r border-neutral-300 dark:border-neutral-700 whitespace-nowrap transition-all
                            ${active
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-t-[3px] border-t-green-500 shadow-sm rounded-t'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800/50'}`}
                    >
                        {name}
                        {count > 0 && (
                            <span className="text-[10px] text-neutral-400">({count})</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function TasksPage() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [addingTask, setAddingTask] = useState(false);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState({});
    const [error, setError] = useState('');

    // Fetch tasks
    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch('/api/tasks');
            const data = await res.json();
            if (res.ok) {
                setTasks(data.tasks || []);
                setEmployees(data.employees || []);
                setIsAdmin(data.isAdmin);
            } else {
                setError(data.error);
            }
        } catch {
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // Filtered tasks
    const visible = tasks.filter(t => {
        if (activeTab !== 'all' && t.assigned_to !== activeTab) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                t.title?.toLowerCase().includes(q) ||
                t.assignee?.full_name?.toLowerCase().includes(q) ||
                t.employee_update?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // Counts for tabs
    const counts = { all: tasks.length };
    tasks.forEach(t => { counts[t.assigned_to] = (counts[t.assigned_to] || 0) + 1; });

    // API: Create
    const createTask = async (form) => {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) { setTasks(prev => [data.task, ...prev]); setAddingTask(false); }
            else setError(data.error);
        } catch { setError('Failed to create task'); }
    };

    // API: Update
    const updateTask = async (id, patch) => {
        setSaving(s => ({ ...s, [id]: true }));
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (res.ok) setTasks(prev => prev.map(t => t.id === id ? data.task : t));
            else setError(data.error);
        } catch { setError('Failed to update'); }
        finally { setSaving(s => ({ ...s, [id]: false })); }
    };

    // API: Delete
    const deleteTask = async (id) => {
        if (!confirm('Delete this task permanently?')) return;
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch { setError('Failed to delete'); }
    };

    // Loading
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col bg-white dark:bg-neutral-950">

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-bold text-neutral-800 dark:text-white tracking-tight">
                        {isAdmin ? '📋 Task Manager — Master Sheet' : '📋 My Tasks'}
                    </h1>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                        {isAdmin
                            ? `Showing ${visible.length} of ${tasks.length} total tasks`
                            : `${visible.length} task${visible.length !== 1 ? 's' : ''} assigned to you`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="pl-8 pr-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 w-40 focus:w-52 transition-all focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    {/* Add task */}
                    {isAdmin && (
                        <button
                            onClick={() => { setAddingTask(true); setActiveTab('all'); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Task
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex-shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* ── Spreadsheet ── */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse" style={{ minWidth: 900 }}>
                    <colgroup>
                        <col style={{ width: 40 }} />   {/* # */}
                        <col style={{ width: '25%' }} /> {/* Task */}
                        <col style={{ width: '15%' }} /> {/* Assigned To */}
                        <col style={{ width: 110 }} />   {/* Created Date */}
                        <col style={{ width: '25%' }} /> {/* Employee Update */}
                        <col style={{ width: 110 }} />   {/* Deadline */}
                        <col style={{ width: 140 }} />   {/* Last Modified */}
                        <col style={{ width: 50 }} />    {/* Actions */}
                    </colgroup>

                    {/* Header */}
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th className="border border-neutral-300 dark:border-neutral-600 py-2 text-center bg-[#e2e8f0] dark:bg-neutral-800" />
                            {['TASK', 'ASSIGNED TO', 'CREATED DATE', 'EMPLOYEE UPDATE', 'DEADLINE', 'LAST MODIFIED', ''].map((h, i) => (
                                <th
                                    key={i}
                                    className={`border border-neutral-300 dark:border-neutral-600 px-2 py-2 text-[11px] font-bold tracking-wider text-left whitespace-nowrap
                                        ${i === 3 ? 'bg-[#fef9c3] dark:bg-yellow-900/30 text-amber-800 dark:text-yellow-300' : 'bg-[#e2e8f0] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {/* Add row */}
                        {addingTask && isAdmin && (
                            <AddTaskRow
                                employees={employees}
                                onSave={createTask}
                                onCancel={() => setAddingTask(false)}
                            />
                        )}

                        {/* Empty */}
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                                        <ListFilter className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">{search ? 'No tasks match your search' : isAdmin ? 'No tasks yet. Click "New Task" to add one.' : 'No tasks assigned to you yet.'}</p>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Task rows */}
                        {visible.map((task, idx) => {
                            const even = idx % 2 === 0;
                            const isSaving = saving[task.id];

                            return (
                                <tr
                                    key={task.id}
                                    className="group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                    style={{ opacity: isSaving ? 0.5 : 1, background: even ? '#ffffff' : '#f8fafc' }}
                                >
                                    {/* Row # */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 text-center text-[11px] font-mono text-neutral-400 bg-[#e2e8f0] dark:bg-neutral-800">
                                        {idx + 1}
                                    </td>

                                    {/* Task */}
                                    <td className="border border-neutral-200 dark:border-neutral-700">
                                        <EditableCell
                                            value={task.title}
                                            onChange={v => updateTask(task.id, { title: v })}
                                            disabled={!isAdmin}
                                            placeholder="Task description..."
                                        />
                                    </td>

                                    {/* Assigned To */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1">
                                        {isAdmin ? (
                                            <select
                                                value={task.assigned_to}
                                                onChange={e => updateTask(task.id, { assigned_to: e.target.value })}
                                                className="w-full bg-transparent text-[13px] px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded cursor-pointer"
                                            >
                                                {employees.map(e => (
                                                    <option key={e.user_id} value={e.user_id}>{e.full_name || e.email}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="px-2 py-1.5 text-[13px] text-neutral-700 dark:text-neutral-300">
                                                {task.assignee?.full_name || '—'}
                                            </div>
                                        )}
                                    </td>

                                    {/* Created Date */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 text-[12px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                        {fmtDate(task.created_at)}
                                    </td>

                                    {/* Employee Update — yellow highlight, always editable */}
                                    <td className="border border-neutral-200 dark:border-neutral-700" style={{ background: '#fffde7' }}>
                                        <EditableCell
                                            value={task.employee_update}
                                            onChange={v => updateTask(task.id, { employee_update: v })}
                                            placeholder="Write your update here..."
                                            highlight
                                        />
                                    </td>

                                    {/* Deadline */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1">
                                        {isAdmin ? (
                                            <input
                                                type="date"
                                                value={task.deadline || ''}
                                                onChange={e => updateTask(task.id, { deadline: e.target.value })}
                                                className="w-full bg-transparent text-[12px] px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                                            />
                                        ) : (
                                            <div className="px-2 py-1.5 text-[12px] text-neutral-600 dark:text-neutral-400">
                                                {task.deadline ? fmtDate(task.deadline) : '—'}
                                            </div>
                                        )}
                                    </td>

                                    {/* Last Modified — auto from employee update time */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                        {fmtDateTime(task.employee_updated_at || task.updated_at)}
                                    </td>

                                    {/* Delete (admin only, show on hover) */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 text-center">
                                        {isAdmin && (
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Tab bar (admin only) ── */}
            {isAdmin && employees.length > 0 && (
                <SheetTabs
                    employees={employees}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    taskCounts={counts}
                />
            )}
        </div>
    );
}
