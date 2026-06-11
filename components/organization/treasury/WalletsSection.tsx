'use client';

import { useState } from 'react';
import {
  Copy,
  Landmark,
  Link2,
  Loader2,
  Plus,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { BoundlessButton } from '@/components/buttons';
import { Input } from '@/components/ui/input';
import { formatAddress } from '@/lib/wallet-utils';
import { copyToClipboard } from '@/lib/utils';
import { connectWallet } from '@/lib/wallet/wallet-kit';
import {
  useArchiveWallet,
  useCreateManagedWallet,
  useRegisterConnectedWallet,
  useTreasuryWallets,
  useUpdateWallet,
  type TreasuryWallet,
} from '@/features/treasury';

export default function WalletsSection({
  organizationId,
}: {
  organizationId: string;
}) {
  const {
    data: wallets,
    isLoading,
    error,
  } = useTreasuryWallets(organizationId);
  const createManaged = useCreateManagedWallet(organizationId);
  const registerConnected = useRegisterConnectedWallet(organizationId);

  const [label, setLabel] = useState('');
  const [pendingConnect, setPendingConnect] = useState<string | null>(null);
  const [connectLabel, setConnectLabel] = useState('');

  const handleCreate = async () => {
    try {
      await createManaged.mutateAsync(label.trim() || 'Main treasury');
      toast.success('Treasury wallet created');
      setLabel('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not create wallet'
      );
    }
  };

  const handleConnect = async () => {
    try {
      const { address } = await connectWallet();
      setPendingConnect(address);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not connect');
    }
  };

  const handleRegister = async () => {
    if (!pendingConnect) return;
    try {
      await registerConnected.mutateAsync({
        publicKey: pendingConnect,
        label: connectLabel.trim() || 'Connected wallet',
        connectionMethod: 'walletkit_generic',
      });
      toast.success('Wallet connected');
      setPendingConnect(null);
      setConnectLabel('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not connect');
    }
  };

  return (
    <div className='space-y-8'>
      <div className='grid gap-4 sm:grid-cols-2'>
        {/* Managed */}
        <section className='rounded-2xl border border-gray-800 bg-gray-900/40 p-5'>
          <h3 className='flex items-center gap-2 text-sm font-medium text-white'>
            <ShieldCheck className='text-primary h-4 w-4' />
            Managed wallet
          </h3>
          <p className='mt-1 text-xs text-gray-400'>
            Boundless-custodial. We sponsor activation, the USDC trustline, and
            a fee float so it can transact.
          </p>
          <div className='mt-4 flex flex-col gap-2'>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder='Label (e.g. Main treasury)'
              maxLength={80}
              className='border-gray-700 bg-black text-white'
            />
            <BoundlessButton
              onClick={handleCreate}
              disabled={createManaged.isPending}
            >
              <span className='flex items-center gap-2'>
                {createManaged.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Plus className='h-4 w-4' />
                )}
                Create wallet
              </span>
            </BoundlessButton>
          </div>
        </section>

        {/* Connected */}
        <section className='rounded-2xl border border-gray-800 bg-gray-900/40 p-5'>
          <h3 className='flex items-center gap-2 text-sm font-medium text-white'>
            <Link2 className='text-primary h-4 w-4' />
            Connect a wallet
          </h3>
          <p className='mt-1 text-xs text-gray-400'>
            Use your own external or multisig wallet. Needs a USDC trustline;
            you sign in-browser.
          </p>
          <div className='mt-4 flex flex-col gap-2'>
            {pendingConnect ? (
              <>
                <p className='font-mono text-xs text-gray-300'>
                  {formatAddress(pendingConnect, 6)}
                </p>
                <Input
                  value={connectLabel}
                  onChange={e => setConnectLabel(e.target.value)}
                  placeholder='Label'
                  maxLength={80}
                  className='border-gray-700 bg-black text-white'
                />
                <div className='flex gap-2'>
                  <BoundlessButton
                    onClick={handleRegister}
                    disabled={registerConnected.isPending}
                  >
                    {registerConnected.isPending ? 'Connecting…' : 'Connect'}
                  </BoundlessButton>
                  <BoundlessButton
                    variant='outline'
                    onClick={() => setPendingConnect(null)}
                    className='border-gray-700'
                  >
                    Cancel
                  </BoundlessButton>
                </div>
              </>
            ) : (
              <BoundlessButton
                variant='outline'
                onClick={handleConnect}
                className='border-gray-700'
              >
                <span className='flex items-center gap-2'>
                  <Wallet className='h-4 w-4' />
                  Connect wallet
                </span>
              </BoundlessButton>
            )}
          </div>
        </section>
      </div>

      <section>
        <h3 className='mb-4 text-sm font-medium tracking-wider text-gray-500 uppercase'>
          Wallets
        </h3>
        {isLoading ? (
          <div className='flex items-center gap-2 text-sm text-gray-500'>
            <Loader2 className='h-4 w-4 animate-spin' />
            Loading wallets…
          </div>
        ) : error ? (
          <p className='text-sm text-gray-500'>
            Treasury is not available yet. Apply the treasury migration on the
            backend.
          </p>
        ) : !wallets || wallets.length === 0 ? (
          <p className='text-sm text-gray-500'>
            No treasury wallets yet. Create or connect one above.
          </p>
        ) : (
          <div className='space-y-3'>
            {wallets.map(w => (
              <WalletRow
                key={w.id}
                organizationId={organizationId}
                wallet={w}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WalletRow({
  organizationId,
  wallet,
}: {
  organizationId: string;
  wallet: TreasuryWallet;
}) {
  const updateWallet = useUpdateWallet(organizationId);
  const archiveWallet = useArchiveWallet(organizationId);
  const isManaged = wallet.kind === 'MANAGED';

  return (
    <div className='flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 p-4'>
      <div className='flex items-center gap-3'>
        <span className='bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full'>
          {isManaged ? (
            <Landmark className='text-primary h-4 w-4' />
          ) : (
            <Wallet className='text-primary h-4 w-4' />
          )}
        </span>
        <div>
          <p className='flex items-center gap-2 text-sm font-medium text-white'>
            {wallet.label}
            {wallet.isDefault && (
              <span className='rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300'>
                Default
              </span>
            )}
            {wallet.isMultisig && (
              <span className='rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300'>
                Multisig
              </span>
            )}
          </p>
          <p className='flex items-center gap-1 font-mono text-xs text-gray-400'>
            <button
              type='button'
              onClick={() => copyToClipboard(wallet.publicKey)}
              title='Copy full address'
              className='inline-flex items-center gap-1 transition-colors hover:text-gray-200'
            >
              {formatAddress(wallet.publicKey, 6)}
              <Copy className='h-3 w-3' />
            </button>
            <span>· {wallet.status.toLowerCase()}</span>
          </p>
        </div>
      </div>
      <div className='flex items-center gap-1'>
        {!wallet.isDefault && (
          <button
            type='button'
            onClick={() =>
              updateWallet.mutate({
                walletId: wallet.id,
                patch: { isDefault: true },
              })
            }
            disabled={updateWallet.isPending}
            className='rounded-lg p-2 text-gray-500 hover:text-amber-300 disabled:opacity-50'
            title='Set as default'
          >
            <Star className='h-4 w-4' />
          </button>
        )}
        <button
          type='button'
          onClick={() => archiveWallet.mutate(wallet.id)}
          disabled={archiveWallet.isPending}
          className='rounded-lg px-2 py-1 text-xs text-gray-500 hover:text-red-400 disabled:opacity-50'
        >
          Archive
        </button>
      </div>
    </div>
  );
}
