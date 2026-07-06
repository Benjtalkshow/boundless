'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChartBig,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  useBountyOverview,
  useOrganizationBounties,
} from '@/features/bounties';
import BountySelector, { type SidebarBounty } from './BountySelector';

type SectionKey =
  | 'overview'
  | 'applications'
  | 'submissions'
  | 'payout'
  | 'results'
  | 'settings';

interface NavItem {
  key: SectionKey;
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
}

const DRAFT_STATUSES = new Set(['draft', 'draft_awaiting_funding']);

/**
 * Persistent management sidebar for a single bounty, mirroring the hackathon
 * organizer sidebar: a bounty switcher on top and the operational nav below.
 * Rendered by the organizations layout on bounty management routes (replacing
 * the general org sidebar), so it is self-contained — it derives the bounty id
 * from the path and fetches its own data.
 */
export default function BountyManageSidebar({
  organizationId,
}: {
  organizationId?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const orgId = useMemo(() => {
    if (organizationId) return organizationId;
    const parts = pathname?.split('/') ?? [];
    return parts[1] === 'organizations' ? (parts[2] ?? '') : '';
  }, [organizationId, pathname]);

  const bountyId = useMemo(() => {
    const parts = pathname?.split('/') ?? [];
    // /organizations/{org}/bounties/{bountyId}[/settings]
    if (parts[3] === 'bounties') {
      const id = parts[4];
      if (id && id !== 'new' && id !== 'drafts') return id;
    }
    return '';
  }, [pathname]);

  const { data: listData } = useOrganizationBounties(orgId);
  const { data: overview } = useBountyOverview(orgId, bountyId);

  const bounties: SidebarBounty[] = useMemo(
    () =>
      (listData ?? [])
        .filter(b => !DRAFT_STATUSES.has(b.status))
        .map(b => ({
          id: b.id,
          title: b.title ?? 'Untitled bounty',
          status: b.status,
        })),
    [listData]
  );

  const onSettings = pathname?.endsWith('/settings') ?? false;
  const activeKey: SectionKey = onSettings
    ? 'settings'
    : ((searchParams?.get('tab') as SectionKey) ?? 'overview');

  const isApplication =
    overview?.entryType === 'APPLICATION_LIGHT' ||
    overview?.entryType === 'APPLICATION_FULL';
  const isCompleted = overview?.status === 'completed';

  const base = `/organizations/${orgId}/bounties/${bountyId}`;
  const items: NavItem[] = useMemo(() => {
    const list: NavItem[] = [
      {
        key: 'overview',
        icon: LayoutDashboard,
        label: 'Overview',
        description: 'Analytics dashboard',
        href: `${base}?tab=overview`,
      },
    ];
    if (isApplication) {
      list.push({
        key: 'applications',
        icon: Users,
        label: 'Applications',
        description: 'Shortlist and select',
        href: `${base}?tab=applications`,
      });
    }
    list.push(
      {
        key: 'submissions',
        icon: FileText,
        label: 'Submissions',
        description: 'Review submitted work',
        href: `${base}?tab=submissions`,
      },
      {
        key: 'payout',
        icon: Trophy,
        label: 'Payout & Winners',
        description: 'Select and pay winners',
        href: `${base}?tab=payout`,
      }
    );
    if (isCompleted) {
      list.push({
        key: 'results',
        icon: BarChartBig,
        label: 'Results',
        description: 'Winners and announcement',
        href: `${base}?tab=results`,
      });
    }
    list.push({
      key: 'settings',
      icon: Settings,
      label: 'Settings',
      description: 'Configure and close out',
      href: `${base}/settings`,
    });
    return list;
  }, [base, isApplication, isCompleted]);

  const content = (
    <BountySidebarContent
      organizationId={orgId}
      bountyId={bountyId}
      bounties={bounties}
      items={items}
      activeKey={activeKey}
    />
  );

  return (
    <>
      {/* Mobile: hamburger + sheet */}
      <div className='fixed top-20 left-4 z-50 md:hidden'>
        <Sheet>
          <SheetTrigger asChild>
            <button
              className='flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-black/60 shadow-lg backdrop-blur-xl'
              aria-label='Open bounty menu'
            >
              <Menu className='h-5 w-5 text-white' />
            </button>
          </SheetTrigger>
          <SheetContent
            side='left'
            className='w-[280px] border-r border-zinc-800 bg-black p-0'
          >
            {content}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: fixed sidebar */}
      <aside
        className='fixed left-0 hidden h-[calc(100vh-90px)] w-[280px] border-r border-zinc-800/50 bg-black/40 backdrop-blur-xl md:block'
        style={{ top: '90px' }}
      >
        {content}
      </aside>
    </>
  );
}

function BountySidebarContent({
  organizationId,
  bountyId,
  bounties,
  items,
  activeKey,
}: {
  organizationId: string;
  bountyId: string;
  bounties: SidebarBounty[];
  items: NavItem[];
  activeKey: SectionKey;
}) {
  return (
    <nav className='flex h-full flex-col overflow-y-auto px-4 py-6'>
      <div className='mb-6 rounded-xl bg-zinc-900/50 p-2'>
        <BountySelector
          organizationId={organizationId}
          bounties={bounties}
          currentId={bountyId}
        />
      </div>

      <h3 className='mb-3 px-3 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase'>
        Navigation
      </h3>

      <div className='space-y-1'>
        {items.map(item => {
          const Icon = item.icon;
          const isActive = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'from-primary/10 text-primary shadow-primary/5 bg-linear-to-r to-transparent shadow-lg'
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
              )}
            >
              {isActive && (
                <span className='bg-primary absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-r-full' />
              )}
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                  isActive
                    ? 'bg-primary/20 shadow-primary/20 shadow-lg'
                    : 'bg-zinc-900/50 group-hover:bg-zinc-800'
                )}
              >
                <Icon className='h-4 w-4' />
              </span>
              <span className='flex flex-col'>
                <span>{item.label}</span>
                <span
                  className={cn(
                    'text-xs transition-colors',
                    isActive
                      ? 'text-primary/60'
                      : 'text-zinc-600 group-hover:text-zinc-500'
                  )}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
