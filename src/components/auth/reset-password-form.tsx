'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resetRequestSchema, type ResetRequestInput } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ResetPasswordForm() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({ resolver: zodResolver(resetRequestSchema) });

  async function onSubmit(values: ResetRequestInput) {
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=/dashboard`
            : undefined,
      });
    } finally {
      // Always show success to avoid leaking which emails are registered.
      setDone(true);
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <MailCheck className="h-12 w-12 text-success" />
          <h2 className="mt-4 text-xl font-semibold">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for that address, we&apos;ve sent a link to reset your
            password.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Send reset link
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
