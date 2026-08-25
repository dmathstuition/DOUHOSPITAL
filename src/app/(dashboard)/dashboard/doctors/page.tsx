import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Doctors' };

export default function DoctorsAdminPage() {
  return (
    <ModulePlaceholder
      title="Doctors"
      phase="Phase 4"
      description="Doctor records, photos, specializations and weekly schedules are modelled in the doctors and doctor_schedules tables and surface on the public site."
      planned={[
        'Create / edit / deactivate doctors',
        'Photo upload (public bucket)',
        'Assign department & specialization',
        'Configure weekly schedules',
        'Different hours per day',
        'Doctors-on-duty derivation',
      ]}
    />
  );
}
