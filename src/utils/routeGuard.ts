import React, { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/store';

/**
 * Role-based route definitions.
 * Any screen not listed here is considered "shared" (e.g. profile).
 */
const ADMIN_ONLY_ROUTES = [
  'admin-dashboard',
  'admin-trips',
  'admin-expenses',
  'admin-transfers',
  'admin-analytics',
  'admin-refuels',
  'admin-reminders',
  'admin-displays',
  'admin-manage',
  'drivers',
  'driver-detail',
  'trucks',
  'companies',
  'company-details',
  'analytics',
  'manage-driver',
  'add-truck',
  'add-company',
  'add-reminder',
  'add-display',
  'admin-forms',
  'add-form-template',
];

const DRIVER_ONLY_ROUTES = [
  'driver-dashboard',
  'driver-trips',
  'driver-expenses',
  'driver-refuels',
  'driver-transfers',
  'add-request',
];

/**
 * useRouteGuard
 * 
 * This hook monitors the current route segment and redirects the user
 * if they land on a screen their role doesn't have access to.
 * 
 * Call this in the root _layout.tsx after session restore.
 */
export function useRouteGuard() {
  const segments = useSegments();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const currentSegment = segments[0] as string;

    // Critical Security Fix: If not authenticated, block access to any non-auth route
    if (!isAuthenticated || !user) {
      if (currentSegment && currentSegment !== '(auth)' && currentSegment !== 'index') {
        console.log(`[GUARD] Unauthenticated user tried to access protected route: ${currentSegment}. Redirecting.`);
        router.replace('/(auth)/login');
      }
      return;
    }

    if (!currentSegment) return;

    const role = user.role;

    if (role === 'driver' && ADMIN_ONLY_ROUTES.includes(currentSegment)) {
      console.log(`[GUARD] Driver tried to access admin route: ${currentSegment}. Redirecting.`);
      router.replace('/driver-dashboard');
      return;
    }

    if (role === 'admin' && DRIVER_ONLY_ROUTES.includes(currentSegment)) {
      console.log(`[GUARD] Admin tried to access driver route: ${currentSegment}. Redirecting.`);
      router.replace('/admin-dashboard');
      return;
    }
  }, [segments, user, isAuthenticated]);
}
