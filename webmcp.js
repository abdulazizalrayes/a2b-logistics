// Browser-side registration for agents that support navigator.modelContext.
(function () {
  'use strict';

  if (typeof navigator === 'undefined' || !navigator.modelContext || typeof navigator.modelContext.registerTool !== 'function') return;

  var publicResources = {
    company: '/data/company.json',
    services: '/data/services.json',
    capabilities: '/data/capabilities.json',
    'service-areas': '/data/service-areas.json',
    'project-inquiry-schema': '/data/project-inquiry-schema.json',
    'agent-routing': '/data/agent-routing.json',
    'agent-concierge': '/data/agent-concierge.json',
    'markdown-companions': '/data/markdown-companions.json',
    llms: '/llms.txt',
    'llms-full': '/llms-full.txt',
    openapi: '/openapi.json'
  };

  function safeText(value, maxLength) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
  }

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  function read(path, asJson) {
    return fetch(path, { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('Unable to read public a2b resource.');
      return asJson ? response.json() : response.text();
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
      return route.match.some(function (term) { return query.indexOf(term.toLowerCase()) !== -1; });
    }

    var special = routing.routes.filter(function (route) {
      return (route.id === 'careers' || route.id === 'vendor' || route.id === 'non-fit') && hasMatch(route);
    })[0];
    if (special) {
      return {
        fit: special.fit,
        route: special.routeTo,
        reason: special.id === 'non-fit' ? routing.nonFitResponse : 'Use the dedicated public ' + special.id + ' flow.',
        matchedServices: []
      };
    }

    var matched = services.services.filter(function (service) {
      var words = [service.id, service.name, service.description, service.bestFit.join(' ')].join(' ').toLowerCase().split(/[^a-z0-9]+/);
      return query && words.some(function (word) { return word.length > 3 && query.indexOf(word) !== -1; });
    });

    return {
      fit: matched.length ? 'good_fit' : 'needs_clarification',
      route: 'prepare_project_inquiry',
      reason: matched.length ? 'The request matches published a2b B2B logistics services.' : 'Ask for service type, origin, destination, cargo, and timeline.',
      matchedServices: matched.map(function (service) { return { id: service.id, name: service.name, url: service.url }; })
    };
  }

  function askConcierge(input) {
    input = input || {};
    track('mcp_tool_call', { tool_name: 'ask_agent_concierge' });
    return fetch('/api/agent-concierge', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: safeText(input.question, 2000), language: 'en', agent: 'browser-webmcp' })
    }).then(function (response) {
      return response.json().then(function (body) {
        if (!response.ok) throw new Error(body.error || 'The a2b concierge request failed.');
        return body;
      });
    });
  }

  var tools = [
    {
      name: 'get_company_overview',
      description: 'Return public a2b Logistics company information and approval boundaries.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: function () {
        track('mcp_tool_call', { tool_name: 'get_company_overview' });
        return Promise.all([read('/data/company.json', true), read('/data/capabilities.json', true)]).then(function (items) {
          return { company: items[0], approvalBoundaries: items[1].approvalBoundaries };
        });
      }
    },
    {
      name: 'list_services',
      description: 'List published a2b B2B logistics services.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: function () {
        track('mcp_tool_call', { tool_name: 'list_services' });
        return read('/data/services.json', true);
      }
    },
    {
      name: 'match_project_scope',
      description: 'Classify buyer, vendor, careers, and non-fit routing without taking action.',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } }, additionalProperties: true },
      execute: function (input) {
        track('mcp_tool_call', { tool_name: 'match_project_scope' });
        return Promise.all([read('/data/services.json', true), read('/data/agent-routing.json', true)]).then(function (items) {
          return classify(input || {}, items[0], items[1]);
        });
      }
    },
    {
      name: 'prepare_project_inquiry',
      description: 'Prepare a B2B logistics inquiry draft without submitting or contacting a2b.',
      inputSchema: { type: 'object', properties: { companyName: { type: 'string' }, serviceNeeds: { type: 'array', items: { type: 'string' } }, projectSummary: { type: 'string' } }, additionalProperties: true },
      execute: function (input) {
        input = input || {};
        track('inquiry_preparation', { approval_to_contact: input.approvalToContact === true });
        return Promise.all([read('/data/services.json', true), read('/data/agent-routing.json', true)]).then(function (items) {
          return {
            route: classify(input, items[0], items[1]),
            draft: {
              companyName: safeText(input.companyName, 160),
              serviceNeeds: Array.isArray(input.serviceNeeds) ? input.serviceNeeds.map(function (item) { return safeText(item, 80); }).slice(0, 8) : [],
              origin: safeText(input.origin, 160),
              destination: safeText(input.destination, 160),
              cargoDescription: safeText(input.cargoDescription, 600),
              timeline: safeText(input.timeline, 200),
              projectSummary: safeText(input.projectSummary, 1200)
            },
            approvalRequiredBeforeContact: true,
            nextStep: 'Do not submit this draft automatically. Ask for explicit approval before contacting a2b.'
          };
        });
      }
    },
    {
      name: 'list_service_areas',
      description: 'List published a2b service areas and confirmation boundaries.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: function () {
        track('mcp_tool_call', { tool_name: 'list_service_areas' });
        return read('/data/service-areas.json', true);
      }
    },
    {
      name: 'ask_agent_concierge',
      description: 'Ask the deterministic a2b public-facts concierge. Do not send personal data, credentials, or secrets.',
      inputSchema: { type: 'object', properties: { question: { type: 'string', minLength: 1, maxLength: 2000 } }, required: ['question'], additionalProperties: false },
      execute: askConcierge
    },
    {
      name: 'read_public_resource',
      description: 'Read an allowlisted public a2b structured resource.',
      inputSchema: { type: 'object', properties: { resourceId: { type: 'string' } }, required: ['resourceId'], additionalProperties: false },
      execute: function (input) {
        var resourceId = input && input.resourceId;
        var path = publicResources[resourceId];
        if (!path) return Promise.reject(new Error('Unknown public resource.'));
        track('mcp_resource_read', { resource_id: resourceId });
        return read(path, path.indexOf('.json') !== -1).then(function (content) { return { resourceId: resourceId, content: content }; });
      }
    }
  ];

  tools.forEach(function (tool) {
    try {
      navigator.modelContext.registerTool(tool);
    } catch (error) {
      // Keep the remaining public tools available if one registration is unsupported.
    }
  });
})();
