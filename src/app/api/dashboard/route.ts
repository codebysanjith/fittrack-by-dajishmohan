import { NextResponse } from 'next/server';
import { getDb, todayISO } from '@/lib/db';

// GET /api/dashboard - Return dashboard stats
export async function GET() {
  try {
    const db = getDb();
    const today = todayISO();
    const thisMonthStart = today.substring(0, 7) + '-01';

    // Client counts
    const totalClients = (db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number }).count;
    const activeClients = (db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'active'").get() as { count: number }).count;
    const leads = (db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'lead'").get() as { count: number }).count;

    // Earnings
    const thisMonthEarnings = (db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date >= ?'
    ).get(thisMonthStart) as { total: number }).total;

    const totalEarnings = (db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
    ).get() as { total: number }).total;

    // Follow-up counts
    const pendingFollowUps = (db.prepare(
      "SELECT COUNT(*) as count FROM follow_ups WHERE status = 'pending'"
    ).get() as { count: number }).count;

    const overdueFollowUps = (db.prepare(
      "SELECT COUNT(*) as count FROM follow_ups WHERE follow_up_date < ? AND status = 'pending'"
    ).get(today) as { count: number }).count;

    // Today's follow-ups (including overdue) with client info
    const todaysFollowUps = db.prepare(`
      SELECT f.*, c.name as client_name, c.phone as client_phone, c.instagram_handle as client_instagram,
             c.source as client_source, c.custom_rate, c.payment_status
      FROM follow_ups f
      JOIN clients c ON f.client_id = c.id
      WHERE f.follow_up_date <= ? AND f.status = 'pending'
      ORDER BY f.follow_up_date ASC
    `).all(today);

    // Recent 5 leads
    const recentLeads = db.prepare(`
      SELECT * FROM clients
      WHERE status = 'lead'
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return NextResponse.json({
      stats: {
        total_clients: totalClients,
        active_clients: activeClients,
        leads,
        this_month_earnings: thisMonthEarnings,
        total_earnings: totalEarnings,
        pending_follow_ups: pendingFollowUps,
        overdue_follow_ups: overdueFollowUps,
      },
      today_follow_ups: todaysFollowUps,
      recent_leads: recentLeads,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
