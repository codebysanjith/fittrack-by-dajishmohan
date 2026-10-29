import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO } from '@/lib/db';
import { DietPlan } from '@/lib/types';

// GET /api/diet-plans/[id] - Get single diet plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const plan = db.prepare('SELECT * FROM diet_plans WHERE id = ?').get(id);
    if (!plan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('GET /api/diet-plans/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch diet plan' }, { status: 500 });
  }
}

// PUT /api/diet-plans/[id] - Update diet plan, auto-log changes to plan_details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const existing = db.prepare('SELECT * FROM diet_plans WHERE id = ?').get(id) as DietPlan | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    const now = nowISO();

    // If plan_details is changing, auto-append to changes_log
    let changesLog: Array<{ timestamp: string; previous: string; updated: string }> = [];
    try {
      changesLog = JSON.parse(existing.changes_log || '[]');
    } catch {
      changesLog = [];
    }

    if (body.plan_details !== undefined) {
      const newDetails = typeof body.plan_details === 'string'
        ? body.plan_details
        : JSON.stringify(body.plan_details);

      if (newDetails !== existing.plan_details) {
        changesLog.push({
          timestamp: now,
          previous: existing.plan_details,
          updated: newDetails,
        });
      }
    }

    const allowedFields = ['plan_name', 'start_date', 'end_date', 'plan_details', 'status'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === 'plan_details') {
          values.push(
            typeof body[field] === 'string' ? body[field] : JSON.stringify(body[field])
          );
        } else {
          values.push(body[field]);
        }
      }
    }

    // Always update changes_log and updated_at
    updates.push('changes_log = ?');
    values.push(JSON.stringify(changesLog));
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE diet_plans SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM diet_plans WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/diet-plans/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update diet plan' }, { status: 500 });
  }
}

// DELETE /api/diet-plans/[id] - Delete diet plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const plan = db.prepare('SELECT * FROM diet_plans WHERE id = ?').get(id);
    if (!plan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM diet_plans WHERE id = ?').run(id);
    return NextResponse.json({ message: 'Diet plan deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/diet-plans/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete diet plan' }, { status: 500 });
  }
}
