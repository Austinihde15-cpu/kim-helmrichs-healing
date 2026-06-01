import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { to, lead_id, lead_name } = body;

    if (!to) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    // Create a TwiML URL for the call - simple dial through
    const twimlUrl = `https://superagent-f986b605.base44.app/functions/twiml`;

    const params = new URLSearchParams({
      To: to,
      From: fromNumber,
      Url: twimlUrl,
      StatusCallback: `https://superagent-f986b605.base44.app/functions/callStatus`,
      StatusCallbackMethod: 'POST',
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.message || 'Twilio error' }, { status: 400 });
    }

    // Update lead last_called and call_count
    if (lead_id) {
      const leads = base44.asServiceRole.entities.Lead;
      const lead = await leads.get(lead_id);
      if (lead) {
        await leads.update(lead_id, {
          last_called: new Date().toISOString(),
          call_count: (lead.call_count || 0) + 1,
          status: lead.status === 'New' ? 'No Answer' : lead.status,
        });
      }

      // Create call log
      await base44.asServiceRole.entities.CallLog.create({
        lead_id,
        lead_name: lead_name || '',
        phone: to,
        outcome: 'No Answer',
        twilio_call_sid: data.sid,
      });
    }

    return Response.json({ success: true, call_sid: data.sid, status: data.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
