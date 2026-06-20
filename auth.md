# auth.md for a2b Logistics

This document describes how AI agents and automated clients can identify themselves when interacting with the public a2b Logistics website.

## Service

- Resource: https://www.a2b.sa
- Company: a2b Logistics Company
- Contact: info@a2b.sa
- Public service documentation: https://www.a2b.sa/llms.txt
- Agent skills index: https://www.a2b.sa/.well-known/agent-skills/index.json

## Agent access model

The a2b.sa website is primarily a public information and lead-generation site. Public pages, markdown documentation, sitemap, and discovery documents can be read without OAuth credentials.

Automated credential issuance is not enabled for production use. Agents that need privileged workflows, authenticated integrations, or high-volume access must request approval by emailing info@a2b.sa.

## Authorization endpoint

Manual onboarding endpoint: https://www.a2b.sa/agent-auth/register

Approved agents may be asked to provide:

- Organization name
- Agent operator contact
- Intended use case
- Expected request volume
- Public key or verification method
- Data handling commitment

## Token endpoint

Self-service token issuance is not currently available. If an agent is approved for authenticated access, a2b Logistics will provide integration-specific credentials and instructions outside the public website repository.

## Supported public methods

- Read public HTML pages
- Read https://www.a2b.sa/llms.txt
- Read https://www.a2b.sa/index.md
- Read https://www.a2b.sa/sitemap.xml
- Read https://www.a2b.sa/.well-known/api-catalog
- Read https://www.a2b.sa/.well-known/agent-card.json
- Use public WebMCP tools exposed on the homepage

## OAuth and protected-resource metadata

- Authorization server metadata: https://www.a2b.sa/.well-known/oauth-authorization-server
- OpenID configuration: https://www.a2b.sa/.well-known/openid-configuration
- Protected resource metadata: https://www.a2b.sa/.well-known/oauth-protected-resource
- Web Bot Auth public key directory: https://www.a2b.sa/.well-known/http-message-signatures-directory

## Credential use

Agents must not claim to represent a2b Logistics unless explicitly approved. Agents must not send spam, scrape personal data, or submit forms with fabricated contact details.

## agent_auth metadata

```yaml
agent_auth:
  skill: https://www.a2b.sa/auth.md
  register_uri: https://www.a2b.sa/agent-auth/register
  identity_types_supported:
    - identity_assertion
  identity_assertion:
    assertion_types_supported:
      - verified_email
    credential_types_supported:
      - private_key_jwt
    claim_uri: https://www.a2b.sa/agent-auth/claim
  claim_uri: https://www.a2b.sa/agent-auth/claim
  credential_types_supported:
    - private_key_jwt
  assertion_types_supported:
    - verified_email
  scopes_supported:
    - public.read
    - inquiry.prepare
  bearer_methods_supported:
    - header
```
