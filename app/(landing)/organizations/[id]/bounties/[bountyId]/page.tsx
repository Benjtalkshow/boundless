import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadata';
import BountyManagementDashboard from '@/components/organization/bounties/manage/BountyManagementDashboard';

export const metadata: Metadata = generatePageMetadata('bounties');

export default function BountyManagePageRoute() {
  return (
    <div className='relative mx-auto min-h-screen max-w-[1440px] px-5 py-8 md:px-[50px] lg:px-[100px]'>
      <BountyManagementDashboard />
    </div>
  );
}
