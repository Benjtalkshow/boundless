'use client';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface SidebarBounty {
  id: string;
  title: string;
  status: string;
}

/** Lifecycle status -> selector dot color. */
function statusDot(status: string): string {
  switch (status) {
    case 'open':
    case 'in_progress':
    case 'submitted':
    case 'under_review':
      return 'bg-emerald-500';
    case 'completed':
      return 'bg-primary';
    case 'cancelled':
      return 'bg-zinc-500';
    default:
      return 'bg-amber-500';
  }
}

/**
 * Switches between the organization's bounties from the management sidebar,
 * mirroring the hackathon selector. Selecting one navigates to its dashboard.
 */
export default function BountySelector({
  organizationId,
  bounties,
  currentId,
}: {
  organizationId: string;
  bounties: SidebarBounty[];
  currentId: string;
}) {
  const router = useRouter();
  const current = bounties.find(b => b.id === currentId);

  if (!current) {
    return (
      <div className='flex items-center gap-3 px-3 py-2'>
        <div className='h-2 w-2 animate-pulse rounded-full bg-zinc-700' />
        <span className='text-sm font-medium text-zinc-400'>Loading…</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className='focus-visible:ring-0'>
        <Button className='flex w-full items-center gap-3 bg-transparent px-3 py-2 hover:bg-transparent focus-visible:ring-0'>
          <span
            className={`h-2 w-2 rounded-full ${statusDot(current.status)}`}
          />
          <span className='max-w-[180px] truncate text-sm font-medium text-white'>
            {current.title || 'Untitled bounty'}
          </span>
          <ChevronsUpDown className='ml-auto h-4 w-4 text-zinc-400' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='start'
        className='w-[260px] rounded-lg border border-[#2B2B2B] bg-[#1A1A1A] p-2 shadow-lg'
      >
        {bounties.map(b => (
          <DropdownMenuItem
            key={b.id}
            onClick={() =>
              router.push(`/organizations/${organizationId}/bounties/${b.id}`)
            }
            className='flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 hover:bg-[#252525] focus:bg-[#252525]'
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${statusDot(b.status)}`}
            />
            <div className='flex flex-1 flex-col gap-0.5'>
              <span className='truncate text-sm font-medium text-white'>
                {b.title || 'Untitled bounty'}
              </span>
              <span className='text-xs text-zinc-400 capitalize'>
                {b.status.replace(/_/g, ' ')}
              </span>
            </div>
            {b.id === currentId && <Check className='text-primary h-4 w-4' />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className='bg-[#2B2B2B]' />
        <DropdownMenuItem
          onClick={() =>
            router.push(`/organizations/${organizationId}/bounties/new`)
          }
          className='text-primary flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 hover:bg-[#252525] focus:bg-[#252525]'
        >
          <Plus className='h-4 w-4 shrink-0' />
          <span className='text-sm font-medium'>New bounty</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
