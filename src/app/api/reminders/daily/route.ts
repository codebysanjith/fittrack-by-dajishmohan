import { NextResponse } from 'next/server';
import { getDb, todayISO } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const today = todayISO();

    const pendingFollowUps = db.prepare(`
      SELECT f.*, c.name as client_name, c.phone as client_phone, c.instagram_handle as client_instagram
      FROM follow_ups f
      JOIN clients c ON f.client_id = c.id
      WHERE f.follow_up_date <= ? AND f.status = 'pending'
      ORDER BY f.follow_up_date ASC
    `).all(today) as Array<{
      id: string;
      client_name: string;
      client_phone: string;
      client_instagram: string;
      follow_up_type: string;
      follow_up_date: string;
      message: string;
    }>;

    const overdueCount = pendingFollowUps.filter((f) => f.follow_up_date < today).length;
    const todayCount = pendingFollowUps.filter((f) => f.follow_up_date === today).length;

    // Optional webhook trigger (Telegram, WhatsApp, Discord, or Zapier)
    const webhookUrl = process.env.REMINDER_WEBHOOK_URL;
    let webhookSent = false;

    if (webhookUrl && pendingFollowUps.length > 0) {
      const summaryText = `🌅 Good morning! 6:00 AM FitTrack By Dajish Mohan Digest\n\n` +
        `You have ${pendingFollowUps.length} follow-ups today (${todayCount} due today, ${overdueCount} overdue):\n\n` +
        pendingFollowUps
          .map((f, i) => `${i + 1}. ${f.client_name} (${f.follow_up_type}) - ${f.client_phone}\n   "${f.message || 'Check-in'}"`)
          .join('\n\n');

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: summaryText,
            content: summaryText,
          }),
        });
        webhookSent = true;
      } catch (err) {
        console.error('Webhook error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      today,
      total_pending: pendingFollowUps.length,
      today_due: todayCount,
      overdue: overdueCount,
      webhook_sent: webhookSent,
      follow_ups: pendingFollowUps,
    });
  } catch (error) {
    console.error('Daily reminder error:', error);
    return NextResponse.json({ error: 'Failed to generate daily reminder' }, { status: 500 });
  }
}
