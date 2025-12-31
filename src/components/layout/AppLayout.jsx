/**
 * App Layout Component
 * 
 * Main application layout with sidebar and content area.
 * Used for all authenticated pages.
 * 
 * @module components/layout/AppLayout
 */

'use client';

import { useState } from 'react';
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

                <main className="flex-1 overflow-y-auto">
                    <div className="container py-6 px-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
