import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO, todayISO, calculateBMI } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    let clientId = body.client_id;
    const clientName = (body.client_name || '').trim();
    const clientPhone = (body.client_phone || '').trim();
    const weightKg = body.weight_kg ? parseFloat(body.weight_kg) : null;
    const heightCm = body.height_cm ? parseFloat(body.height_cm) : null;
    const now = nowISO();
    const today = todayISO();

    if (!clientId && clientName) {
      // Check if client exists by name
      const existing = db
        .prepare('SELECT id FROM clients WHERE LOWER(name) = LOWER(?) LIMIT 1')
        .get(clientName) as { id: string } | undefined;
      if (existing) {
        clientId = existing.id;
      } else {
        // Create new client
        clientId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO clients (id, name, phone, source, status, custom_rate, payment_status, notes, created_at, updated_at)
          VALUES (?, ?, ?, 'whatsapp', 'active', 2500, 'paid', ?, ?, ?)
        `).run(
          clientId,
          clientName,
          clientPhone,
          `Created via Diet Studio\nTarget: ${body.target_weight || '-'} kg in ${body.time_frame_days || '-'} days\nMedical: ${body.medical_condition || 'None'}`,
          now,
          now
        );
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID or Name is required' }, { status: 400 });
    }

    // 1. Update client profile fields
    const noteSummary = [
      `📋 [DIET STUDIO PROFILE SYNC]`,
      `• Target Weight: ${body.target_weight || '-'} kg in ${body.time_frame_days || '-'} Days`,
      `• Physical Activity: ${body.activity_type || 'gym'} (${body.activity_level || 'Moderate'})`,
      `• Medical Condition: ${body.medical_condition || 'None'}`,
      `• Target Calories: ${body.stats?.totalCal || '-'} kcal (P: ${body.stats?.protGrams || '-'}g, C: ${body.stats?.carbGrams || '-'}g, F: ${body.stats?.fatGrams || '-'}g)`,
    ].join('\n');

    db.prepare(`
      UPDATE clients
      SET name = COALESCE(NULLIF(?, ''), name),
          phone = COALESCE(NULLIF(?, ''), phone),
          notes = ?,
          updated_at = ?
      WHERE id = ?
    `).run(clientName, clientPhone, noteSummary, now, clientId);

    // 2. Insert or update health metrics if weight or height provided
    if (weightKg && heightCm && heightCm > 0) {
      const bmi = calculateBMI(weightKg, heightCm);
      // Check if there is already a metric for today
      const todayMetric = db
        .prepare('SELECT id FROM health_metrics WHERE client_id = ? AND date = ?')
        .get(clientId, today) as { id: string } | undefined;

      if (todayMetric) {
        db.prepare(`
          UPDATE health_metrics
          SET weight_kg = ?, height_cm = ?, bmi = ?, notes = ?
          WHERE id = ?
        `).run(weightKg, heightCm, bmi, 'Updated from Diet Studio', todayMetric.id);
      } else {
        const metricId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO health_metrics (id, client_id, date, weight_kg, height_cm, bmi, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(metricId, clientId, today, weightKg, heightCm, bmi, 'Recorded from Diet Studio', now);
      }
    }

    // 3. Save or update Diet Plan
    const planName = body.plan_name || `Personalized Diet Plan (${body.stats?.totalCal || 1568} kcal)`;
    const planDetails = {
      profile: {
        name: clientName,
        age: body.age,
        sex: body.sex,
        height_cm: heightCm,
        weight_kg: weightKg,
        activity_level: body.activity_level,
        activity_factor: body.activity_factor,
        activity_type: body.activity_type,
        medical_condition: body.medical_condition,
        target_weight: body.target_weight,
        time_frame_days: body.time_frame_days,
      },
      stats: body.stats,
      meals: body.meals,
      instructions: body.instructions,
      quote: body.quote,
      updated_at: now,
    };

    const planJson = JSON.stringify(planDetails);

    // Check if an active plan exists for this client
    const existingPlan = db
      .prepare("SELECT id, plan_details, changes_log FROM diet_plans WHERE client_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1")
      .get(clientId) as { id: string; plan_details: string; changes_log: string } | undefined;

    let planId: string;
    if (existingPlan) {
      planId = existingPlan.id;
      let logs = [];
      try {
        logs = JSON.parse(existingPlan.changes_log || '[]');
      } catch {}
      logs.push({
        timestamp: now,
        note: `Updated calories to ${body.stats?.totalCal || 0} kcal`,
      });

      db.prepare(`
        UPDATE diet_plans
        SET plan_name = ?, plan_details = ?, changes_log = ?, updated_at = ?
        WHERE id = ?
      `).run(planName, planJson, JSON.stringify(logs), now, planId);
    } else {
      planId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO diet_plans (id, client_id, plan_name, start_date, plan_details, changes_log, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, '[]', 'active', ?, ?)
      `).run(planId, clientId, planName, today, planJson, now, now);
    }

    return NextResponse.json({
      success: true,
      client_id: clientId,
      plan_id: planId,
      message: `Changes saved to ${clientName}'s profile and active diet plan! ✓`,
    });
  } catch (error) {
    console.error('POST /api/diet-studio/save error:', error);
    return NextResponse.json(
      { error: 'Failed to save changes to client profile' },
      { status: 500 }
    );
  }
}
