import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO, todayISO } from '@/lib/db';

// GET /api/diet-plans - Get diet plans for a client
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
    }

    const plans = db
      .prepare('SELECT * FROM diet_plans WHERE client_id = ? ORDER BY created_at DESC')
      .all(clientId);

    return NextResponse.json(plans);
  } catch (error) {
    console.error('GET /api/diet-plans error:', error);
    return NextResponse.json({ error: 'Failed to fetch diet plans' }, { status: 500 });
  }
}

// POST /api/diet-plans - Create diet plan
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = nowISO();

    const stmt = db.prepare(`
      INSERT INTO diet_plans (id, client_id, plan_name, start_date, end_date, plan_details, changes_log, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.client_id,
      body.plan_name,
      body.start_date || todayISO(),
      body.end_date || '',
      body.plan_details ? JSON.stringify(body.plan_details) : '{}',
      '[]',
      body.status || 'active',
      now,
      now
    );

    const plan = db.prepare('SELECT * FROM diet_plans WHERE id = ?').get(id);
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('POST /api/diet-plans error:', error);
    return NextResponse.json({ error: 'Failed to create diet plan' }, { status: 500 });
  }
}
