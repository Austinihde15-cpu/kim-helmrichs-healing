import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.formData();
    const callSid = body.get('CallSid')?.toString();
    const callStatus = body.get('CallStatus')?.toString();
    const callDuration = body.get('CallDuration')?.toString();

    if (callSid) {
      // Find the call log by twilio_call_sid and update it
      const base44 = createClientFromRequest(req);
      const logs = base44.asServiceRole.entities.CallLog;
      const results = await logs.filter({ twilio_call_sid: callSid });

      if (results && results.length > 0) {
        const log = results[0];
        let outcome = 'No Answer';
        if (callStatus === 'completed') outcome = 'Answered';
        else if (callStatus === 'busy') outcome = 'No Answer';
        else if (callStatus === 'no-answer') outcome = 'No Answer';
        else if (callStatus === 'failed') outcome = 'No Answer';

        await logs.update(log.id, {
          outcome,
          duration_seconds: callDuration ? parseInt(callDuration) : 0,
        });
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    return new Response('Error', { status: 500 });
  }
});
