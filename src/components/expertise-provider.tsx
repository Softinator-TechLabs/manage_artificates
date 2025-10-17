"use client";

import { useExpertise } from "@/hooks/useExpertise";
import ExpertiseModal from "@/components/expertise-modal";

interface ExpertiseProviderProps {
  children: React.ReactNode;
}

export default function ExpertiseProvider({ children }: ExpertiseProviderProps) {
  const {
    userProfile,
    showExpertiseModal,
    setShowExpertiseModal,
    handleExpertiseSelected,
  } = useExpertise();

  return (
    <>
      {children}
      <ExpertiseModal
        isOpen={showExpertiseModal}
        onClose={() => setShowExpertiseModal(false)}
        onExpertiseSelected={handleExpertiseSelected}
        currentExpertise={userProfile?.expertise}
      />
    </>
  );
}
