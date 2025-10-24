'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/image-upload';

export default function SubmissionForm() {
  const queryClient = useQueryClient();
  const [imageData, setImageData] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [englishQuestion, setEnglishQuestion] = useState('');
  const [englishAnswer, setEnglishAnswer] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to translate text using n8n webhook
  const translateText = async (text: string): Promise<string> => {
    try {
      const response = await fetch(
        'http://n8n.softinator.org/webhook-test/hinglish-translate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        },
      );

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const result = await response.json();
      return result.translatedText || result.text || text; // Fallback to original text
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  };

  // Function to handle translation of both question and answer
  const handleTranslation = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Please fill in both question and answer before translating');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const [translatedQuestion, translatedAnswer] = await Promise.all([
        translateText(question),
        translateText(answer),
      ]);

      setEnglishQuestion(translatedQuestion);
      setEnglishAnswer(translatedAnswer);
    } catch {
      setError('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!imageData) {
        throw new Error('Please select an image');
      }
      if (!question.trim()) {
        throw new Error('Question is required');
      }
      if (!answer.trim()) {
        throw new Error('Answer is required');
      }

      const body = {
        imageData,
        question,
        answer,
        englishQuestion,
        englishAnswer,
      };

      console.log('Submitting with data:', {
        hasImageData: !!imageData,
        questionLength: question.length,
        answerLength: answer.length,
        hasEnglishQuestion: !!englishQuestion,
        hasEnglishAnswer: !!englishAnswer,
      });

      const parsed = submissionSchema.safeParse(body);
      if (!parsed.success) {
        console.error('Validation failed:', parsed.error.issues);
        throw new Error(
          'Invalid input: ' +
            parsed.error.issues.map((e) => e.message).join(', '),
        );
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errorMessage = 'Submit failed';
        try {
          const errorData = await res.json();
          errorMessage =
            errorData.error || errorData.details || 'Submit failed';
          console.error('API Error:', errorData);
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      return res.json();
    },
    onSuccess: () => {
      setQuestion('');
      setAnswer('');
      setEnglishQuestion('');
      setEnglishAnswer('');
      setImageData('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Image Q&A</CardTitle>
        <CardDescription>
          Upload a clear image, ask one specific question about it, and provide
          your best answer. Our system will review it; if accepted, you earn
          points.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageUpload
          onImageUploaded={setImageData}
          currentImageData={imageData}
        />

        <div className="space-y-2">
          <Label htmlFor="question">
            Question (Max 100 characters, Hinglish allowed)
          </Label>
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

        {/* Translation Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">English Translation</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTranslation}
              disabled={isTranslating || !question.trim() || !answer.trim()}
            >
              {isTranslating ? 'Translating...' : 'Translate to English'}
            </Button>
          </div>

          {/* Hidden English Question Field */}
          <div className="space-y-2">
            <Label htmlFor="englishQuestion" className="text-sm text-gray-600">
              English Question (Auto-generated)
            </Label>
            <Textarea
              id="englishQuestion"
              placeholder="English translation will appear here..."
              value={englishQuestion}
              onChange={(e) => setEnglishQuestion(e.target.value)}
              rows={3}
              className="bg-gray-50"
            />
          </div>

          {/* Hidden English Answer Field */}
          <div className="space-y-2">
            <Label htmlFor="englishAnswer" className="text-sm text-gray-600">
              English Answer (Auto-generated)
            </Label>
            <Textarea
              id="englishAnswer"
              placeholder="English translation will appear here..."
              value={englishAnswer}
              onChange={(e) => setEnglishAnswer(e.target.value)}
              rows={4}
              className="bg-gray-50"
            />
          </div>
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
          {isPending ? 'Submitting...' : 'Submit'}
        </Button>
      </CardContent>
    </Card>
  );
}
