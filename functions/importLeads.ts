import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { leads } = body;

    if (!leads || !Array.isArray(leads)) {
      return Response.json({ error: 'leads array required' }, { status: 400 });
    }

    const leadsEntity = base44.asServiceRole.entities.Lead;
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const row of leads) {
      try {
        // Normalize phone number
        let phone = (row.phone || row.Phone || row.PHONE || '').toString().replace(/\D/g, '');
        if (phone.length === 10) phone = '+1' + phone;
        else if (phone.length === 11 && phone.startsWith('1')) phone = '+' + phone;

        if (!phone) {
          skipped++;
          continue;
        }

        await leadsEntity.create({
          first_name: row.first_name || row['First Name'] || row.FirstName || row.FIRST_NAME || '',
          last_name: row.last_name || row['Last Name'] || row.LastName || row.LAST_NAME || '',
          phone,
          address: row.address || row.Address || row.ADDRESS || '',
          city: row.city || row.City || row.CITY || '',
          state: row.state || row.State || row.STATE || '',
          zip: row.zip || row.Zip || row.ZIP || row['Zip Code'] || '',
          email: row.email || row.Email || row.EMAIL || '',
          source: row.source || row.Source || 'CSV Import',
          status: 'New',
          call_count: 0,
        });
        imported++;
      } catch (e) {
        errors.push(e.message);
        skipped++;
      }
    }

    return Response.json({ success: true, imported, skipped, errors: errors.slice(0, 5) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
