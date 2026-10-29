import { NextRequest, NextResponse } from 'next/server';
import { getDb, calculateBMI, nowISO, todayISO } from '@/lib/db';

// GET /api/health-metrics - Get metrics for a client
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
    }

    const metrics = db
      .prepare('SELECT * FROM health_metrics WHERE client_id = ? ORDER BY date DESC')
      .all(clientId);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('GET /api/health-metrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch health metrics' }, { status: 500 });
  }
}

// POST /api/health-metrics - Create health metric with auto-calculated BMI
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = nowISO();

    const weightKg = body.weight_kg || null;
    const heightCm = body.height_cm || null;
    const bmi = weightKg && heightCm ? calculateBMI(weightKg, heightCm) : null;

    const stmt = db.prepare(`
      INSERT INTO health_metrics (id, client_id, date, weight_kg, height_cm, bmi, body_fat_pct, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.client_id,
      body.date || todayISO(),
      weightKg,
      heightCm,
      bmi,
      body.body_fat_pct || null,
      body.notes || '',
      now
    );

    const metric = db.prepare('SELECT * FROM health_metrics WHERE id = ?').get(id);
    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error('POST /api/health-metrics error:', error);
    return NextResponse.json({ error: 'Failed to create health metric' }, { status: 500 });
  }
}
