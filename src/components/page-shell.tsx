'use client';

import React from 'react';
import ProtectedRoute from './protected-route';
import Layout from './layout';
import type { Role } from '@/lib/db';

export default function PageShell({
  allowed,
  children,
}: {
  allowed?: Role[];
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowed={allowed}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}
