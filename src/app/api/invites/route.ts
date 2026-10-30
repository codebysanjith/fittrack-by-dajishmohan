import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO } from '@/lib/db';
import crypto from 'crypto';

// GET /api/invites - List recent invite tokens
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const invites = db
      .prepare(`
        SELECT i.*, c.name as used_by_client_name
        FROM invite_tokens i
        LEFT JOIN clients c ON i.used_by_client_id = c.id
        ORDER BY i.created_at DESC
        LIMIT 50
      `)
      .all();

    return NextResponse.json(invites);
  } catch (error) {
    console.error('GET /api/invites error:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}

// POST /api/invites - Generate a new single-use intake invite token
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json().catch(() => ({}));

    const id = crypto.randomUUID();
    // Generate secure random short token (e.g. fit_a8f92b7c4d1e)
    const randomHex = crypto.randomBytes(6).toString('hex');
    const token = `fit_${randomHex}`;
    const now = nowISO();

    const clientName = (body.client_name || '').trim();
    const customRate = body.custom_rate !== undefined ? parseFloat(body.custom_rate) : 2500;
    const expiryDays = body.expires_in_days ? parseInt(body.expires_in_days) : 7;

    // Calculate expiry ISO
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    const expiresAt = expiryDate.toISOString().replace('T', ' ').split('.')[0];

    db.prepare(`
      INSERT INTO invite_tokens (id, token, client_name, custom_rate, status, created_at, expires_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `).run(id, token, clientName, customRate, now, expiresAt);

    const invite = db.prepare('SELECT * FROM invite_tokens WHERE id = ?').get(id);

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error('POST /api/invites error:', error);
    return NextResponse.json({ error: 'Failed to create invite token' }, { status: 500 });
  }
}
