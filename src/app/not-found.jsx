/**
 * Not Found Page
 * 
 * Custom 404 page for the application.
 * 
 * @module app/not-found
 */

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
                <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
                <p className="text-muted-foreground mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2 hover:bg-primary/90"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
