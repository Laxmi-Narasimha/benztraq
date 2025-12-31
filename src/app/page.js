/**
 * Home Page - Redirects to Dashboard
 * 
 * @module app/page
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
}
