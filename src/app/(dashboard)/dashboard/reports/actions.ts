'use server';

import ExcelJS from 'exceljs';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { can } from '@/lib/rbac';
import { runReport, type ReportType, type ReportFilters } from '@/lib/data/reports';
import { siteConfig } from '@/lib/config';
import type { Json } from '@/types/database';

export interface ExportResult {
  ok: boolean;
  error?: string;
  filename?: string;
  /** Base64-encoded .xlsx content. */
  base64?: string;
}

/**
 * Export a report to Excel. Authorized administrators only. The export is
 * recorded in the audit log. Standard exports contain demographics and
 * operational data — never clinical notes.
 */
export async function exportReportAction(
  type: ReportType,
  filters: ReportFilters,
): Promise<ExportResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'EXPORT_REPORTS')) {
    return { ok: false, error: 'You are not authorized to export reports.' };
  }

  try {
    const report = await runReport(type, filters);

    const wb = new ExcelJS.Workbook();
    wb.creator = siteConfig.shortName;
    wb.created = new Date();
    const ws = wb.addWorksheet(type === 'appointments' ? 'Appointments' : 'Registrations');

    // Title row
    ws.mergeCells(1, 1, 1, report.columns.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `${siteConfig.shortName} — ${report.title}`;
    titleCell.font = { bold: true, size: 13 };

    // Header row
    const header = ws.addRow(report.columns);
    header.font = { bold: true };
    header.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F2EC' } };
    });

    report.rows.forEach((r) => ws.addRow(r));
    ws.columns.forEach((col) => {
      col.width = 18;
    });

    const buffer = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `douhc-${type}-${stamp}.xlsx`;

    // Audit the export (best-effort, service role — audit_logs has no user insert policy).
    try {
      const admin = createAdminClient();
      await admin.from('audit_logs').insert({
        user_id: user.id,
        actor_role: user.role,
        action: 'export_report',
        resource: 'reports',
        resource_id: type,
        metadata: { rows: report.rows.length, filters } as unknown as Json,
      });
    } catch {
      // ignore audit failure
    }

    return { ok: true, filename, base64 };
  } catch {
    return { ok: false, error: 'Unable to generate the export.' };
  }
}
