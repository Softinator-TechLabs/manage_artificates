'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function BankDetailsForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const { data: bankDetails, isLoading } = useQuery({
    queryKey: ['bank-details'],
    queryFn: async () => {
      const res = await fetch('/api/bank');
      if (!res.ok) throw new Error('Failed to fetch bank details');
      return res.json();
    },
  });

  const { mutate: saveDetails, isPending } = useMutation({
    mutationFn: async (data: typeof form) => {
      const parsed = bankSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(
          'Invalid input: ' +
            parsed.error.issues.map((e) => e.message).join(', '),
        );
      }

      const res = await fetch('/api/bank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save bank details');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-details'] });
    },
  });

  useEffect(() => {
    if (bankDetails) {
      setForm({
        accountHolder: bankDetails.accountHolder || '',
        accountNumber: '', // Never prefill sensitive data
        ifsc: bankDetails.ifsc || '',
        upiId: bankDetails.upiId || '',
      });
    }
  }, [bankDetails]);

  const handleSave = () => {
    saveDetails(form);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bank & UPI Details</CardTitle>
          <CardDescription>Loading your bank details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank & UPI Details</CardTitle>
        <CardDescription>
          Add your bank account and UPI details for redemptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountHolder">Account Holder Name</Label>
          <Input
            id="accountHolder"
            placeholder="Enter account holder name"
            value={form.accountHolder}
            onChange={(e) =>
              setForm({ ...form, accountHolder: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            placeholder="Enter account number"
            value={form.accountNumber}
            onChange={(e) =>
              setForm({ ...form, accountNumber: e.target.value })
            }
            type="password"
          />
          {bankDetails?.accountNumberMasked && (
            <p className="text-sm text-gray-500">
              Current: {bankDetails.accountNumberMasked}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ifsc">IFSC Code</Label>
          <Input
            id="ifsc"
            placeholder="Enter IFSC code (e.g., SBIN0001234)"
            value={form.ifsc}
            onChange={(e) =>
              setForm({ ...form, ifsc: e.target.value.toUpperCase() })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="upiId">UPI ID</Label>
          <Input
            id="upiId"
            placeholder="Enter UPI ID (e.g., name@bank)"
            value={form.upiId}
            onChange={(e) => setForm({ ...form, upiId: e.target.value })}
          />
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? 'Saving...' : 'Save Details'}
        </Button>
      </CardContent>
    </Card>
  );
}
