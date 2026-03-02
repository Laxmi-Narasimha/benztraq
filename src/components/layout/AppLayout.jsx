/**
 * App Layout Component
 * 
 * Main application layout with sidebar and content area.
 * Used for all authenticated pages.
 * Auto-collapses sidebar on /tasks for full-screen spreadsheet.
 * 
 * @module components/layout/AppLayout
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';

/**
 * AppLayout component.
 * Provides the main application structure with sidebar and content area.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} [props.title] - Page title for the top bar
 * @param {React.ReactNode} [props.actions] - Additional action buttons for the top bar
 */
export function AppLayout({ children, title, actions }) {
    const pathname = usePathname();
    const isTasksPage = pathname === '/tasks';
    const [sidebarCollapsed, setSidebarCollapsed] = useState(isTasksPage);

    // Auto-collapse on tasks page
    useEffect(() => {
        if (isTasksPage) setSidebarCollapsed(true);
    }, [isTasksPage]);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar title={title} actions={actions} />

                <main className={cn("flex-1 overflow-hidden", !isTasksPage && "overflow-y-auto")}>
                    {isTasksPage ? (
                        children
                    ) : (
                        <div className="container py-6 px-6 max-w-7xl mx-auto">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
