'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useExpertise() {
  const { data: session } = useSession();
  const [showExpertiseModal, setShowExpertiseModal] = useState(false);

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile', session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) return null;

      const response = await fetch('/api/user/profile');
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!session?.user?.email,
  });

  // Update expertise mutation
  const updateExpertiseMutation = useMutation({
    mutationFn: async (expertise: string) => {
      const response = await fetch('/api/user/expertise', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertise }),
      });

      if (!response.ok) {
        throw new Error('Failed to update expertise');
      }

      return response.json();
    },
    onSuccess: () => {
      setShowExpertiseModal(false);
      // Refetch user profile
      window.location.reload();
    },
  });

  // Check if expertise is missing
  useEffect(() => {
    if (userProfile && !userProfile.expertise && !isLoading) {
      setShowExpertiseModal(true);
    }
  }, [userProfile, isLoading]);

  const handleExpertiseSelected = (expertise: string) => {
    updateExpertiseMutation.mutate(expertise);
  };

  return {
    userProfile,
    isLoading,
    showExpertiseModal,
    setShowExpertiseModal,
    handleExpertiseSelected,
    isUpdating: updateExpertiseMutation.isPending,
  };
}
