/**
 * Task Manager Page — Google Sheets Replica
 * 
 * Master sheet view for admins (all tasks + employee tab filters at bottom).
 * Employee view shows only their own tasks — no juggling.
 * 
 * Column structure matches the original Google Sheets:
 * Task ID | Task | Description | Assigned To | Assigned Date | Assigned By |
 * Priority | Deadline | Status | Employee Update | Last Modified
 * 
 * @module app/(dashboard)/tasks/page
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import {
    Plus, Trash2, X, Loader2, Search, ListFilter,
    ChevronDown, AlertCircle
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const STATUSES = ['New', 'In Progress', 'Done', 'Cancelled'];
const ADMIN_ROLES = ['director', 'developer', 'head_of_sales', 'vp'];

const PRIORITY_CONFIG = {
    Urgent: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
    High: { bg: '#fff7ed', text: '#ea580c', dot: '#f97316' },
    Normal: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
    Low: { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af' },
};

const STATUS_CONFIG = {
    'New': { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
    'In Progress': { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
    'Done': { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
    'Cancelled': { bg: '#f9fafb', text: '#6b7280', border: '#d1d5db' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function taskId(num) {
    return `T-${String(num).padStart(3, '0')}`;
}

// ─── PriorityChip ───────────────────────────────────────────────────────────────

function PriorityChip({ value }) {
    const c = PRIORITY_CONFIG[value] || PRIORITY_CONFIG.Normal;
    return (
        <span style={{ background: c.bg, color: c.text }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap">
            <span style={{ background: c.dot }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
            {value}
        </span>
    );
}

// ─── StatusChip ─────────────────────────────────────────────────────────────────

function StatusChip({ value }) {
    const c = STATUS_CONFIG[value] || STATUS_CONFIG.New;
    return (
        <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap">
            {value}
        </span>
    );
}

// ─── InlineSelect ───────────────────────────────────────────────────────────────

function InlineSelect({ value, onChange, options, disabled, renderValue }) {
    if (disabled) {
        return renderValue ? renderValue(value) : <span className="text-xs text-neutral-600 dark:text-neutral-300 px-1">{value || '—'}</span>;
    }
    return (
        <div className="relative w-full">
            <select
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none bg-transparent text-xs px-1 py-1 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded cursor-pointer"
            >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 pointer-events-none" />
        </div>
    );
}

// ─── EditableCell ────────────────────────────────────────────────────────────────

function EditableCell({ value, onChange, disabled, placeholder, multiline, type }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const ref = useRef(null);

    useEffect(() => { setDraft(value || ''); }, [value]);
    useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

    const commit = () => {
        setEditing(false);
        if (draft !== value) onChange(draft);
    };

    if (disabled) {
        return <span className="block text-xs text-neutral-700 dark:text-neutral-300 px-1 py-1 leading-snug min-h-[22px]">{value || <span className="text-neutral-300 dark:text-neutral-600">{placeholder}</span>}</span>;
    }

    if (type === 'date') {
        return (
            <input
                type="date"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-transparent text-xs px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
            />
        );
    }

    if (editing) {
        if (multiline) {
            return (
                <textarea
                    ref={ref}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commit}
                    rows={2}
                    className="w-full bg-white dark:bg-neutral-800 border border-blue-400 rounded text-xs px-1 py-0.5 focus:outline-none resize-none"
                    placeholder={placeholder}
                />
            );
        }
        return (
            <input
                ref={ref}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); } }}
                className="w-full bg-white dark:bg-neutral-800 border border-blue-400 rounded text-xs px-1 py-0.5 focus:outline-none"
                placeholder={placeholder}
            />
        );
    }

    return (
        <span
            onClick={() => setEditing(true)}
            className="block text-xs text-neutral-700 dark:text-neutral-300 px-1 py-1 cursor-text rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 min-h-[22px] leading-snug"
        >
            {value || <span className="text-neutral-300 dark:text-neutral-600 italic">{placeholder || 'Click to edit...'}</span>}
        </span>
    );
}

// ─── NewTaskRow ──────────────────────────────────────────────────────────────────

function NewTaskRow({ employees, onSave, onCancel }) {
    const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'Normal', deadline: '', status: 'New' });
    const ref = useRef(null);
    useEffect(() => { if (ref.current) ref.current.focus(); }, []);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const valid = form.title && form.assigned_to;

    return (
        <tr style={{ background: '#fffde7' }}>
            {/* Row # */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-400 text-center bg-neutral-50 dark:bg-neutral-900 font-mono">*</td>
            {/* Task ID */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-400 italic">Auto</td>
            {/* Title */}
            <td className="border border-blue-400 px-1 py-0.5">
                <input ref={ref} value={form.title} onChange={e => set('title', e.target.value)}
                    className="w-full bg-transparent text-xs px-1 py-0.5 focus:outline-none"
                    placeholder="Task title *"
                    onKeyDown={e => { if (e.key === 'Enter') valid && onSave(form); if (e.key === 'Escape') onCancel(); }}
                />
            </td>
            {/* Description */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-1 py-0.5">
                <input value={form.description} onChange={e => set('description', e.target.value)}
                    className="w-full bg-transparent text-xs px-1 py-0.5 focus:outline-none" placeholder="Description" />
            </td>
            {/* Assigned To */}
            <td className="border border-blue-400 px-1 py-0.5">
                <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
                    className="w-full bg-transparent text-xs px-1 py-0.5 focus:outline-none">
                    <option value="">Select *</option>
                    {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.full_name || e.email}</option>)}
                </select>
            </td>
            {/* Assigned Date — auto */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-400 italic">Auto</td>
            {/* Assigned By — auto */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-400 italic">Auto</td>
            {/* Priority */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-1 py-0.5">
                <select value={form.priority} onChange={e => set('priority', e.target.value)}
                    className="w-full bg-transparent text-xs px-1 py-0.5 focus:outline-none">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
            </td>
            {/* Deadline */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-1 py-0.5">
                <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                    className="w-full bg-transparent text-xs px-1 py-0.5 focus:outline-none" />
            </td>
            {/* Status */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-1 py-0.5">
                <select value={form.status} onChange={e => set('status', e.target.value)}
                    className="w-full bg-transparent text-xs px-1 py-0.5 focus:outline-none">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
            </td>
            {/* Employee Update */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-400">—</td>
            {/* Last Modified */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-400">—</td>
            {/* Actions */}
            <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-1">
                <div className="flex gap-1">
                    <button onClick={() => valid && onSave(form)}
                        disabled={!valid}
                        className="px-2 py-0.5 bg-green-600 text-white text-[10px] rounded disabled:opacity-40 hover:bg-green-700">
                        Save
                    </button>
                    <button onClick={onCancel}
                        className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] rounded hover:bg-neutral-300">
                        Cancel
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Employee Tabs (Google Sheets style) ────────────────────────────────────────

function SheetTabs({ employees, activeTab, onTabChange, taskCounts }) {
    return (
        <div className="flex items-end border-t border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 overflow-x-auto flex-shrink-0">
            {/* Master / All Tasks tab */}
            <button
                onClick={() => onTabChange('all')}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium border-r border-neutral-300 dark:border-neutral-700 transition-all
                    ${activeTab === 'all'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-t-2 border-t-blue-600 -mt-0.5 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
            >
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v12H1V2zm1 1v10h12V3H2zm1 1h4v2H3V4zm5 0h4v2H8V4zM3 8h4v2H3V8zm5 0h4v2H8V8z" /></svg>
                MASTER TASKS
                {taskCounts?.all > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 rounded-full text-[9px] font-medium">
                        {taskCounts.all}
                    </span>
                )}
            </button>

            {/* Employee tabs */}
            {employees.map(emp => {
                const name = (emp.full_name || emp.email).split(' ')[0];
                const count = taskCounts?.[emp.user_id] || 0;
                const isActive = activeTab === emp.user_id;
                return (
                    <button
                        key={emp.user_id}
                        onClick={() => onTabChange(emp.user_id)}
                        title={emp.full_name || emp.email}
                        className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-r border-neutral-300 dark:border-neutral-700 whitespace-nowrap transition-all
                            ${isActive
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-t-2 border-t-emerald-500 -mt-0.5 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                    >
                        {name}
                        {count > 0 && (
                            <span className="bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1 rounded-full text-[9px]">
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function TasksPage() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [showNewRow, setShowNewRow] = useState(false);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState({});
    const [error, setError] = useState('');

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

    // Filter tasks
    const visibleTasks = tasks.filter(t => {
        if (activeTab !== 'all' && t.assigned_to !== activeTab) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                t.title?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q) ||
                t.assignee?.full_name?.toLowerCase().includes(q) ||
                t.employee_update?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // Task counts for tabs
    const taskCounts = { all: tasks.length };
    tasks.forEach(t => { taskCounts[t.assigned_to] = (taskCounts[t.assigned_to] || 0) + 1; });

    const update = async (taskId, patch) => {
        setSaving(s => ({ ...s, [taskId]: true }));
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (res.ok) {
                setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
            } else setError(data.error);
        } catch { setError('Failed to save'); }
        finally { setSaving(s => ({ ...s, [taskId]: false })); }
    };

    const createTask = async (form) => {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) { setTasks(prev => [data.task, ...prev]); setShowNewRow(false); }
            else setError(data.error);
        } catch { setError('Failed to create task'); }
    };

    const deleteTask = async (id) => {
        if (!confirm('Delete this task? This cannot be undone.')) return;
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch { setError('Failed to delete'); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">Loading tasks...</p>
                </div>
            </div>
        );
    }

    // Column widths matching the Google Sheets layout
    const cols = [
        { w: 40 },  // row number
        { w: 70 },  // task id
        { w: 200 },  // task title
        { w: 180 },  // description
        { w: 150 },  // assigned to
        { w: 110 },  // assigned date
        { w: 130 },  // assigned by
        { w: 90 },  // priority
        { w: 110 },  // deadline
        { w: 110 },  // status
        { w: 220 },  // employee update
        { w: 150 },  // last modified
        ...(isAdmin ? [{ w: 60 }] : []),  // actions
    ];

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col bg-white dark:bg-neutral-950">

            {/* ── Toolbar (mimics Google Sheets toolbar) ── */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex-shrink-0">
                <div className="flex-1">
                    <h1 className="text-sm font-semibold text-neutral-800 dark:text-white leading-none">Task Manager</h1>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                        {isAdmin
                            ? `${visibleTasks.length} of ${tasks.length} tasks`
                            : `${visibleTasks.length} tasks assigned to you`}
                    </p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="pl-8 pr-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 w-44 focus:w-56 transition-all focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    />
                </div>

                {/* Add Task (admin only) */}
                {isAdmin && (
                    <button
                        onClick={() => { setShowNewRow(true); setActiveTab('all'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Task
                    </button>
                )}
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex-shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* ── Spreadsheet ── */}
            <div className="flex-1 overflow-auto">
                <table className="border-collapse text-xs" style={{ minWidth: cols.reduce((s, c) => s + c.w, 0) }}>
                    {/* Column width hints */}
                    <colgroup>
                        {cols.map((c, i) => <col key={i} style={{ width: c.w, minWidth: c.w }} />)}
                    </colgroup>

                    {/* Frozen header row — Google Sheets style */}
                    <thead className="sticky top-0 z-20">
                        <tr style={{ background: '#f0f4ff' }}>
                            {/* Row counter cell */}
                            <th className="border border-neutral-300 dark:border-neutral-600 px-2 py-1.5 text-[10px] font-semibold text-neutral-500 text-center bg-neutral-200 dark:bg-neutral-800" style={{ background: '#e8edf5' }}></th>
                            {[
                                'TASK ID', 'TASK TITLE', 'DESCRIPTION', 'ASSIGNED TO',
                                'ASSIGNED DATE', 'ASSIGNED BY', 'PRIORITY', 'DEADLINE',
                                'STATUS', 'EMPLOYEE UPDATE', 'LAST MODIFIED',
                                ...(isAdmin ? [''] : [])
                            ].map(h => (
                                <th key={h} className="border border-neutral-300 dark:border-neutral-600 px-2 py-1.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 text-left whitespace-nowrap uppercase tracking-wide" style={{ background: '#e8edf5' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {/* New Task input row */}
                        {showNewRow && isAdmin && (
                            <NewTaskRow employees={employees} onSave={createTask} onCancel={() => setShowNewRow(false)} />
                        )}

                        {/* Empty state */}
                        {visibleTasks.length === 0 && (
                            <tr>
                                <td colSpan={cols.length} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                                        <ListFilter className="w-8 h-8 opacity-30" />
                                        <span className="text-sm">{search ? 'No tasks match your search' : isAdmin ? 'No tasks yet — click "New Task" to add one' : 'No tasks assigned to you yet'}</span>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Task rows */}
                        {visibleTasks.map((task, idx) => {
                            const isSaving = saving[task.id];
                            const rowBg = idx % 2 === 0 ? 'white' : '#fafafa';

                            return (
                                <tr
                                    key={task.id}
                                    style={{ background: rowBg, opacity: isSaving ? 0.6 : 1 }}
                                    className="group hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                                >
                                    {/* Row number */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 text-center text-[11px] text-neutral-400 font-mono" style={{ background: '#e8edf5' }}>
                                        {idx + 1}
                                    </td>

                                    {/* Task ID */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-2 py-1 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                                        {taskId(task.task_number || idx + 1)}
                                    </td>

                                    {/* Title */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1 py-0.5">
                                        <EditableCell
                                            value={task.title}
                                            onChange={v => update(task.id, { title: v })}
                                            disabled={!isAdmin}
                                            placeholder="Task title"
                                        />
                                    </td>

                                    {/* Description */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1 py-0.5">
                                        <EditableCell
                                            value={task.description}
                                            onChange={v => update(task.id, { description: v })}
                                            disabled={!isAdmin}
                                            placeholder="Add description"
                                            multiline
                                        />
                                    </td>

                                    {/* Assigned To */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1 py-0.5">
                                        {isAdmin ? (
                                            <select
                                                value={task.assigned_to}
                                                onChange={e => update(task.id, { assigned_to: e.target.value })}
                                                className="w-full bg-transparent text-xs px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                                            >
                                                {employees.map(e => (
                                                    <option key={e.user_id} value={e.user_id}>{e.full_name || e.email}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="block px-1 py-1 text-xs text-neutral-700 dark:text-neutral-300">{task.assignee?.full_name || '—'}</span>
                                        )}
                                    </td>

                                    {/* Assigned Date */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                        {fmtDate(task.created_at)}
                                    </td>

                                    {/* Assigned By */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                        {task.assigner?.full_name || '—'}
                                    </td>

                                    {/* Priority */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1 py-0.5">
                                        <InlineSelect
                                            value={task.priority}
                                            onChange={v => update(task.id, { priority: v })}
                                            options={PRIORITIES}
                                            disabled={!isAdmin}
                                            renderValue={v => <PriorityChip value={v} />}
                                        />
                                    </td>

                                    {/* Deadline */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1 py-0.5">
                                        {isAdmin ? (
                                            <EditableCell
                                                value={task.deadline}
                                                onChange={v => update(task.id, { deadline: v })}
                                                type="date"
                                            />
                                        ) : (
                                            <span className="block px-1 py-1 text-[11px] text-neutral-700 dark:text-neutral-300">
                                                {task.deadline ? fmtDate(task.deadline) : <span className="text-neutral-300">—</span>}
                                            </span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1 py-0.5">
                                        <InlineSelect
                                            value={task.status}
                                            onChange={v => update(task.id, { status: v })}
                                            options={STATUSES}
                                            renderValue={v => <StatusChip value={v} />}
                                        />
                                    </td>

                                    {/* Employee Update — highlighted yellow, always editable */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-1 py-0.5" style={{ background: '#fffde7' }}>
                                        <EditableCell
                                            value={task.employee_update}
                                            onChange={v => update(task.id, { employee_update: v })}
                                            placeholder="Write your update here..."
                                            multiline
                                        />
                                    </td>

                                    {/* Last Modified */}
                                    <td className="border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-[11px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                        {fmtDateTime(task.employee_updated_at || task.updated_at)}
                                    </td>

                                    {/* Actions (admin) */}
                                    {isAdmin && (
                                        <td className="border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                title="Delete task"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Google Sheets-style tab bar ── */}
            {isAdmin && employees.length > 0 && (
                <SheetTabs
                    employees={employees}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    taskCounts={taskCounts}
                />
            )}
        </div>
    );
}
