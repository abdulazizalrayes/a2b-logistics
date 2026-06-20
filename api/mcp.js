import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

const publicResources = {
  'company': 'data/company.json',
  'services': 'data/services.json',
  'capabilities': 'data/capabilities.json',
  'service-areas': 'data/service-areas.json',
  'project-inquiry-schema': 'data/project-inquiry-schema.json',
  'agent-routing': 'data/agent-routing.json',
  'llms': 'llms.txt',
  'llms-full': 'llms-full.txt',
  'openapi': 'openapi.json'
};

async function readText(resourceId) {
  const file = publicResources[resourceId];
  if (!file) {
    const error = new Error('Unknown public resource');
    error.code = 'UNKNOWN_RESOURCE';
    throw error;
  }
  return readFile(join(root, file), 'utf8');
}

async function readJson(resourceId) {
  return JSON.parse(await readText(resourceId));
}

function ok(id, result) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function err(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function text(value, max) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function classifyScope(input, services, routing) {
  const query = [
    input.query,
    input.projectSummary,
    input.service,
    input.serviceNeeds,
    input.cargoDescription
  ].flat().join(' ').toLowerCase();

  const nonFit = routing.routes.find((route) => route.id === 'non-fit');
  if (nonFit.match.some((term) => query.includes(term.toLowerCase()))) {
    return { fit: 'not_fit', route: nonFit.routeTo, reason: routing.nonFitResponse, matchedServices: [] };
  }

  const careers = routing.routes.find((route) => route.id === 'careers');
  if (careers.match.some((term) => query.includes(term.toLowerCase()))) {
    return { fit: 'separate_flow', route: careers.routeTo, reason: 'Career, internship, and training requests use the careers page, not project inquiry.', matchedServices: [] };
  }

  const vendors = routing.routes.find((route) => route.id === 'vendor');
  if (vendors.match.some((term) => query.includes(term.toLowerCase()))) {
    return { fit: 'separate_flow', route: vendors.routeTo, reason: 'Vendor and subcontractor requests use the vendor page, not project inquiry.', matchedServices: [] };
  }

  const matchedServices = services.services.filter((service) => {
    const haystack = [
      service.id,
      service.name,
      service.description,
      service.bestFit.join(' ')
    ].join(' ').toLowerCase();
    return query && haystack.split(/[^a-z0-9]+/).some((token) => token.length > 3 && query.includes(token));
  });

  return {
    fit: matchedServices.length ? 'good_fit' : 'needs_clarification',
    route: 'prepare_project_inquiry',
    reason: matchedServices.length ? 'The request appears aligned with published B2B logistics services.' : 'Ask for service type, origin, destination, cargo, timeline, and company details before routing.',
    matchedServices: matchedServices.map((service) => ({ id: service.id, name: service.name, url: service.url }))
  };
}

const tools = [
  {
    name: 'get_company_overview',
    description: 'Return a2b Logistics public company overview and approval boundaries.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'list_services',
    description: 'List a2b Logistics public B2B logistics service categories.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'match_project_scope',
    description: 'Classify whether a request fits a2b project inquiry, vendor, careers, or non-fit routing.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        serviceNeeds: { type: 'array', items: { type: 'string' } },
        projectSummary: { type: 'string' }
      },
      additionalProperties: true
    }
  },
  {
    name: 'prepare_project_inquiry',
    description: 'Prepare a B2B logistics inquiry draft without submitting or contacting a2b.',
    inputSchema: {
      type: 'object',
      properties: {
        companyName: { type: 'string' },
        contactPerson: { type: 'string' },
        contactEmail: { type: 'string' },
        contactPhone: { type: 'string' },
        serviceNeeds: { type: 'array', items: { type: 'string' } },
        origin: { type: 'string' },
        destination: { type: 'string' },
        cargoDescription: { type: 'string' },
        timeline: { type: 'string' },
        projectSummary: { type: 'string' },
        approvalToContact: { type: 'boolean' }
      },
      additionalProperties: true
    }
  },
  {
    name: 'list_service_areas',
    description: 'List public service areas and routing notes.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'read_public_resource',
    description: 'Read one public structured resource by id.',
    inputSchema: {
      type: 'object',
      properties: {
        resourceId: {
          type: 'string',
          enum: Object.keys(publicResources)
        }
      },
      required: ['resourceId'],
      additionalProperties: false
    }
  }
];

