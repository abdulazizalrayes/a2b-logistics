// WebMCP bridge - expose read-only a2b Logistics tools to browser-aware agents.
(function () {
  'use strict';

  if (typeof navigator === 'undefined') return;

  var publicResources = {
    company: '/data/company.json',
    services: '/data/services.json',
    capabilities: '/data/capabilities.json',
    'service-areas': '/data/service-areas.json',
    'project-inquiry-schema': '/data/project-inquiry-schema.json',
    'agent-routing': '/data/agent-routing.json',
    'markdown-companions': '/data/markdown-companions.json',
    llms: '/llms.txt',
    'llms-full': '/llms-full.txt',
    openapi: '/openapi.json'
  };

  function safeText(value, maxLength) {
    return String(value || '')
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .trim()
      .slice(0, maxLength);
  }

  function setupModelContext() {
    if (!navigator.modelContext) {
      navigator.modelContext = {
        _registeredTools: [],
        registerTool: function (tool) {
          this._registeredTools.push(tool);
          return (typeof AbortController === 'function') ? new AbortController() : { signal: { aborted: false } };
        }
      };
      return true;
    }

    if (typeof navigator.modelContext.registerTool !== 'function') {
      navigator.modelContext._registeredTools = navigator.modelContext._registeredTools || [];
      navigator.modelContext.registerTool = function (tool) {
        this._registeredTools.push(tool);
        return (typeof AbortController === 'function') ? new AbortController() : { signal: {} };
      };
    }
    return true;
  }

  function track(name, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, params || {});
  }

  function readJson(path) {
    return fetch(path, { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('Unable to read ' + path);
      return response.json();
    });
  }

  function readText(path) {
    return fetch(path, { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('Unable to read ' + path);
      return response.text();
    });
  }

  function classify(input, services, routing) {
    var query = [
      input && input.query,
      input && input.projectSummary,
      input && input.service,
      input && input.cargoDescription,
      input && Array.isArray(input.serviceNeeds) ? input.serviceNeeds.join(' ') : ''
    ].join(' ').toLowerCase();

    function hasMatch(route) {
      return route.match.some(function (term) {
        return query.indexOf(term.toLowerCase()) !== -1;
      });
    }

    var nonFit = routing.routes.filter(function (route) { return route.id === 'non-fit'; })[0];
    if (nonFit && hasMatch(nonFit)) {
      return { fit: 'not_fit', route: nonFit.routeTo, reason: routing.nonFitResponse, matchedServices: [] };
    }

    var careers = routing.routes.filter(function (route) { return route.id === 'careers'; })[0];
    if (careers && hasMatch(careers)) {
      return { fit: 'separate_flow', route: careers.routeTo, reason: 'Use the careers page, not project inquiry.', matchedServices: [] };
    }

    var vendors = routing.routes.filter(function (route) { return route.id === 'vendor'; })[0];
    if (vendors && hasMatch(vendors)) {
      return { fit: 'separate_flow', route: vendors.routeTo, reason: 'Use the vendor page, not project inquiry.', matchedServices: [] };
    }

    var matched = services.services.filter(function (service) {
      return query && [
        service.id,
        service.name,
        service.description,
        service.bestFit.join(' ')
      ].join(' ').toLowerCase().split(/[^a-z0-9]+/).some(function (token) {
        return token.length > 3 && query.indexOf(token) !== -1;
      });
    });

    return {
      fit: matched.length ? 'good_fit' : 'needs_clarification',
      route: 'prepare_project_inquiry',
      reason: matched.length ? 'The request appears aligned with published B2B logistics services.' : 'Ask for service type, origin, destination, cargo, timeline, and company details before routing.',
      matchedServices: matched.map(function (service) {
        return { id: service.id, name: service.name, url: service.url };
      })
    };
  }

  if (!setupModelContext()) return;

  var tools = [
    {
      name: 'get_company_overview',
      description: 'Return a2b Logistics public company overview and approval boundaries.',
      inputSchema: { type: 'object', properties: {} },
      execute: function () {
        track('mcp_tool_call', { tool_name: 'get_company_overview' });
        return Promise.all([readJson('/data/company.json'), readJson('/data/capabilities.json')]).then(function (items) {
          return { company: items[0], approvalBoundaries: items[1].approvalBoundaries };
        });
      }
    },
    {
      name: 'list_services',
      description: 'List a2b Logistics public B2B logistics service categories.',
      inputSchema: { type: 'object', properties: {} },
      execute: function () {
        track('mcp_tool_call', { tool_name: 'list_services' });
        return readJson('/data/services.json');
      }
    },
    {
      name: 'match_project_scope',
      description: 'Classify whether a request fits project inquiry, vendor, careers, or non-fit routing.',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
      execute: function (input) {
        track('mcp_tool_call', { tool_name: 'match_project_scope' });
        return Promise.all([readJson('/data/services.json'), readJson('/data/agent-routing.json')]).then(function (items) {
          return classify(input || {}, items[0], items[1]);
        });
      }
    },
    {
      name: 'prepare_project_inquiry',
      description: 'Prepare a B2B logistics inquiry draft without submitting forms or contacting a2b.',
      inputSchema: { type: 'object', properties: { companyName: { type: 'string' }, serviceNeeds: { type: 'array', items: { type: 'string' } }, projectSummary: { type: 'string' } } },
      execute: function (input) {
        input = input || {};
        track('inquiry_preparation', { approval_to_contact: input.approvalToContact === true });
        return Promise.all([readJson('/data/services.json'), readJson('/data/agent-routing.json')]).then(function (items) {
          return {
            route: classify(input, items[0], items[1]),
            draft: {
              companyName: safeText(input.companyName, 160),
              contactPerson: safeText(input.contactPerson, 160),
              contactEmail: safeText(input.contactEmail, 180),
              contactPhone: safeText(input.contactPhone, 80),
              serviceNeeds: Array.isArray(input.serviceNeeds) ? input.serviceNeeds.map(function (item) { return safeText(item, 80); }).slice(0, 8) : [],
              origin: safeText(input.origin, 160),
              destination: safeText(input.destination, 160),
              cargoDescription: safeText(input.cargoDescription, 600),
              timeline: safeText(input.timeline, 200),
              projectSummary: safeText(input.projectSummary, 1200)
            },
            approvalRequiredBeforeContact: true,
            nextStep: 'Do not submit this draft automatically. Ask the user for explicit approval before contacting a2b.'
          };
        });
      }
    },
    {
      name: 'list_service_areas',
      description: 'List public service areas and routing notes.',
      inputSchema: { type: 'object', properties: {} },
      execute: function () {
        track('mcp_tool_call', { tool_name: 'list_service_areas' });
        return readJson('/data/service-areas.json');
      }
    },
    {
      name: 'read_public_resource',
      description: 'Read one public structured resource by id.',
      inputSchema: { type: 'object', properties: { resourceId: { type: 'string' } }, required: ['resourceId'] },
      execute: function (input) {
        var resourceId = input && input.resourceId;
        var path = publicResources[resourceId];
        if (!path) return Promise.reject(new Error('Unknown public resource'));
        track('mcp_resource_read', { resource_id: resourceId });
        return (path.indexOf('.json') !== -1 ? readJson(path) : readText(path)).then(function (content) {
          return { resourceId: resourceId, content: content };
        });
      }
    }
  ];

  tools.forEach(function (tool) {
    try {
      navigator.modelContext.registerTool(tool);
    } catch (error) {
      // Keep other tools available even if one registration fails.
    }
  });
})();
