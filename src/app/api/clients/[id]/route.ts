import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO } from '@/lib/db';

// GET /api/clients/[id] - Get single client with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const health_metrics = db
      .prepare('SELECT * FROM health_metrics WHERE client_id = ? ORDER BY date DESC')
      .all(id);

    const diet_plans = db
      .prepare('SELECT * FROM diet_plans WHERE client_id = ? ORDER BY created_at DESC')
      .all(id);

    const payments = db
      .prepare('SELECT * FROM payments WHERE client_id = ? ORDER BY payment_date DESC')
      .all(id);

    const follow_ups = db
      .prepare('SELECT * FROM follow_ups WHERE client_id = ? ORDER BY follow_up_date DESC')
      .all(id);

    const totalRow = db
      .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE client_id = ?')
      .get(id) as { total: number };

    return NextResponse.json({
      ...client,
      health_metrics,
      diet_plans,
      payments,
      follow_ups,
      total_paid: totalRow.total,
    });
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update client fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'phone', 'email', 'instagram_handle', 'source', 'status', 'notes', 'custom_rate', 'payment_status'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = ?');
    values.push(nowISO());
    values.push(id);

    db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/clients/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete client (cascade deletes related records)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
