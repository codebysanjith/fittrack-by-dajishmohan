import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const name = (body.name || '').trim();
    const phone = (body.phone || '').trim();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and Phone number are required' },
        { status: 400 }
      );
    }

    const clientId = crypto.randomUUID();
    const now = nowISO();
    const today = now.split(' ')[0];

    // Clean up Instagram handle
    let igHandle = (body.instagram_handle || '').trim();
    if (igHandle && !igHandle.startsWith('@')) {
      igHandle = `@${igHandle}`;
    }

    // Determine source
    let source: 'instagram_dm' | 'whatsapp' | 'referral' | 'other' = 'whatsapp';
    if (body.source === 'instagram_dm' || igHandle) {
      source = 'instagram_dm';
    } else if (body.source === 'referral') {
      source = 'referral';
    } else if (body.source === 'other') {
      source = 'other';
    }

    // Compile comprehensive intake assessment notes
    const noteLines: string[] = [
      '📋 [CLIENT INTAKE FORM SUBMISSION]',
      `• Submitted: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}`,
    ];

    if (body.fitness_goal) {
      noteLines.push(`• Primary Goal: ${body.fitness_goal}`);
    }
    if (body.goal_details) {
      noteLines.push(`• Goal Details: ${body.goal_details}`);
    }
    if (body.target_weight_kg) {
      noteLines.push(`• Target Weight: ${body.target_weight_kg} kg`);
    }
    if (body.age || body.gender) {
      noteLines.push(`• Age / Gender: ${body.age ? body.age + ' yrs' : '-'} / ${body.gender || '-'}`);
    }
    if (body.diet_type) {
      noteLines.push(`• Diet Preference: ${body.diet_type}`);
    }
    if (body.meals_per_day) {
      noteLines.push(`• Meals Per Day: ${body.meals_per_day}`);
    }
    if (body.activity_level) {
      noteLines.push(`• Activity Level: ${body.activity_level}`);
    }
    if (body.allergies_dislikes) {
      noteLines.push(`• Allergies / Dislikes: ${body.allergies_dislikes}`);
    }
    if (body.medical_conditions) {
      noteLines.push(`• Medical / Injuries: ${body.medical_conditions}`);
    }
    if (body.additional_notes) {
      noteLines.push(`• Extra Notes: ${body.additional_notes}`);
    }

    const notes = noteLines.join('\n');
    const customRate = 2500; // Base standard rate

    // Insert client into database
    const insertClient = db.prepare(`
      INSERT INTO clients (
        id, name, phone, email, instagram_handle, source,
        status, custom_rate, payment_status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertClient.run(
      clientId,
      name,
      phone,
      (body.email || '').trim(),
      igHandle,
      source,
      'lead',
      customRate,
      'pending',
      notes,
      now,
      now
    );

    // If weight and height provided, insert health metrics & calculate BMI
    const weight = body.weight_kg ? parseFloat(body.weight_kg) : null;
    const height = body.height_cm ? parseFloat(body.height_cm) : null;
    let bmi: number | null = null;

    if (weight && height && height > 0) {
      bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
      const metricId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO health_metrics (id, client_id, date, weight_kg, height_cm, bmi, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        metricId,
        clientId,
        today,
        weight,
        height,
        bmi,
        'Initial assessment from client intake form',
        now
      );
    }

    // Auto-create a pending follow-up task for Dajish Mohan to review and message the client
    const followUpId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO follow_ups (
        id, client_id, follow_up_date, follow_up_type, amount, message, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      followUpId,
      clientId,
      today,
      'check_in',
      customRate,
      `✨ New intake submission from ${name}! Review health metrics and send customized diet plan.`,
      'pending',
      now
    );

    return NextResponse.json({
      success: true,
      client_id: clientId,
      name,
      phone,
      instagram_handle: igHandle,
      message: 'Intake form submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/onboard error:', error);
    return NextResponse.json(
      { error: 'Failed to process intake form submission' },
      { status: 500 }
    );
  }
}
