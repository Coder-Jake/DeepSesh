"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTimer } from '@/contexts/TimerContext';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type FeedbackFormValues = z.infer<typeof formSchema>;

const FeedbackForm = () => {
  const { areToastsEnabled } = useTimer();
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FeedbackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (values: FeedbackFormValues) => {
    // Simulate sending email locally
    console.log("Feedback submitted locally:", values);
    
    if (areToastsEnabled) {
      toast.success('Feedback received locally!', {
        description: 'Thank you for your valuable input. Email sending is currently disabled.',
      });
    }
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="feedback-name"> Name</Label>
        <Input
          id="feedback-name"
          {...register('name')}
          placeholder="Enter your name"
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback-email"> Email (optional)</Label>
        <Input
          id="feedback-email"
          type="email"
          {...register('email')}
          placeholder="Enter your email"
          disabled={isSubmitting}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback-message">Message</Label>
        <Textarea
          id="feedback-message"
          {...register('message')}
          placeholder="Report an idea or bug..."
          rows={5}
          disabled={isSubmitting}
        />
        {errors.message && <p className="text-red-500 text-sm">{errors.message.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Feedback'}
      </Button>
    </form>
  );
};

export default FeedbackForm;