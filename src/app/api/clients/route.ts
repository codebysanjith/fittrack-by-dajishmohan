import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO } from '@/lib/db';

// GET /api/clients - List all clients with optional filters
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM clients';
    const conditions: string[] = [];
    const params: string[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push(
        '(name LIKE ? OR phone LIKE ? OR email LIKE ? OR instagram_handle LIKE ?)'
      );
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const clients = db.prepare(query).all(...params);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('GET /api/clients error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = nowISO();
    const customRate = body.custom_rate !== undefined ? parseFloat(body.custom_rate) : 2500;
    const paymentStatus = body.payment_status === 'paid' ? 'paid' : 'pending';

    const stmt = db.prepare(`
      INSERT INTO clients (id, name, phone, email, instagram_handle, source, notes, custom_rate, payment_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.name,
      body.phone,
      body.email || '',
      body.instagram_handle || '',
      body.source || 'instagram_dm',
      body.notes || '',
      customRate,
      paymentStatus,
      now,
      now
    );

    // If initial follow-up specified or payment pending, auto-create follow-up
    if (body.follow_up_date) {
      const followUpId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO follow_ups (id, client_id, follow_up_date, follow_up_type, amount, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        followUpId,
        id,
        body.follow_up_date,
        body.follow_up_type || (paymentStatus === 'pending' ? 'payment_reminder' : 'check_in'),
        body.follow_up_amount !== undefined ? parseFloat(body.follow_up_amount) : customRate,
        body.follow_up_message || (paymentStatus === 'pending' ? `Fee payment reminder (₹${customRate})` : 'First check-in'),
        'pending',
        now
      );
    }

    // If marked paid upon creation, record the payment
    if (paymentStatus === 'paid' && body.record_payment) {
      const paymentId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO payments (id, client_id, amount, payment_date, payment_method, service_type, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId,
        id,
        customRate,
        now.split(' ')[0],
        body.payment_method || 'upi',
        'diet_plan',
        'Initial payment upon registration',
        now
      );
    }

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
