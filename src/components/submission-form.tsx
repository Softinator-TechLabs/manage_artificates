"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { submissionSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/image-upload";

export default function SubmissionForm() {
  const queryClient = useQueryClient();
  const [artifactUrl, setArtifactUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const body = { artifactUrl, question, answer };
      const parsed = submissionSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error("Invalid input: " + parsed.error.issues.map(e => e.message).join(", "));
      }
      
      const res = await fetch("/api/submissions", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body) 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Submit failed");
      }
      
      return res.json();
    },
    onSuccess: () => {
      setQuestion("");
      setAnswer("");
      setArtifactUrl("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Image Q&A</CardTitle>
        <CardDescription>
          Upload a clear image, ask one specific question about it, and provide your best answer. 
          Our system will review it; if accepted, you earn points.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageUpload 
          onImageUploaded={setArtifactUrl}
          currentImageUrl={artifactUrl}
        />

         <div className="space-y-2">
           <Label htmlFor="question">Question (Max 100 characters, Hinglish allowed)</Label>
           <Textarea
             id="question"
             placeholder="Ask one specific question about the image"
             value={question}
             onChange={(e) => setQuestion(e.target.value)}
             rows={3}
             maxLength={100}
           />
           <div className="text-right text-sm text-gray-500">
             {question.length}/100 characters
           </div>
         </div>

        <div className="space-y-2">
          <Label htmlFor="answer">Answer</Label>
          <Textarea
            id="answer"
            placeholder="Provide your best answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button 
          onClick={() => mutate()} 
          disabled={isPending}
          className="w-full bg-gray-600"
        >
          {isPending ? "Submitting..." : "Submit"}
        </Button>
      </CardContent>
    </Card>
  );
}
