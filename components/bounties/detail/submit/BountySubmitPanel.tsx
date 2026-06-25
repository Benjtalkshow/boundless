'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Send,
  Wallet,
} from 'lucide-react';

import { BoundlessButton } from '@/components/buttons';
import { Input } from '@/components/ui/input';
import { useWalletContext } from '@/components/providers/wallet-provider';
import {
  useSubmitBounty,
  useWithdrawSubmission,
  type BountyPublic,
  type MyBountyApplication,
  type EscrowRunPhase,
} from '@/features/bounties';

/** Statuses where a builder is entitled to submit work. */
function canSubmit(
  bounty: BountyPublic,
  app: MyBountyApplication | null
): boolean {
  if (!app) return false;
  const withdrawn =
    app.applicationStatus === 'WITHDRAWN' || app.status === 'withdrawn';
  if (withdrawn) return false;
  const isApplication =
    bounty.entryType === 'APPLICATION_LIGHT' ||
    bounty.entryType === 'APPLICATION_FULL';
  if (isApplication) {
    return (
      app.applicationStatus === 'SELECTED' ||
      app.applicationStatus === 'SHORTLISTED'
    );
  }
  // Open single claim / competition: claimed or joined (escrow active).
  return app.status === 'active' || app.applicationStatus === 'SELECTED';
}

const PHASE_LABEL: Record<EscrowRunPhase, string> = {
  idle: '',
  starting: 'Preparing submission…',
  signing: 'Signing…',
  submitting: 'Submitting…',
  polling: 'Anchoring on-chain…',
  completed: 'Confirmed',
  failed: 'Failed',
};

const isUrl = (s: string): boolean => {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
};

export default function BountySubmitPanel({
  bounty,
  myApplication,
}: {
  bounty: BountyPublic;
  myApplication: MyBountyApplication | null;
}) {
  const { walletAddress } = useWalletContext();
  const submit = useSubmitBounty(bounty.id);
  const withdraw = useWithdrawSubmission(bounty.id);

  const [contentUri, setContentUri] = useState('');
  const [touched, setTouched] = useState(false);
  // Session-local: persistent submission state needs the #332 my-submission
  // read (deferred until that backend endpoint is in the schema).
  const [submitted, setSubmitted] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  useEffect(() => {
    if (submit.isCompleted) {
      toast.success('Work submitted and anchored on-chain.');
      setSubmitted(true);
    } else if (submit.isFailed) {
      toast.error(submit.error || 'Submission failed.');
    }
  }, [submit.isCompleted, submit.isFailed, submit.error]);

  useEffect(() => {
    if (withdraw.isCompleted) {
      toast.success('Submission withdrawn.');
      setSubmitted(false);
      setConfirmWithdraw(false);
    } else if (withdraw.isFailed) {
      toast.error(withdraw.error || 'Withdraw failed.');
    }
  }, [withdraw.isCompleted, withdraw.isFailed, withdraw.error]);

  if (!canSubmit(bounty, myApplication)) return null;

  const urlValid = isUrl(contentUri.trim());

  const handleSubmit = () => {
    if (!walletAddress) return toast.error('Connect a wallet to submit.');
    if (!urlValid) {
      setTouched(true);
      return;
    }
    void submit.run({
      applicantAddress: walletAddress,
      contentUri: contentUri.trim(),
    });
  };

  const handleWithdraw = () => {
    if (!walletAddress) return toast.error('Connect a wallet to withdraw.');
    void withdraw.run({ applicantAddress: walletAddress });
  };

  return (
    <div className='rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5'>
      <h3 className='mb-1 flex items-center gap-2 text-sm font-semibold text-white'>
        <Send className='text-primary h-4 w-4' />
        Submit your work
      </h3>

      {!walletAddress ? (
        <p className='mt-2 flex items-center gap-2 text-xs text-zinc-400'>
          <Wallet className='h-3.5 w-3.5' />
          Connect a wallet to submit.
        </p>
      ) : submitted ? (
        // Submitted — show confirmation + withdraw.
        <div className='mt-3 space-y-3'>
          <div className='flex items-center gap-2 text-sm text-zinc-200'>
            <CheckCircle2 className='text-primary h-4 w-4' />
            Work submitted
          </div>
          {submit.txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${submit.txHash}`}
              target='_blank'
              rel='noreferrer'
              className='text-primary inline-flex items-center gap-1 text-xs hover:underline'
            >
              View transaction
              <ExternalLink className='h-3 w-3' />
            </a>
          )}
          {confirmWithdraw ? (
            <div className='flex gap-2'>
              <BoundlessButton
                variant='outline'
                className='flex-1'
                onClick={() => setConfirmWithdraw(false)}
                disabled={withdraw.isRunning}
              >
                Cancel
              </BoundlessButton>
              <BoundlessButton
                className='flex-1 bg-red-500 text-white hover:bg-red-600'
                onClick={handleWithdraw}
                disabled={withdraw.isRunning}
              >
                {withdraw.isRunning ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Confirm'
                )}
              </BoundlessButton>
            </div>
          ) : (
            <BoundlessButton
              variant='outline'
              className='w-full text-red-400 hover:bg-red-500/10 hover:text-red-300'
              onClick={() => setConfirmWithdraw(true)}
            >
              Withdraw submission
            </BoundlessButton>
          )}
        </div>
      ) : (
        // Submit form.
        <div className='mt-3 space-y-3'>
          <p className='text-xs text-zinc-500'>
            Link your deliverable — a pull request, repo, writeup, or demo.
          </p>
          <Input
            type='url'
            placeholder='https://github.com/org/repo/pull/123'
            value={contentUri}
            onChange={e => setContentUri(e.target.value)}
            disabled={submit.isRunning}
            className='h-10 border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600'
          />
          {touched && !urlValid && (
            <p className='text-xs text-red-500'>Enter a valid URL.</p>
          )}

          {submit.isRunning ? (
            <div className='flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-300'>
              <Loader2 className='text-primary h-4 w-4 animate-spin' />
              {PHASE_LABEL[submit.phase] || 'Working…'}
            </div>
          ) : (
            <BoundlessButton
              className='w-full'
              onClick={handleSubmit}
              disabled={!contentUri.trim()}
            >
              Submit work
            </BoundlessButton>
          )}
        </div>
      )}
    </div>
  );
}
