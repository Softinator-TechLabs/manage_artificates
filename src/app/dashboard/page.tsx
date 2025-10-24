'use client';

import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import SubmissionForm from '@/components/submission-form';
import SubmissionsTable from '@/components/submissions-table';
import Link from 'next/link';

export default function Dashboard() {
  const { status } = useSession();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/me');
      if (!res.ok) throw new Error('Failed to fetch wallet');
      return res.json();
    },
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-600 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Image QA Rewards</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Balance:{' '}
                <span className="font-semibold text-green-600">
                  {wallet?.balance || 0} points
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" asChild>
                  <Link href="/bank">Bank Details</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/wallet">Wallet</Link>
                </Button>
                <Button variant="outline" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SubmissionForm />
          </div>
          <div>
            <SubmissionsTable />
          </div>
        </div>
      </main>
    </div>
  );
}
