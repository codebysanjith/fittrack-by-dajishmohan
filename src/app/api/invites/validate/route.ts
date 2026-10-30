import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO } from '@/lib/db';

// GET /api/invites/validate?token=... - Check if an invite token is valid and unused
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        valid: false,
        reason: 'missing',
        message: 'No invitation token was provided.',
      }, { status: 400 });
    }

    const invite = db
      .prepare('SELECT * FROM invite_tokens WHERE token = ?')
      .get(token) as {
        id: string;
        token: string;
        client_name: string;
        custom_rate: number;
        status: string;
        expires_at: string;
        used_at: string;
      } | undefined;

    if (!invite) {
      return NextResponse.json({
        valid: false,
        reason: 'not_found',
        message: 'This invite link does not exist or is invalid.',
      }, { status: 404 });
    }

    if (invite.status === 'used') {
      return NextResponse.json({
        valid: false,
        reason: 'already_used',
        message: 'This invitation link has already been used and is now expired. Each invite link is single-use.',
      }, { status: 410 });
    }

    // Check expiration if set
    if (invite.expires_at) {
      const now = new Date();
      const exp = new Date(invite.expires_at);
      if (now > exp) {
        // Mark as expired
        db.prepare("UPDATE invite_tokens SET status = 'expired' WHERE id = ?").run(invite.id);
        return NextResponse.json({
          valid: false,
          reason: 'expired',
          message: 'This invitation link has expired. Please request a new invite link from Coach Dajish Mohan.',
        }, { status: 410 });
      }
    }

    return NextResponse.json({
      valid: true,
      token: invite.token,
      client_name: invite.client_name,
      custom_rate: invite.custom_rate,
      expires_at: invite.expires_at,
    });
  } catch (error) {
    console.error('GET /api/invites/validate error:', error);
    return NextResponse.json({ error: 'Failed to validate invite' }, { status: 500 });
  }
}
