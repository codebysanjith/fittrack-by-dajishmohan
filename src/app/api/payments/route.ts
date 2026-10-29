import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO, todayISO } from '@/lib/db';
import { Client, Payment } from '@/lib/types';

// GET /api/payments - Get payments with optional filters and summary mode
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const summary = searchParams.get('summary');

    // Summary mode: return earnings breakdown
    if (summary === 'true') {
      const today = todayISO();
      const thisMonthStart = today.substring(0, 7) + '-01';
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonthStart = lastMonthDate.toISOString().substring(0, 7) + '-01';
      const lastMonthEnd = thisMonthStart;

      const totalRow = db
        .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments')
        .get() as { total: number };

      const thisMonthRow = db
        .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date >= ?')
        .get(thisMonthStart) as { total: number };

      const lastMonthRow = db
        .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date >= ? AND payment_date < ?')
        .get(lastMonthStart, lastMonthEnd) as { total: number };

      const byService = db
        .prepare('SELECT service_type, COALESCE(SUM(amount), 0) as total FROM payments GROUP BY service_type')
        .all();

      const byMonth = db
        .prepare(`
          SELECT strftime('%Y-%m', payment_date) as month, COALESCE(SUM(amount), 0) as total
          FROM payments
          WHERE payment_date >= date('now', '-12 months')
          GROUP BY strftime('%Y-%m', payment_date)
          ORDER BY month DESC
        `)
        .all();

      const recentPayments = db
        .prepare(`
          SELECT p.*, c.name as client_name
          FROM payments p
          JOIN clients c ON p.client_id = c.id
          ORDER BY p.payment_date DESC
          LIMIT 10
        `)
        .all();

      const pendingRow = db
        .prepare("SELECT COALESCE(SUM(custom_rate), 0) as total, COUNT(*) as count FROM clients WHERE payment_status = 'pending'")
        .get() as { total: number; count: number };

      const pendingClients = db
        .prepare("SELECT id, name, phone, instagram_handle, custom_rate, created_at FROM clients WHERE payment_status = 'pending' ORDER BY created_at DESC")
        .all();

      return NextResponse.json({
        total: totalRow.total,
        this_month: thisMonthRow.total,
        last_month: lastMonthRow.total,
        pending_total: pendingRow.total,
        pending_count: pendingRow.count,
        pending_clients: pendingClients,
        by_service: byService,
        by_month: byMonth,
        recent_payments: recentPayments,
      });
    }

    // Regular mode: list payments
    let query = 'SELECT * FROM payments';
    const params: string[] = [];

    if (clientId) {
      query += ' WHERE client_id = ?';
      params.push(clientId);
    }

    query += ' ORDER BY payment_date DESC';

    const payments = db.prepare(query).all(...params);
    return NextResponse.json(payments);
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/payments - Create payment with auto side-effects
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = nowISO();
    const today = todayISO();

    const stmt = db.prepare(`
      INSERT INTO payments (id, client_id, amount, payment_date, payment_method, service_type, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.client_id,
      body.amount ?? 2500,
      body.payment_date || today,
      body.payment_method || 'upi',
      body.service_type || 'diet_plan',
      body.notes || '',
      now
    );

    // Auto-update client payment status to 'paid' and status from 'lead' to 'active'
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(body.client_id) as Client | undefined;
    if (client) {
      const newStatus = client.status === 'lead' ? 'active' : client.status;
      db.prepare('UPDATE clients SET payment_status = ?, status = ?, updated_at = ? WHERE id = ?')
        .run('paid', newStatus, now, body.client_id);
    }

    // Auto-create a follow-up 7 days later
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7);
    const followUpId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO follow_ups (id, client_id, follow_up_date, follow_up_type, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      followUpId,
      body.client_id,
      followUpDate.toISOString().split('T')[0],
      'check_in',
      'Auto-created follow-up after payment',
      'pending',
      now
    );

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
