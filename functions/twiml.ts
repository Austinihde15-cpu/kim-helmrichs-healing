import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Return TwiML to connect the call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${Deno.env.get('TWILIO_PHONE_NUMBER') || ''}">
    <Number>${new URL(req.url).searchParams.get('To') || ''}</Number>
  </Dial>
</Response>`;

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
});
