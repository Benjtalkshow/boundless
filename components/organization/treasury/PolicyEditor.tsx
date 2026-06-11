'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BoundlessButton } from '@/components/buttons';
import { Input } from '@/components/ui/input';
import {
  useTreasuryPolicy,
  useUpdatePolicy,
  type TreasuryPolicyRule,
} from '@/features/treasury';

export default function PolicyEditor({
  organizationId,
}: {
  organizationId: string;
}) {
  const { data: policy, isLoading } = useTreasuryPolicy(organizationId);
  const update = useUpdatePolicy(organizationId);
  const [rules, setRules] = useState<TreasuryPolicyRule[]>([]);

  useEffect(() => {
    if (policy?.rules) setRules(policy.rules);
  }, [policy?.rules]);

  const setRule = (i: number, patch: Partial<TreasuryPolicyRule>) =>
    setRules(rs => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addRule = () =>
    setRules(rs => [
      ...rs,
      {
        min_usdc: rs.length ? (rs[rs.length - 1].max_usdc ?? 0) : 0,
        max_usdc: null,
        required_approvals: 1,
        approver_roles: ['owner', 'admin'],
      },
    ]);

  const removeRule = (i: number) =>
    setRules(rs => rs.filter((_, idx) => idx !== i));

  const save = async () => {
    try {
      await update.mutateAsync({ rules });
      toast.success('Policy updated');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not update policy'
      );
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 text-sm text-gray-500'>
        <Loader2 className='h-4 w-4 animate-spin' />
        Loading policy…
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-gray-400'>
          Spend approval bands by amount.{' '}
          {policy?.isDefault && (
            <span className='text-gray-500'>(defaults shown)</span>
          )}
        </p>
        <BoundlessButton
          variant='outline'
          onClick={addRule}
          className='border-gray-700'
        >
          <span className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Add band
          </span>
        </BoundlessButton>
      </div>

      <div className='space-y-2'>
        <div className='grid grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-2 px-1 text-xs text-gray-500'>
          <span>Min USDC</span>
          <span>Max USDC</span>
          <span>Approvals</span>
          <span>Roles</span>
          <span />
        </div>
        {rules.map((r, i) => (
          <div
            key={i}
            className='grid grid-cols-[1fr_1fr_1fr_1.5fr_auto] items-center gap-2'
          >
            <Input
              value={String(r.min_usdc)}
              onChange={e =>
                setRule(i, { min_usdc: Number(e.target.value) || 0 })
              }
              inputMode='decimal'
              className='border-gray-700 bg-black text-white'
            />
            <Input
              value={r.max_usdc === null ? '' : String(r.max_usdc)}
              onChange={e =>
                setRule(i, {
                  max_usdc:
                    e.target.value.trim() === ''
                      ? null
                      : Number(e.target.value) || 0,
                })
              }
              placeholder='∞'
              inputMode='decimal'
              className='border-gray-700 bg-black text-white'
            />
            <Input
              value={String(r.required_approvals)}
              onChange={e =>
                setRule(i, {
                  required_approvals: Math.max(1, Number(e.target.value) || 1),
                })
              }
              inputMode='numeric'
              className='border-gray-700 bg-black text-white'
            />
            <Input
              value={r.approver_roles.join(', ')}
              onChange={e =>
                setRule(i, {
                  approver_roles: e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder='owner, admin'
              className='border-gray-700 bg-black text-white'
            />
            <button
              type='button'
              onClick={() => removeRule(i)}
              className='p-2 text-gray-500 hover:text-red-400'
              aria-label='Remove band'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        ))}
      </div>

      <BoundlessButton onClick={save} disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save policy'}
      </BoundlessButton>
    </div>
  );
}
