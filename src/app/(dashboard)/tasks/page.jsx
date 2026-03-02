/**
 * Task Manager Page
 * 
 * Google Sheets-like spreadsheet UI for task management.
 * Admins: See all tasks with employee tabs at bottom for filtering.
 * Employees: See only their own tasks, can update status and add notes.
 * 
 * @module app/(dashboard)/tasks/page
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import {
    Plus, Trash2, Save, X, Loader2, Search,
    ChevronDown, Calendar, AlertCircle, CheckCircle2, Clock,
    ListFilter
} from 'lucide-react';

const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const STATUSES = ['New', 'In Progress', 'Done', 'Cancelled'];
const ADMIN_ROLES = ['director', 'developer', 'head_of_sales', 'vp'];

const PRIORITY_COLORS = {
    Urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    Normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

const STATUS_COLORS = {
    'New': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Cancelled': 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500',
};

function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

/** Inline editable cell */
function EditableCell({ value, onChange, type = 'text', options, disabled, className = '', placeholder = '' }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const inputRef = useRef(null);

    useEffect(() => { setDraft(value || ''); }, [value]);
    useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

    if (disabled) {
        return <span className={`block px-2 py-1.5 text-sm ${className}`}>{value || '—'}</span>;
    }

    if (type === 'select') {
        return (
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-transparent text-sm px-1 py-1.5 border-0 focus:ring-1 focus:ring-blue-500 rounded cursor-pointer ${className}`}
            >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        );
    }

    if (type === 'date') {
        return (
            <input
                type="date"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-transparent text-sm px-1 py-1.5 border-0 focus:ring-1 focus:ring-blue-500 rounded ${className}`}
            />
        );
    }

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => { setEditing(false); if (draft !== value) onChange(draft); }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { setEditing(false); if (draft !== value) onChange(draft); }
                    if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); }
                }}
                className={`w-full bg-transparent text-sm px-2 py-1 border border-blue-500 rounded outline-none ${className}`}
                placeholder={placeholder}
            />
        );
    }

    return (
        <span
            onClick={() => setEditing(true)}
            className={`block px-2 py-1.5 text-sm cursor-text rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 min-h-[32px] ${className}`}
        >
            {value || <span className="text-neutral-400">{placeholder || 'Click to edit'}</span>}
        </span>
    );
}

/** Badge component */
function Badge({ children, className }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
            {children}
        </span>
    );
}

