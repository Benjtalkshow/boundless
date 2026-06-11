'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { BoundlessButton } from '@/components/buttons';
import { Input } from '@/components/ui/input';
import { formatAddress } from '@/lib/wallet-utils';
import { signXdrWithKit } from '@/lib/wallet/wallet-kit';
import {
  useBuildSpendXdr,
  useInitiateSpend,
  useSpendDecision,
  useSpendRequests,
  useSubmitSignedXdr,
  useTreasuryWallets,
  type SpendRequest,
  type SpendStatus,
  type TreasuryWallet,
} from '@/features/treasury';

const STATUS_TONE: Record<SpendStatus, string> = {
  PENDING: 'border-amber-900/50 bg-amber-950/30 text-amber-300',
  APPROVED: 'border-blue-900/50 bg-blue-950/30 text-blue-300',
  AWAITING_SIGNATURES: 'border-blue-900/50 bg-blue-950/30 text-blue-300',
  SUBMITTED: 'border-blue-900/50 bg-blue-950/30 text-blue-300',
  COMPLETED: 'border-green-900/50 bg-green-950/30 text-green-300',
  REJECTED: 'border-red-900/50 bg-red-950/30 text-red-300',
  FAILED: 'border-red-900/50 bg-red-950/30 text-red-300',
  CANCELLED: 'border-gray-800 bg-gray-900 text-gray-400',
};

