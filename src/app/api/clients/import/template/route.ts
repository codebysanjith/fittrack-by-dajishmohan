import { NextResponse } from 'next/server';

export async function GET() {
  const sampleCsv = [
    'Name,Phone,Email,Instagram,Source,Status,Rate,PaymentStatus,Notes',
    'Rahul Kumar,+919876543210,rahul@example.com,@rahul_fit,instagram_dm,active,2500,paid,Target weight loss 8kg',
    'Sneha Patel,+919812345678,sneha@example.com,@sneha_wellness,whatsapp,lead,3000,pending,Interested in vegetarian diet plan',
    'Vikram Singh,+919765432100,,@vikram_lift,instagram_dm,lead,2500,pending,Wants muscle gain diet plan',
    'Ananya Rao,+919833445566,ananya@example.com,,referral,active,4000,paid,Personal training + diet plan bundle',
  ].join('\n');

  return new NextResponse(sampleCsv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fittrack_client_import_template.csv"',
    },
  });
}