/** Employee tabs at the bottom (Google Sheets style) */
function EmployeeTabs({ employees, activeTab, onTabChange, taskCounts }) {
    const scrollRef = useRef(null);

    return (
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div ref={scrollRef} className="flex overflow-x-auto scrollbar-thin">
                <button
                    onClick={() => onTabChange('all')}
                    className={`flex-shrink-0 px-4 py-2 text-xs font-medium border-r border-neutral-200 dark:border-neutral-800 transition-colors
                        ${activeTab === 'all'
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-t-2 border-t-blue-500'
                            : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                >
                    All Tasks
                    {taskCounts?.all > 0 && (
                        <span className="ml-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[10px]">
                            {taskCounts.all}
                        </span>
                    )}
                </button>
                {employees.map(emp => {
                    const count = taskCounts?.[emp.user_id] || 0;
                    const firstName = (emp.full_name || emp.email).split(' ')[0];
                    return (
                        <button
                            key={emp.user_id}
                            onClick={() => onTabChange(emp.user_id)}
                            className={`flex-shrink-0 px-3 py-2 text-xs font-medium border-r border-neutral-200 dark:border-neutral-800 transition-colors whitespace-nowrap
                                ${activeTab === emp.user_id
                                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-t-2 border-t-blue-500'
                                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                            title={emp.full_name || emp.email}
                        >
                            {firstName}
                            {count > 0 && (
                                <span className="ml-1 text-[10px] opacity-60">({count})</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** New task inline form row */
function NewTaskRow({ employees, onSave, onCancel }) {
    const [form, setForm] = useState({
        title: '', description: '', assigned_to: '', priority: 'Normal', deadline: '', status: 'New'
    });
    const titleRef = useRef(null);

    useEffect(() => { if (titleRef.current) titleRef.current.focus(); }, []);

    const handleSave = () => {
        if (!form.title || !form.assigned_to) return;
        onSave(form);
    };

    return (
        <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-900/30">
            <td className="px-2 py-1.5 text-xs text-neutral-400 text-center">New</td>
            <td className="px-1 py-1">
                <input
                    ref={titleRef}
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full text-sm px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded"
                    placeholder="Task title *"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
                />
            </td>
            <td className="px-1 py-1">
                <input
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full text-sm px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded"
                    placeholder="Description"
                />
            </td>
            <td className="px-1 py-1">
                <select
                    value={form.assigned_to}
                    onChange={(e) => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full text-sm px-1 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded"
                >
                    <option value="">Select employee *</option>
                    {employees.map(emp => (
                        <option key={emp.user_id} value={emp.user_id}>{emp.full_name || emp.email}</option>
                    ))}
                </select>
            </td>
            <td className="px-1 py-1">
                <select
                    value={form.priority}
                    onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full text-sm px-1 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded"
                >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </td>
            <td className="px-1 py-1">
                <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full text-sm px-1 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded"
                />
            </td>
            <td className="px-1 py-1">
                <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full text-sm px-1 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded"
                >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </td>
            <td className="px-1 py-1 text-xs text-neutral-400">Auto</td>
            <td className="px-1 py-1"></td>
            <td className="px-1 py-1"></td>
            <td className="px-1 py-1"></td>
            <td className="px-2 py-1 text-center">
                <div className="flex items-center gap-1 justify-center">
                    <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title="Save">
                        <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onCancel} className="p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded" title="Cancel">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function TasksPage() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [showNewRow, setShowNewRow] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState({});

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
        } catch (err) {
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // Filter tasks by active tab and search
    const filteredTasks = tasks.filter(t => {
        if (activeTab !== 'all' && t.assigned_to !== activeTab) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                t.title?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q) ||
                t.assignee?.full_name?.toLowerCase().includes(q) ||
                t.employee_update?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // Task counts per employee for tabs
    const taskCounts = {};
    taskCounts.all = tasks.length;
    tasks.forEach(t => {
        taskCounts[t.assigned_to] = (taskCounts[t.assigned_to] || 0) + 1;
    });

    // Only show employees that have tasks assigned (for tabs)
    const employeesWithTasks = employees.filter(emp => taskCounts[emp.user_id] > 0);

    const handleCreateTask = async (formData) => {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                setTasks(prev => [data.task, ...prev]);
                setShowNewRow(false);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to create task');
        }
    };

    const handleUpdateTask = async (taskId, field, value) => {
        setSaving(s => ({ ...s, [taskId]: true }));
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
            const data = await res.json();
            if (res.ok) {
                setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to update task');
        } finally {
            setSaving(s => ({ ...s, [taskId]: false }));
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Delete this task?')) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
            }
        } catch (err) {
            setError('Failed to delete task');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <div>
                    <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Task Manager</h1>
                    <p className="text-xs text-neutral-500">
                        {isAdmin ? `${filteredTasks.length} tasks` : `${filteredTasks.length} tasks assigned to you`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="pl-8 pr-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-transparent w-48 focus:w-64 transition-all focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Add Task Button (admins only) */}
                    {isAdmin && (
                        <button
                            onClick={() => setShowNewRow(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Task
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-4 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto p-0.5 hover:bg-red-100 rounded">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Spreadsheet Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center w-12">#</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left min-w-[180px]">Task Title</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left min-w-[160px]">Description</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left w-[140px]">Assigned To</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left w-[90px]">Priority</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left w-[110px]">Deadline</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left w-[110px]">Status</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left w-[110px]">Created</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left w-[120px]">Assigned By</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left min-w-[160px]">Employee Update</th>
                            <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-left w-[110px]">Last Modified</th>
                            {isAdmin && (
                                <th className="px-2 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center w-12"></th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {showNewRow && isAdmin && (
                            <NewTaskRow
                                employees={employees}
                                onSave={handleCreateTask}
                                onCancel={() => setShowNewRow(false)}
                            />
                        )}

                        {filteredTasks.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? 12 : 11} className="text-center py-16 text-neutral-400 text-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <ListFilter className="w-8 h-8 opacity-30" />
                                        {searchQuery ? 'No tasks match your search' : 'No tasks yet'}
                                    </div>
                                </td>
                            </tr>
                        )}

                        {filteredTasks.map((task, idx) => (
                            <tr
                                key={task.id}
                                className={`border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors
                                    ${saving[task.id] ? 'opacity-60' : ''}`}
                            >
                                {/* # */}
                                <td className="px-2 py-1.5 text-xs text-neutral-400 text-center font-mono">
                                    {task.task_number || idx + 1}
                                </td>

                                {/* Title */}
                                <td className="px-1 py-0.5">
                                    <EditableCell
                                        value={task.title}
                                        onChange={(v) => handleUpdateTask(task.id, 'title', v)}
                                        disabled={!isAdmin}
                                        className="font-medium text-neutral-900 dark:text-white"
                                    />
                                </td>

                                {/* Description */}
                                <td className="px-1 py-0.5">
                                    <EditableCell
                                        value={task.description}
                                        onChange={(v) => handleUpdateTask(task.id, 'description', v)}
                                        disabled={!isAdmin}
                                        placeholder="Add description"
                                    />
                                </td>

                                {/* Assigned To */}
                                <td className="px-1 py-0.5">
                                    {isAdmin ? (
                                        <select
                                            value={task.assigned_to}
                                            onChange={(e) => handleUpdateTask(task.id, 'assigned_to', e.target.value)}
                                            className="w-full bg-transparent text-sm px-1 py-1.5 border-0 focus:ring-1 focus:ring-blue-500 rounded cursor-pointer"
                                        >
                                            {employees.map(emp => (
                                                <option key={emp.user_id} value={emp.user_id}>
                                                    {emp.full_name || emp.email}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="block px-2 py-1.5 text-sm">
                                            {task.assignee?.full_name || '—'}
                                        </span>
                                    )}
                                </td>

                                {/* Priority */}
                                <td className="px-1 py-0.5">
                                    {isAdmin ? (
                                        <EditableCell
                                            value={task.priority}
                                            onChange={(v) => handleUpdateTask(task.id, 'priority', v)}
                                            type="select"
                                            options={PRIORITIES}
                                        />
                                    ) : (
                                        <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                                    )}
                                </td>

                                {/* Deadline */}
                                <td className="px-1 py-0.5">
                                    {isAdmin ? (
                                        <EditableCell
                                            value={task.deadline}
                                            onChange={(v) => handleUpdateTask(task.id, 'deadline', v)}
                                            type="date"
                                        />
                                    ) : (
                                        <span className="block px-2 py-1.5 text-sm">{formatDate(task.deadline)}</span>
                                    )}
                                </td>

                                {/* Status */}
                                <td className="px-1 py-0.5">
                                    <EditableCell
                                        value={task.status}
                                        onChange={(v) => handleUpdateTask(task.id, 'status', v)}
                                        type="select"
                                        options={STATUSES}
                                    />
                                </td>

                                {/* Created */}
                                <td className="px-2 py-1.5 text-xs text-neutral-500">{formatDate(task.created_at)}</td>

                                {/* Assigned By */}
                                <td className="px-2 py-1.5 text-xs text-neutral-500">{task.assigner?.full_name || '—'}</td>

                                {/* Employee Update */}
                                <td className="px-1 py-0.5">
                                    <EditableCell
                                        value={task.employee_update}
                                        onChange={(v) => handleUpdateTask(task.id, 'employee_update', v)}
                                        placeholder="Add update..."
                                        className={!isAdmin ? 'bg-yellow-50/50 dark:bg-yellow-900/10 rounded' : ''}
                                    />
                                </td>

                                {/* Last Modified */}
                                <td className="px-2 py-1.5 text-xs text-neutral-500">
                                    {formatDateTime(task.employee_updated_at || task.updated_at)}
                                </td>

                                {/* Actions */}
                                {isAdmin && (
                                    <td className="px-2 py-1.5 text-center">
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Employee Tabs (admin only, Google Sheets style) */}
            {isAdmin && employees.length > 0 && (
                <EmployeeTabs
                    employees={employeesWithTasks.length > 0 ? employeesWithTasks : employees}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    taskCounts={taskCounts}
                />
            )}
        </div>
    );
}
