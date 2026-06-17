import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { BoundlessButton } from '@/components/buttons';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { scopeSchema, type ScopeFormData } from './schemas/scopeSchema';

interface ScopeTabProps {
  onContinue?: () => void;
  onSave?: (data: ScopeFormData) => Promise<void>;
  initialData?: Partial<ScopeFormData>;
  isLoading?: boolean;
}

const defaultValues: ScopeFormData = {
  title: '',
  description: '',
  githubIssueUrl: null,
  githubIssueNumber: null,
};

export default function ScopeTab({
  onContinue,
  onSave,
  initialData,
  isLoading = false,
}: ScopeTabProps) {
  const form = useForm<ScopeFormData>({
    resolver: zodResolver(scopeSchema),
    defaultValues: { ...defaultValues, ...initialData },
  });

  React.useEffect(() => {
    if (initialData) form.reset({ ...defaultValues, ...initialData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const onSubmit = async (data: ScopeFormData) => {
    try {
      if (onSave) await onSave(data);
      if (onContinue) onContinue();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const message = err.response?.data?.message || err.message;
      const errorMessage = Array.isArray(message) ? message[0] : message;
      toast.error(errorMessage || 'Failed to save scope. Please try again.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm font-medium text-white'>
                Title<span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g. Build a Soroban faucet bot'
                  className='h-10 rounded-lg border-zinc-800 bg-zinc-900/50 text-white'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage className='text-xs text-red-500' />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm font-medium text-white'>
                Description<span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder='What needs to be built, and what does done look like?'
                  className='rounded-lg border-zinc-800 bg-zinc-900/50 text-white'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage className='text-xs text-red-500' />
            </FormItem>
          )}
        />

        <div className='grid gap-6 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='githubIssueUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-medium text-white'>
                  GitHub issue URL{' '}
                  <span className='text-zinc-500'>(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='https://github.com/org/repo/issues/123'
                    className='h-10 rounded-lg border-zinc-800 bg-zinc-900/50 text-white'
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage className='text-xs text-red-500' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='githubIssueNumber'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-medium text-white'>
                  GitHub issue number{' '}
                  <span className='text-zinc-500'>(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={1}
                    placeholder='123'
                    className='h-10 rounded-lg border-zinc-800 bg-zinc-900/50 text-white'
                    value={field.value ?? ''}
                    onChange={e => {
                      const n = parseInt(e.target.value, 10);
                      field.onChange(Number.isNaN(n) ? null : n);
                    }}
                  />
                </FormControl>
                <FormMessage className='text-xs text-red-500' />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end pt-4'>
          <BoundlessButton
            type='submit'
            size='lg'
            disabled={isLoading}
            className='min-w-32'
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </BoundlessButton>
        </div>
      </form>
    </Form>
  );
}
