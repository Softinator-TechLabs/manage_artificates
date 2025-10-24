'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function SubmissionsTable() {
  const {
    data: submissions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      const res = await fetch('/api/submissions?mine=1');
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Submissions</CardTitle>
          <CardDescription>Loading your submissions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Submissions</CardTitle>
          <CardDescription>Error loading submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            Error: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Submissions</CardTitle>
        <CardDescription>
          Your submitted image Q&As and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!submissions || submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No submissions yet. Submit your first image Q&A above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Question (Original)</TableHead>
                  <TableHead>Question (English)</TableHead>
                  <TableHead>Answer (Original)</TableHead>
                  <TableHead>Answer (English)</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map(
                  (submission: {
                    _id: string;
                    question: string;
                    answer: string;
                    englishQuestion?: string;
                    englishAnswer?: string;
                    status: string;
                    pointsAwarded?: number;
                    createdAt: string;
                  }) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={submission.question}>
                          {submission.question}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div
                          className="truncate"
                          title={submission.englishQuestion || 'Not translated'}
                        >
                          {submission.englishQuestion || 'Not translated'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={submission.answer}>
                          {submission.answer}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div
                          className="truncate"
                          title={submission.englishAnswer || 'Not translated'}
                        >
                          {submission.englishAnswer || 'Not translated'}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {submission.pointsAwarded || 0}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
