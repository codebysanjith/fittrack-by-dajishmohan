import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        c.name,
        c.phone,
        c.email,
        c.instagram_handle,
        c.source,
        c.status,
        COALESCE(SUM(p.amount), 0) as total_paid,
        c.created_at,
        c.notes
      FROM clients c
      LEFT JOIN payments p ON c.id = p.client_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all() as Array<{
      name: string;
      phone: string;
      email: string;
      instagram_handle: string;
      source: string;
      status: string;
      total_paid: number;
      created_at: string;
      notes: string;
    }>;

    const headers = ['Name', 'Phone', 'Email', 'Instagram', 'Source', 'Status', 'Total Paid (INR)', 'Joined Date', 'Notes'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const escape = (str: string | number | null | undefined) => {
        const val = String(str ?? '').replace(/"/g, '""');
        return `"${val}"`;
      };

      csvLines.push([
        escape(r.name),
        escape(r.phone),
        escape(r.email),
        escape(r.instagram_handle),
        escape(r.source),
        escape(r.status),
        escape(r.total_paid),
        escape(r.created_at),
        escape(r.notes),
      ].join(','));
    }

    const csvContent = csvLines.join('\n');
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fittrack_clients_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: 'Failed to export clients' }, { status: 500 });
  }
}
