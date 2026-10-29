import { NextRequest, NextResponse } from 'next/server';
import { getDb, nowISO } from '@/lib/db';

interface ParsedClientRow {
  name: string;
  phone: string;
  email?: string;
  instagram_handle?: string;
  source?: string;
  status?: string;
  custom_rate?: number;
  payment_status?: string;
  notes?: string;
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const contentType = request.headers.get('content-type') || '';
    let rows: ParsedClientRow[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (Array.isArray(body.clients)) {
        rows = body.clients;
      } else if (typeof body.csvText === 'string') {
        rows = parseCSVText(body.csvText);
      }
    } else {
      const text = await request.text();
      rows = parseCSVText(text);
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No valid client records found in CSV' }, { status: 400 });
    }

    const now = nowISO();
    let importedCount = 0;
    const errors: string[] = [];

    const insertStmt = db.prepare(`
      INSERT INTO clients (id, name, phone, email, instagram_handle, source, status, custom_rate, payment_status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertFollowUp = db.prepare(`
      INSERT INTO follow_ups (id, client_id, follow_up_date, follow_up_type, amount, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPayment = db.prepare(`
      INSERT INTO payments (id, client_id, amount, payment_date, payment_method, service_type, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const runTransaction = db.transaction((clientsToInsert: ParsedClientRow[]) => {
      for (let i = 0; i < clientsToInsert.length; i++) {
        const item = clientsToInsert[i];
        if (!item.name || !item.phone) {
          errors.push(`Row ${i + 1}: skipped (Name or Phone is missing)`);
          continue;
        }

        const id = crypto.randomUUID();
        let phone = String(item.phone).replace(/[^0-9+]/g, '');
        if (!phone.startsWith('+91') && !phone.startsWith('+')) {
          phone = `+91${phone.replace(/^0+/, '')}`;
        }

        let instagram = String(item.instagram_handle || '').trim();
        if (instagram && !instagram.startsWith('@')) {
          instagram = `@${instagram}`;
        }

        let source = (item.source || 'instagram_dm').toLowerCase();
        if (!['instagram_dm', 'whatsapp', 'referral', 'other'].includes(source)) {
          source = source.includes('insta') ? 'instagram_dm' : source.includes('what') ? 'whatsapp' : 'other';
        }

        let status = (item.status || 'lead').toLowerCase();
        if (!['lead', 'active', 'completed', 'inactive'].includes(status)) {
          status = 'lead';
        }

        const rate = item.custom_rate && !isNaN(Number(item.custom_rate)) ? Number(item.custom_rate) : 2500;
        let paymentStatus = (item.payment_status || '').toLowerCase();
        if (!['paid', 'pending'].includes(paymentStatus)) {
          paymentStatus = status === 'active' ? 'paid' : 'pending';
        }

        insertStmt.run(
          id,
          String(item.name).trim(),
          phone,
          String(item.email || '').trim(),
          instagram,
          source,
          status,
          rate,
          paymentStatus,
          String(item.notes || '').trim(),
          now,
          now
        );

        // If payment is pending, auto-create a fee payment follow-up
        if (paymentStatus === 'pending') {
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + 3);
          insertFollowUp.run(
            crypto.randomUUID(),
            id,
            followUpDate.toISOString().split('T')[0],
            'payment_reminder',
            rate,
            `Fee payment reminder (₹${rate})`,
            'pending',
            now
          );
        } else if (paymentStatus === 'paid') {
          // If marked paid, also log the initial payment
          insertPayment.run(
            crypto.randomUUID(),
            id,
            rate,
            now.split(' ')[0],
            'upi',
            'diet_plan',
            'Imported initial payment',
            now
          );
        }

        importedCount++;
      }
    });

    runTransaction(rows);

    return NextResponse.json({
      success: true,
      imported: importedCount,
      total_rows: rows.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Import clients error:', error);
    return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 });
  }
}

function parseCSVText(csvText: string): ParsedClientRow[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rows: ParsedClientRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    // Match potential header variations
    const name = rowObj['name'] || rowObj['clientname'] || rowObj['fullname'] || '';
    const phone = rowObj['phone'] || rowObj['phonenumber'] || rowObj['mobile'] || rowObj['contact'] || '';
    const email = rowObj['email'] || rowObj['emailaddress'] || '';
    const instagram = rowObj['instagram'] || rowObj['instagramhandle'] || rowObj['ig'] || rowObj['handle'] || '';
    const source = rowObj['source'] || rowObj['leadsource'] || '';
    const status = rowObj['status'] || '';
    const rateStr = rowObj['rate'] || rowObj['fee'] || rowObj['amount'] || rowObj['price'] || '';
    const rate = rateStr ? parseFloat(rateStr.replace(/[^0-9.]/g, '')) : 2500;
    const paymentStatus = rowObj['paymentstatus'] || rowObj['payment'] || rowObj['paidstatus'] || '';
    const notes = rowObj['notes'] || rowObj['note'] || rowObj['comments'] || '';

    if (name && phone) {
      rows.push({
        name,
        phone,
        email,
        instagram_handle: instagram,
        source,
        status,
        custom_rate: isNaN(rate) ? 2500 : rate,
        payment_status: paymentStatus,
        notes,
      });
    }
  }

  return rows;
}
