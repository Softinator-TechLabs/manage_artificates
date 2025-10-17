"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { redemptionSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WalletDisplay() {
  const queryClient = useQueryClient();
  const [redemptionPoints, setRedemptionPoints] = useState("");
  const [redemptionMethod, setRedemptionMethod] = useState<"BANK" | "UPI">("BANK");

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/me");
      if (!res.ok) throw new Error("Failed to fetch wallet");
      return res.json();
    },
  });

  const { data: redemptions, isLoading: redemptionsLoading } = useQuery({
    queryKey: ["redemptions"],
    queryFn: async () => {
      const res = await fetch("/api/redemptions");
      if (!res.ok) throw new Error("Failed to fetch redemptions");
      return res.json();
    },
  });

  const { mutate: createRedemption, isPending } = useMutation({
    mutationFn: async (data: { method: "BANK" | "UPI"; points: number }) => {
      const parsed = redemptionSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error("Invalid input: " + parsed.error.issues.map(e => e.message).join(", "));
      }

      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create redemption");
      }

      return res.json();
    },
    onSuccess: () => {
      setRedemptionPoints("");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["redemptions"] });
    },
  });

  const handleRedemption = () => {
    const points = parseInt(redemptionPoints);
    if (points > 0 && wallet && points <= wallet.balance) {
      createRedemption({ method: redemptionMethod, points });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PAID":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (walletLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>Loading wallet information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          <CardDescription>Your current points balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {wallet?.balance || 0} Points
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redeem Points</CardTitle>
          <CardDescription>Convert your points to cash</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="points">Points to Redeem</Label>
            <Input
              id="points"
              type="number"
              placeholder="Enter points to redeem"
              value={redemptionPoints}
              onChange={(e) => setRedemptionPoints(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Redemption Method</Label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="BANK"
                  checked={redemptionMethod === "BANK"}
                  onChange={(e) => setRedemptionMethod(e.target.value as "BANK")}
                />
                <span>Bank Transfer</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="UPI"
                  checked={redemptionMethod === "UPI"}
                  onChange={(e) => setRedemptionMethod(e.target.value as "UPI")}
                />
                <span>UPI</span>
              </label>
            </div>
          </div>

          <Button 
            onClick={handleRedemption} 
            disabled={isPending || !redemptionPoints || parseInt(redemptionPoints) <= 0 || (wallet && parseInt(redemptionPoints) > wallet.balance)}
            className="w-full"
          >
            {isPending ? "Processing..." : "Redeem Points"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redemption History</CardTitle>
          <CardDescription>Your past redemption requests</CardDescription>
        </CardHeader>
        <CardContent>
          {redemptionsLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !redemptions || redemptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No redemptions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Points</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((redemption: any) => (
                    <TableRow key={redemption._id}>
                      <TableCell className="font-medium">
                        {redemption.points}
                      </TableCell>
                      <TableCell>{redemption.method}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(redemption.status)}>
                          {redemption.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(redemption.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
