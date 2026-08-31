import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const PUBLIC_BASE = 'https://www.a2b.sa';

const resourceFiles = {
  company: 'data/company.json',
  services: 'data/services.json',
  capabilities: 'data/capabilities.json',
  serviceAreas: 'data/service-areas.json',
  routing: 'data/agent-routing.json',
  procurement: 'data/procurement-profile.json',
  compliance: 'data/compliance-profile.json',
  rfq: 'data/rfq-preparation.json'
};

let knowledgePromise;

async function readJson(file) {
  try {
    return JSON.parse(await readFile(join(root, file), 'utf8'));
  } catch (error) {
    const response = await fetch(`${PUBLIC_BASE}/${file}`);
    if (!response.ok) throw error;
    return response.json();
  }
}

async function loadKnowledge() {
  if (!knowledgePromise) {
    knowledgePromise = Promise.all(Object.values(resourceFiles).map(readJson)).then((items) => {
      const keys = Object.keys(resourceFiles);
      return Object.fromEntries(keys.map((key, index) => [key, items[index]]));
    });
  }
  return knowledgePromise;
}

function includesAny(text, terms) {
  return terms.some((term) => {
    const normalized = String(term).toLowerCase();
    if (/[^a-z0-9]/.test(normalized)) return text.includes(normalized);
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}(?:s|es)?\\b`, 'i').test(text);
  });
}

function serviceMatch(query, service) {
  const aliases = {
    'trucking-road-freight': ['truck', 'trucking', 'road freight', 'land freight', 'haulage', 'transport cargo', 'commercial freight'],
    'warehousing': ['warehouse', 'warehousing', 'storage', 'staging', 'inbound', 'outbound'],
    'customs-clearance': ['customs', 'clearance', 'import', 'port', 'airport cargo', 'documentation', 'hs code'],
    'supply-chain': ['supply chain', 'procurement logistics', 'factory logistics', 'market entry', 'multi-step logistics'],
    'fleet-types': ['fleet', 'flatbed', 'lowbed', 'reefer', 'tanker', 'crane truck', 'box truck', 'side-lifter', 'curtain-sider', 'tilt-bed']
  };
  const terms = aliases[service.id] || [];
  return includesAny(query, terms) || query.includes(service.name.toLowerCase());
}

function answerResult({ intent, answer, evidence = [], fit = 'informational', nextStep = null, questions = [], answered = true }) {
  return {
    answered,
    intent,
    fit,
    answer,
    evidence: [...new Set(evidence)],
    clarificationQuestions: questions,
    nextStep,
    commercialBoundary: 'Pricing, capacity, availability, lead times, and contractual terms require confirmation by a2b. This concierge cannot submit forms, send email, or create commitments.'
  };
}

export async function answerAgentQuestion(question) {
  const knowledge = await loadKnowledge();
  const query = String(question || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const { company, services, capabilities, serviceAreas, routing, procurement, compliance, rfq } = knowledge;

  const careerRoute = routing.routes.find((route) => route.id === 'careers');
  if (includesAny(query, careerRoute.match.map((term) => term.toLowerCase()))) {
    return answerResult({
      intent: 'careers',
      fit: 'separate_flow',
      answer: 'Career, internship, and training requests are handled through the a2b careers page, not the commercial project-inquiry route.',
      evidence: [careerRoute.routeTo],
      nextStep: { type: 'public_url', url: careerRoute.routeTo, approvalRequired: false }
    });
  }

  const vendorRoute = routing.routes.find((route) => route.id === 'vendor');
  if (includesAny(query, vendorRoute.match.map((term) => term.toLowerCase()))) {
    return answerResult({
      intent: 'vendor_registration',
      fit: 'separate_flow',
      answer: 'Supplier, subcontractor, and logistics-partner registration uses the dedicated a2b vendor page. It is separate from buyer and project inquiries.',
      evidence: [vendorRoute.routeTo],
      nextStep: { type: 'public_url', url: vendorRoute.routeTo, approvalRequired: false }
    });
  }

  const nonFitRoute = routing.routes.find((route) => route.id === 'non-fit');
  if (includesAny(query, nonFitRoute.match.map((term) => term.toLowerCase()).concat(['food delivery', 'restaurant delivery', 'personal shipment', 'last mile consumer']))) {
    return answerResult({
      intent: 'non_fit',
      fit: 'not_fit',
      answer: routing.nonFitResponse,
      evidence: [`${PUBLIC_BASE}/data/procurement-profile.json`]
    });
  }

  const matchedServices = services.services.filter((service) => serviceMatch(query, service));
  if (matchedServices.length) {
    const names = matchedServices.map((service) => service.name);
    const details = matchedServices.map((service) => `${service.name}: ${service.description}`).join(' ');
    return answerResult({
      intent: matchedServices.length === 1 ? `service_${matchedServices[0].id}` : 'service_match',
      fit: 'good_fit',
      answer: `${details} This is aligned with a2b's published B2B logistics scope when the requirement concerns commercial operations in Saudi Arabia.`,
      evidence: matchedServices.map((service) => service.url),
      nextStep: {
        type: 'prepare_inquiry',
        serviceNeeds: names,
        requiredInputs: [...new Set(matchedServices.flatMap((service) => service.inquiryFields))],
        approvalRequiredBeforeContact: true
      }
    });
  }

  if (includesAny(query, ['service', 'what do you do', 'what does a2b do', 'capability', 'capabilities', 'offer', 'offered', 'provide', 'provided', 'scope'])) {
    return answerResult({
      intent: 'services_overview',
      fit: 'good_fit',
      answer: `a2b publishes five core B2B logistics categories: ${services.services.map((service) => service.name).join(', ')}. Its focus is commercial logistics and operational supply-chain support in Saudi Arabia.`,
      evidence: services.services.map((service) => service.url),
      nextStep: { type: 'ask_for_scope', requiredInputs: ['service need', 'origin', 'destination', 'cargo', 'timeline'] }
    });
  }

  if (includesAny(query, ['where do you operate', 'coverage', 'service area', 'saudi', 'ksa', 'riyadh', 'gcc', 'uae', 'bahrain', 'kuwait', 'jordan', 'international'])) {
    const areas = serviceAreas.areas.map((area) => area.name).join(', ');
    return answerResult({
      intent: 'service_areas',
      fit: 'needs_confirmation',
      answer: `The published coverage is centered on Saudi Arabia, with Riyadh and major Saudi logistics nodes identified publicly. The public service-area profile also mentions selected GCC and neighboring cross-border routes. Published areas are ${areas}. Exact lane feasibility, capacity, and timing require confirmation.`,
      evidence: [`${PUBLIC_BASE}/data/service-areas.json`, `${PUBLIC_BASE}/services/trucking-road-freight`],
      nextStep: { type: 'ask_for_lane', requiredInputs: ['origin', 'destination', 'cargo', 'timeline'], approvalRequiredBeforeContact: true }
    });
  }

  if (includesAny(query, ['price', 'pricing', 'cost', 'rate', 'quote', 'quotation', 'capacity', 'available', 'availability', 'lead time', 'sla'])) {
    return answerResult({
      intent: 'commercial_confirmation',
      fit: 'needs_confirmation',
      answer: 'a2b does not publish automated prices, live capacity, availability, or service-level commitments. A useful RFQ can be prepared from the service, origin, destination, cargo, timing, frequency, and handling requirements, but a2b must confirm the commercial response.',
      evidence: [`${PUBLIC_BASE}/data/procurement-profile.json`, `${PUBLIC_BASE}/data/rfq-preparation.json`],
      nextStep: { type: 'prepare_rfq', requiredInputs: procurement.buyerInformationNeeded, approvalRequiredBeforeContact: true }
    });
  }

  if (includesAny(query, ['rfq', 'tender', 'procurement', 'buyer', 'government', 'b2g', 'proposal', 'inquiry', 'enquiry'])) {
    return answerResult({
      intent: 'procurement',
      fit: 'good_fit',
      answer: 'The concierge can help a procurement agent classify the requirement and prepare a complete RFQ brief for trucking, warehousing, customs-clearance coordination, or supply-chain logistics. It cannot submit the RFQ or create a commercial commitment.',
      evidence: [`${PUBLIC_BASE}/data/procurement-profile.json`, `${PUBLIC_BASE}/data/rfq-preparation.json`],
      nextStep: { type: 'prepare_rfq', rfqTypes: rfq.rfqTypes.map(({ id, name, requiredInputs }) => ({ id, name, requiredInputs })), approvalRequiredBeforeContact: true }
    });
  }

  if (includesAny(query, ['commercial registration', 'cr number', 'vat', 'tax', 'compliance', 'certificate', 'insurance', 'due diligence', 'legal identifier'])) {
    return answerResult({
      intent: 'compliance',
      fit: 'informational',
      answer: `The published identifiers are Commercial Registration ${compliance.verifiedPublicIdentifiers.commercialRegistration} and VAT ${compliance.verifiedPublicIdentifiers.vat}. Certifications, insurance, pricing, availability, fleet counts, and contract terms are not published and must not be inferred.`,
      evidence: [`${PUBLIC_BASE}/data/compliance-profile.json`],
      nextStep: { type: 'request_official_documents', approvalRequiredBeforeContact: true }
    });
  }

  if (includesAny(query, ['contact', 'email', 'phone', 'telephone', 'sales team', 'speak to', 'reach you'])) {
    return answerResult({
      intent: 'public_contact',
      fit: 'informational',
      answer: `The published contact channels are ${company.contact.primaryEmail}, ${company.contact.salesEmail}, and ${company.contact.phone}. This concierge does not send messages or place calls.`,
      evidence: [`${PUBLIC_BASE}/data/company.json`, PUBLIC_BASE],
      nextStep: { type: 'manual_contact', approvalRequiredBeforeContact: true }
    });
  }

  if (includesAny(query, ['who are you', 'what is a2b', 'why a2b', 'company overview', 'about a2b', 'why choose'])) {
    return answerResult({
      intent: 'company_overview',
      fit: 'informational',
      answer: `${company.name} is a Saudi Arabia B2B logistics company focused on trucking, warehousing support, customs-clearance coordination, supply-chain operations, and fleet-capability planning. Public capability evidence is available for each published category; current commercial terms still require direct confirmation.`,
      evidence: [company.website, ...capabilities.capabilities.flatMap((capability) => capability.evidenceUrls)],
      nextStep: { type: 'ask_for_scope', requiredInputs: ['service need', 'origin', 'destination', 'cargo', 'timeline'] }
    });
  }

  return answerResult({
    answered: false,
    intent: 'unanswered_public_question',
    fit: 'needs_clarification',
    answer: 'The approved public a2b sources do not provide enough information to answer this precisely. I will not invent a service, price, certification, route, capacity, or commitment.',
    evidence: [`${PUBLIC_BASE}/llms.txt`, `${PUBLIC_BASE}/data/services.json`],
    questions: ['Which a2b service is relevant?', 'What are the origin, destination, cargo, and required timeline?', 'Is the request for a buyer, procurement team, government entity, vendor, or career applicant?'],
    nextStep: { type: 'owner_knowledge_review', reviewRequired: true }
  });
}
