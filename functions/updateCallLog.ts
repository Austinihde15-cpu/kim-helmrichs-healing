import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { log_id, lead_id, outcome, notes, follow_up_date, duration_seconds } = body;

    if (!log_id || !lead_id) {
      return Response.json({ error: 'log_id and lead_id required' }, { status: 400 });
    }

    const logs = base44.asServiceRole.entities.CallLog;
    const leads = base44.asServiceRole.entities.Lead;

    // Update call log
    await logs.update(log_id, {
      outcome,
      notes,
      follow_up_date,
      duration_seconds,
    });

    // Update lead status and follow-up
    const updateData: any = { status: outcome };
    if (follow_up_date) updateData.follow_up_date = follow_up_date;
    if (notes) updateData.notes = notes;

    await leads.update(lead_id, updateData);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
