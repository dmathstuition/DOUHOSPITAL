'use client';

import { useState, useTransition } from 'react';
import { Search, Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { searchPatientsAction } from '@/app/(dashboard)/patients/actions';

export interface PickedPatient {
  id: string;
  name: string;
  code: string;
  matric: string | null;
}

/** Reusable staff patient search-and-select. Calls back when one is chosen. */
export function PatientPicker({
  selected,
  onSelect,
  onClear,
}: {
  selected: PickedPatient | null;
  onSelect: (p: PickedPatient) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedPatient[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(async () => {
      setResults(await searchPatientsAction(query.trim()));
      setSearched(true);
    });
  }

  if (selected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {selected.code}
                {selected.matric ? ` · ${selected.matric}` : ''}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Change
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient by name, matric, phone or ID"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : 'Search'}
        </Button>
      </form>

      {searched && results.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No patients found.</p>
      )}

      <div className="mt-3 grid gap-2">
        {results.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            className="h-auto justify-start py-3"
            onClick={() => onSelect(p)}
          >
            <span className="text-left">
              <span className="block font-medium">{p.name}</span>
              <span className="block text-xs text-muted-foreground">
                {p.code}
                {p.matric ? ` · ${p.matric}` : ''}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
