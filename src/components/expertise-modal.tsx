'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExpertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpertiseSelected: (expertise: string) => void;
  currentExpertise?: string;
}

const EXPERTISE_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Art & Design',
  'Science',
  'Business',
  'Engineering',
  'Marketing',
  'Law',
  'Sports',
  'Food & Cooking',
  'Travel',
  'Fashion',
  'Music',
  'Photography',
  'Writing',
  'Psychology',
  'Architecture',
  'Agriculture',
  'Other',
];

export default function ExpertiseModal({
  isOpen,
  onClose,
  onExpertiseSelected,
  currentExpertise,
}: ExpertiseModalProps) {
  const [selectedExpertise, setSelectedExpertise] = useState(
    currentExpertise || '',
  );

  const handleSubmit = () => {
    if (selectedExpertise) {
      onExpertiseSelected(selectedExpertise);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900">Select Your Expertise</CardTitle>
          <CardDescription className="text-gray-600">
            Choose your area of expertise to help us provide better content and
            rewards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expertise" className="text-gray-700">
              What&apos;s your area of expertise?
            </Label>
            <Select
              value={selectedExpertise}
              onValueChange={setSelectedExpertise}
            >
              <SelectTrigger className="w-full cursor-pointer bg-white border-gray-300 hover:bg-gray-50 text-black">
                <SelectValue placeholder="Select your expertise" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black max-h-52 overflow-y-auto">
                {EXPERTISE_OPTIONS.map((expertise) => (
                  <SelectItem
                    key={expertise}
                    value={expertise}
                    className="text-black hover:bg-blue-500 hover:text-white cursor-pointer"
                  >
                    {expertise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!selectedExpertise}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              Save Expertise
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 text-white hover:bg-gray-50 hover:text-black cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
