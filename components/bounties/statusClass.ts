/**
 * Badge styling for the bounty lifecycle status (lowercase, per the API DTOs).
 * Shared by the marketplace card and the organizer management dashboard so
 * both surfaces render the same color for the same status.
 */
const STATUS_CLASS: Record<string, string> = {
  open: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  in_progress: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  ready_to_shortlist: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  submitted: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  under_review: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  completed: 'border-primary/30 bg-primary/10 text-primary',
  cancelled: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
  disputed: 'border-red-500/30 bg-red-500/10 text-red-400',
};

export function bountyStatusClass(status: string): string {
  return STATUS_CLASS[status] ?? 'border-zinc-700 bg-zinc-800/60 text-zinc-300';
}
