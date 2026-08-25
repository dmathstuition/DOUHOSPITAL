'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { BarChart3 } from 'lucide-react';

const TOOLTIP = {
  borderRadius: 8,
  border: '1px solid hsl(var(--border))',
  fontSize: 12,
  background: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
};

// Green-forward categorical palette for status slices.
const SLICE_COLORS = [
  'hsl(152 55% 24%)',
  'hsl(150 48% 45%)',
  'hsl(38 92% 45%)',
  'hsl(199 65% 45%)',
  'hsl(148 55% 32%)',
  'hsl(0 62% 50%)',
  'hsl(152 8% 55%)',
];

export function AppointmentsByDay({ data }: { data: { day: string; count: number }[] }) {
  const hasData = data.some((d) => d.count > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appointments this week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {!hasData ? (
            <EmptyState icon={BarChart3} title="No appointments this week" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={TOOLTIP} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBreakdown({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appointment status (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {data.length === 0 ? (
            <EmptyState icon={BarChart3} title="No appointment data" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DepartmentBreakdown({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appointments by department (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {data.length === 0 ? (
            <EmptyState icon={BarChart3} title="No appointment data" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={TOOLTIP} />
                <Bar dataKey="count" fill="hsl(150 48% 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