export default function SpendInbox({
  organizationId,
}: {
  organizationId: string;
}) {
  const { data: wallets } = useTreasuryWallets(organizationId);
  const { data: spends, isLoading } = useSpendRequests(organizationId);
  const initiate = useInitiateSpend(organizationId);

  const activeWallets = useMemo(
    () => (wallets ?? []).filter(w => w.status === 'ACTIVE'),
    [wallets]
  );

  const [showForm, setShowForm] = useState(false);
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');

  const submitNew = async () => {
    if (!sourceWalletId || !destination || !amount || !purpose) {
      toast.error('Fill in source, destination, amount, and purpose');
      return;
    }
    try {
      await initiate.mutateAsync({
        sourceWalletId,
        destination: destination.trim(),
        amount: amount.trim(),
        purpose: purpose.trim(),
      });
      toast.success('Spend request created');
      setShowForm(false);
      setDestination('');
      setAmount('');
      setPurpose('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not create spend'
      );
    }
  };

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-gray-400'>
          Move funds out of a treasury wallet with tiered approvals.
        </p>
        <BoundlessButton
          variant='outline'
          onClick={() => setShowForm(v => !v)}
          className='border-gray-700'
        >
          <span className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            New spend
          </span>
        </BoundlessButton>
      </div>

      {showForm && (
        <div className='space-y-3 rounded-2xl border border-gray-800 bg-gray-900/40 p-4'>
          <select
            value={sourceWalletId}
            onChange={e => setSourceWalletId(e.target.value)}
            className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white'
          >
            <option value=''>Select source wallet</option>
            {activeWallets.map(w => (
              <option key={w.id} value={w.id}>
                {w.label} ({w.kind.toLowerCase()})
              </option>
            ))}
          </select>
          <Input
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder='Destination G-address'
            className='border-gray-700 bg-black text-white'
          />
          <div className='flex gap-2'>
            <Input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder='Amount (USDC)'
              inputMode='decimal'
              className='border-gray-700 bg-black text-white'
            />
            <Input
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder='Purpose'
              className='border-gray-700 bg-black text-white'
            />
          </div>
          <BoundlessButton onClick={submitNew} disabled={initiate.isPending}>
            {initiate.isPending ? 'Creating…' : 'Create request'}
          </BoundlessButton>
        </div>
      )}

      {isLoading ? (
        <div className='flex items-center gap-2 text-sm text-gray-500'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Loading spend requests…
        </div>
      ) : !spends || spends.length === 0 ? (
        <p className='text-sm text-gray-500'>No spend requests yet.</p>
      ) : (
        <div className='space-y-3'>
          {spends.map(s => (
            <SpendRow
              key={s.id}
              organizationId={organizationId}
              spend={s}
              wallet={activeWallets.find(w => w.id === s.sourceWalletId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SpendRow({
  organizationId,
  spend,
  wallet,
}: {
  organizationId: string;
  spend: SpendRequest;
  wallet?: TreasuryWallet;
}) {
  const decision = useSpendDecision(organizationId);
  const buildXdr = useBuildSpendXdr(organizationId);
  const submitSigned = useSubmitSignedXdr(organizationId);
  const [busy, setBusy] = useState(false);

  const approveCount = spend.approvals.filter(
    a => a.action === 'approve'
  ).length;

  const act = async (action: 'approve' | 'reject' | 'cancel' | 'execute') => {
    try {
      await decision.mutateAsync({ requestId: spend.id, action });
      toast.success(`Request ${action}d`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${action}`);
    }
  };

  // Connected (Tier 2/3) execution: build XDR, sign in-browser, submit.
  const executeConnected = async () => {
    setBusy(true);
    try {
      const { unsignedXdr } = await buildXdr.mutateAsync(spend.id);
      const signed = await signXdrWithKit(unsignedXdr, wallet?.publicKey);
      await submitSigned.mutateAsync({
        requestId: spend.id,
        signedXdr: signed,
      });
      toast.success('Spend submitted on-chain');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit');
    } finally {
      setBusy(false);
    }
  };

  const isConnected = wallet?.kind === 'CONNECTED';

  return (
    <div className='rounded-xl border border-gray-800 bg-gray-900/40 p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-sm font-medium text-white'>
            {spend.amount} {spend.currency} →{' '}
            {formatAddress(spend.destination, 4)}
          </p>
          <p className='mt-0.5 text-xs text-gray-400'>
            {spend.purpose} · from {wallet?.label ?? 'wallet'} · {approveCount}/
            {spend.requiredApprovals} approvals
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${STATUS_TONE[spend.status]}`}
        >
          {spend.status.toLowerCase().replace('_', ' ')}
        </span>
      </div>

      <div className='mt-3 flex flex-wrap gap-2'>
        {spend.status === 'PENDING' && (
          <>
            <ActionButton
              label='Approve'
              onClick={() => act('approve')}
              disabled={decision.isPending}
            />
            <ActionButton
              label='Reject'
              variant='outline'
              onClick={() => act('reject')}
              disabled={decision.isPending}
            />
          </>
        )}
        {spend.status === 'APPROVED' &&
          (isConnected ? (
            <ActionButton
              label={busy ? 'Signing…' : 'Sign & submit'}
              icon={<Send className='h-3.5 w-3.5' />}
              onClick={executeConnected}
              disabled={busy}
            />
          ) : (
            <ActionButton
              label={decision.isPending ? 'Executing…' : 'Execute'}
              icon={<Send className='h-3.5 w-3.5' />}
              onClick={() => act('execute')}
              disabled={decision.isPending}
            />
          ))}
        {spend.status === 'AWAITING_SIGNATURES' && isConnected && (
          <ActionButton
            label={busy ? 'Signing…' : 'Sign & submit'}
            icon={<Send className='h-3.5 w-3.5' />}
            onClick={executeConnected}
            disabled={busy}
          />
        )}
        {(spend.status === 'PENDING' ||
          spend.status === 'APPROVED' ||
          spend.status === 'AWAITING_SIGNATURES') && (
          <ActionButton
            label='Cancel'
            variant='outline'
            onClick={() => act('cancel')}
            disabled={decision.isPending}
          />
        )}
        {spend.onChainTxHash && (
          <span className='self-center font-mono text-xs text-gray-500'>
            {formatAddress(spend.onChainTxHash, 6)}
          </span>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'outline';
  icon?: React.ReactNode;
}) {
  return (
    <BoundlessButton
      size='sm'
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={variant === 'outline' ? 'border-gray-700' : ''}
    >
      <span className='flex items-center gap-1.5'>
        {icon}
        {label}
      </span>
    </BoundlessButton>
  );
}