async function callTool(name, args = {}) {
  const [company, services, capabilities, serviceAreas, routing] = await Promise.all([
    readJson('company'),
    readJson('services'),
    readJson('capabilities'),
    readJson('service-areas'),
    readJson('agent-routing')
  ]);

  if (name === 'get_company_overview') {
    return { company, approvalBoundaries: capabilities.approvalBoundaries };
  }
  if (name === 'list_services') {
    return services;
  }
  if (name === 'list_service_areas') {
    return serviceAreas;
  }
  if (name === 'match_project_scope') {
    return classifyScope(args, services, routing);
  }
  if (name === 'prepare_project_inquiry') {
    const route = classifyScope(args, services, routing);
    const draft = {
      companyName: text(args.companyName, 160),
      contactPerson: text(args.contactPerson, 160),
      contactEmail: text(args.contactEmail, 180),
      contactPhone: text(args.contactPhone, 80),
      serviceNeeds: Array.isArray(args.serviceNeeds) ? args.serviceNeeds.map((item) => text(item, 80)).slice(0, 8) : [],
      origin: text(args.origin, 160),
      destination: text(args.destination, 160),
      cargoDescription: text(args.cargoDescription, 600),
      timeline: text(args.timeline, 200),
      projectSummary: text(args.projectSummary, 1200)
    };
    return {
      route,
      draft,
      approvalRequiredBeforeContact: true,
      contactApprovedInInput: args.approvalToContact === true,
      nextStep: args.approvalToContact === true ? 'User approved contact in input, but this public endpoint still does not submit forms or send email. Use the website contact flow or sales@a2b.sa manually.' : 'Ask the user for explicit approval before contacting a2b. Do not submit this draft automatically.'
    };
  }
  if (name === 'read_public_resource') {
    return {
      resourceId: args.resourceId,
      content: await readText(args.resourceId)
    };
  }
  throw new Error('Unknown tool');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Cache-Control', 'public, max-age=60');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json(err(null, -32005, 'Method not allowed'));
    return;
  }

  const body = req.body || {};
  const id = body.id ?? null;

  try {
    if (body.method === 'initialize') {
      res.status(200).json(ok(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'a2b-logistics', version: '1.0.0' },
        capabilities: { tools: {}, resources: {} }
      }));
      return;
    }

    if (body.method === 'tools/list') {
      res.status(200).json(ok(id, { tools }));
      return;
    }

    if (body.method === 'tools/call') {
      const result = await callTool(body.params?.name, body.params?.arguments || {});
      console.log(JSON.stringify({ event: 'mcp_tool_call', tool: body.params?.name, route: result.route?.route || result.route || null, ts: new Date().toISOString() }));
      res.status(200).json(ok(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }));
      return;
    }

    if (body.method === 'resources/list') {
      res.status(200).json(ok(id, {
        resources: Object.entries(publicResources).map(([name, file]) => ({
          uri: `https://www.a2b.sa/${file}`,
          name,
          mimeType: file.endsWith('.json') ? 'application/json' : 'text/plain'
        }))
      }));
      return;
    }

    if (body.method === 'resources/read') {
      const uri = body.params?.uri || '';
      const entry = Object.entries(publicResources).find(([, file]) => uri === `https://www.a2b.sa/${file}` || uri === file);
      if (!entry) throw new Error('Unknown resource');
      console.log(JSON.stringify({ event: 'mcp_resource_read', resource: entry[0], ts: new Date().toISOString() }));
      res.status(200).json(ok(id, { contents: [{ uri, text: await readText(entry[0]) }] }));
      return;
    }

    res.status(400).json(err(id, -32601, 'Method not found'));
  } catch (error) {
    res.status(400).json(err(id, -32000, error.message));
  }
}
