// WebMCP - expose a2b Logistics site tools to AI agents.
(function () {
  'use strict';

  if (typeof navigator === 'undefined') return;

  function safeText(value, maxLength) {
    return String(value || '')
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .trim()
      .slice(0, maxLength);
  }

  if (!navigator.modelContext) {
    try {
      navigator.modelContext = {
        _registeredTools: [],
        registerTool: function (tool) {
          this._registeredTools.push(tool);
          return (typeof AbortController === 'function') ? new AbortController() : { signal: { aborted: false } };
        }
      };
    } catch (error) {
      return;
    }
  } else if (typeof navigator.modelContext.registerTool !== 'function') {
    navigator.modelContext._registeredTools = navigator.modelContext._registeredTools || [];
    navigator.modelContext.registerTool = function (tool) {
      this._registeredTools.push(tool);
      return (typeof AbortController === 'function') ? new AbortController() : { signal: {} };
    };
  }

  var tools = [
    {
      name: 'request_quote',
      description: 'Request a logistics quote from a2b Logistics for trucking, warehousing, customs clearance, or supply chain services in Saudi Arabia.',
      inputSchema: {
        type: 'object',
        properties: {
          service_type: { type: 'string', description: 'Trucking, warehousing, customs clearance, or full supply chain.' },
          origin: { type: 'string' },
          destination: { type: 'string' },
          cargo_type: { type: 'string' },
          contact_name: { type: 'string' },
          contact_email: { type: 'string' },
          notes: { type: 'string' }
        },
        required: ['service_type']
      },
      execute: function (input) {
        input = input || {};
        var serviceType = safeText(input.service_type, 120);
        var origin = safeText(input.origin, 160);
        var destination = safeText(input.destination, 160);
        var cargoType = safeText(input.cargo_type, 160);
        var contactName = safeText(input.contact_name, 160);
        var contactEmail = safeText(input.contact_email, 160);
        var notes = safeText(input.notes, 1200);
        var nl = String.fromCharCode(10);
        var lines = [
          'Service: ' + serviceType,
          'Origin: ' + origin,
          'Destination: ' + destination,
          'Cargo: ' + cargoType,
          '',
          'Contact: ' + contactName + ' (' + contactEmail + ')',
          '',
          'Notes: ' + notes
        ];

        window.location.href = 'mailto:sales@a2b.sa?subject=' + encodeURIComponent('Logistics quote - ' + (serviceType || 'Service')) + '&body=' + encodeURIComponent(lines.join(nl));
        return { ok: true };
      }
    },
    {
      name: 'list_services',
      description: 'List a2b Logistics services.',
      inputSchema: { type: 'object', properties: {} },
      execute: function () {
        return {
          services: [
            'Trucking - Kingdom-wide',
            'Warehousing',
            'Customs clearance',
            'Supply chain solutions',
            '24/7 availability'
          ]
        };
      }
    },
    {
      name: 'get_company_info',
      description: 'Return a2b Logistics company info.',
      inputSchema: { type: 'object', properties: {} },
      execute: function () {
        return {
          name: 'a2b Logistics',
          tagline: 'Saudi Arabia premier logistics partner',
          contact: {
            phone: '+966 55 384 6446',
            sales: 'sales@a2b.sa',
            info: 'info@a2b.sa',
            website: 'https://a2b.sa'
          }
        };
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
