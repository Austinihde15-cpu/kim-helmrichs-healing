import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);

    // Parameters via query string: ?entity=Testimonial&id=<id>
    const entity = url.searchParams.get('entity');
    const id = url.searchParams.get('id');

    if (!entity || !['Testimonial', 'Service'].includes(entity)) {
      return Response.json({ error: 'Invalid or missing entity. Use ?entity=Testimonial or ?entity=Service' }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    const db = base44.asServiceRole.entities[entity];

    if (req.method === 'GET') {
      const records = await db.list();
      return Response.json(records, { headers: corsHeaders });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const created = await db.create(body);
      return Response.json(created, { status: 201, headers: corsHeaders });
    }

    if (req.method === 'PUT' && id) {
      const body = await req.json();
      const updated = await db.update(id, body);
      return Response.json(updated, { headers: corsHeaders });
    }

    if (req.method === 'DELETE' && id) {
      await db.delete(id);
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Method not supported or missing id' }, { status: 405, headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});
