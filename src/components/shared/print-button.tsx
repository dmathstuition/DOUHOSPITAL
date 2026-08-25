'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Triggers the browser print dialog. Hidden when printing via `print:hidden`. */
export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
      <Printer /> {label}
    </Button>
  );
}
