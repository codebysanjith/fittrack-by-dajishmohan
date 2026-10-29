import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO, todayISO } from '@/lib/db';
import { FollowUp } from '@/lib/types';

// GET /api/follow-ups - Get follow-ups with filters, always joined with client info
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const clientId = searchParams.get('client_id');

    let query = `
      SELECT f.*, c.name as client_name, c.phone as client_phone, c.instagram_handle as client_instagram,
             c.source as client_source, c.custom_rate, c.payment_status
      FROM follow_ups f
      JOIN clients c ON f.client_id = c.id
    `;
    const conditions: string[] = [];
    const params: string[] = [];

    if (status) {
      conditions.push('f.status = ?');
      params.push(status);
    }

    if (date === 'today') {
      const today = todayISO();
      // Today's follow-ups AND overdue ones (past dates that are still pending)
      conditions.push('(f.follow_up_date <= ? AND f.status = ?)');
      params.push(today, 'pending');
    }

    if (clientId) {
      conditions.push('f.client_id = ?');
      params.push(clientId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY f.follow_up_date ASC';

    const followUps = db.prepare(query).all(...params);
    return NextResponse.json(followUps);
  } catch (error) {
    console.error('GET /api/follow-ups error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

// POST /api/follow-ups - Create a follow-up
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = nowISO();

    const amount = body.amount !== undefined && body.amount !== '' ? parseFloat(body.amount) : null;

    const stmt = db.prepare(`
      INSERT INTO follow_ups (id, client_id, follow_up_date, follow_up_type, amount, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.client_id,
      body.follow_up_date,
      body.follow_up_type || 'check_in',
      amount,
      body.message || '',
      body.status || 'pending',
      now
    );

    const followUp = db.prepare(`
      SELECT f.*, c.name as client_name, c.phone as client_phone, c.instagram_handle as client_instagram,
             c.source as client_source, c.custom_rate, c.payment_status
      FROM follow_ups f
      JOIN clients c ON f.client_id = c.id
      WHERE f.id = ?
    `).get(id);

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error('POST /api/follow-ups error:', error);
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
  }
}

// PUT /api/follow-ups - Update a follow-up (mark as done/skipped)
export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = db.prepare('SELECT * FROM follow_ups WHERE id = ?').get(body.id) as FollowUp | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    const now = nowISO();
    const allowedFields = ['follow_up_date', 'follow_up_type', 'message', 'amount', 'status'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    // Auto-set completed_at when marking as done or skipped
    if (body.status === 'done' || body.status === 'skipped') {
      updates.push('completed_at = ?');
      values.push(now);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(body.id);
    db.prepare(`UPDATE follow_ups SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare(`
      SELECT f.*, c.name as client_name, c.phone as client_phone, c.instagram_handle as client_instagram,
             c.source as client_source, c.custom_rate, c.payment_status
      FROM follow_ups f
      JOIN clients c ON f.client_id = c.id
      WHERE f.id = ?
    `).get(body.id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/follow-ups error:', error);
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
  }
}
