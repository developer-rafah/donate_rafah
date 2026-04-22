import "server-only";

/**
 * Certificates service — templates, rules, and issuance.
 *
 * Issuance flow:
 *   1. Verify donor belongs to one of the caller's orgs.
 *   2. Verify template belongs to the donor's org AND is active.
 *   3. If `certificate_rule_id` supplied, verify same org, active, and
 *      that it points to the same template.
 *   4. If `pdf_attachment_id` supplied, verify the attachment belongs
 *      to the same org.
 *   5. Generate `certificate_number` + `verification_code` server-side.
 *   6. Choose `issue_status` based on presence of the PDF attachment.
 *   7. Insert the row (append-only — no dedupe guard in this phase;
 *      duplicate issuance is schema-permitted and left as a later
 *      policy concern).
 *
 * No PDF rendering. No external delivery. Metadata-only write.
 */

import type { OpsAuthedContext } from "@lib/auth";
import {
  BadRequestError,
  NotFoundError,
} from "@lib/errors";
import * as templatesRepo from "@repositories/certificates/certificates-ops.repository";
import * as rulesRepo from "@repositories/certificate_rules/certificate-rules.repository";
import * as attachmentsRepo from "@repositories/attachments/attachments.repository";
import * as donorsRepo from "@repositories/donors/donors.repository";
import {
  defaultIssueStatus,
  generateCertificateNumber,
  generateVerificationCode,
} from "@domain/recognition/rules";
import {
  toCertificateRuleDto,
  toOpsCertificateTemplateDto,
  toOpsIssuedCertificateDto,
  type CertificateRuleDto,
  type CreateIssuedCertificateInput,
  type OpsCertificateTemplateDto,
  type OpsIssuedCertificateDto,
} from "@modules/recognition/certificates.dto";

// ---- Templates --------------------------------------------------------------

export async function listCertificateTemplates(
  ctx: OpsAuthedContext
): Promise<OpsCertificateTemplateDto[]> {
  const rows = await templatesRepo.listTemplatesInOrgs(ctx.organizationIds);
  return rows.map(toOpsCertificateTemplateDto);
}

export async function getCertificateTemplate(
  ctx: OpsAuthedContext,
  id: string
): Promise<OpsCertificateTemplateDto> {
  const row = await templatesRepo.findTemplateByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Certificate template not found");
  return toOpsCertificateTemplateDto(row);
}

// ---- Rules ------------------------------------------------------------------

export async function listCertificateRules(
  ctx: OpsAuthedContext
): Promise<CertificateRuleDto[]> {
  const rows = await rulesRepo.listInOrgs(ctx.organizationIds);
  return rows.map(toCertificateRuleDto);
}

export async function getCertificateRule(
  ctx: OpsAuthedContext,
  id: string
): Promise<CertificateRuleDto> {
  const row = await rulesRepo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Certificate rule not found");
  return toCertificateRuleDto(row);
}

// ---- Issued certificates ----------------------------------------------------

async function assertDonorInCallerOrgs(ctx: OpsAuthedContext, donorId: string) {
  const donor = await donorsRepo.findScopeById(donorId);
  if (!donor || !ctx.organizationIds.includes(donor.organization_id)) {
    throw new NotFoundError("Donor not found");
  }
  return donor;
}

export async function listDonorCertificates(
  ctx: OpsAuthedContext,
  donorId: string
): Promise<OpsIssuedCertificateDto[]> {
  await assertDonorInCallerOrgs(ctx, donorId);
  const rows = await templatesRepo.listIssuedByDonorId(donorId);
  return rows.map(toOpsIssuedCertificateDto);
}

export async function issueCertificate(
  ctx: OpsAuthedContext,
  donorId: string,
  input: CreateIssuedCertificateInput
): Promise<OpsIssuedCertificateDto> {
  const donor = await assertDonorInCallerOrgs(ctx, donorId);

  // Verify template is in donor's org and active.
  const template = await templatesRepo.findTemplateScopeById(
    input.certificate_template_id
  );
  if (!template || template.organization_id !== donor.organization_id) {
    throw new NotFoundError("Certificate template not found for this donor's org");
  }
  if (!template.is_active) {
    throw new BadRequestError("Certificate template is not active");
  }

  // Optional rule — same-org + active + points at this template.
  if (input.certificate_rule_id) {
    const rule = await rulesRepo.findScopeById(input.certificate_rule_id);
    if (!rule || rule.organization_id !== donor.organization_id) {
      throw new NotFoundError("Certificate rule not found for this donor's org");
    }
    if (!rule.is_active) {
      throw new BadRequestError("Certificate rule is not active");
    }
    if (rule.certificate_template_id !== template.id) {
      throw new BadRequestError(
        "Certificate rule does not point to the specified template"
      );
    }
  }

  // Optional PDF attachment — must be in the donor's org. Attachment
  // upload itself is out of scope for this phase (the caller must have
  // created the row through the attachments flow in a prior phase).
  if (input.pdf_attachment_id) {
    const att = await attachmentsRepo.findScopeById(input.pdf_attachment_id);
    if (!att || att.organization_id !== donor.organization_id) {
      throw new NotFoundError("PDF attachment not found for this donor's org");
    }
  }

  const hasPdf = Boolean(input.pdf_attachment_id);
  const nowIso = new Date().toISOString();

  const row = await templatesRepo.createIssued({
    organization_id: donor.organization_id,
    certificate_template_id: template.id,
    certificate_rule_id: input.certificate_rule_id ?? null,
    donor_id: donor.id,
    source_entity_type: input.source_entity_type ?? null,
    source_entity_id: input.source_entity_id ?? null,
    certificate_number: generateCertificateNumber(),
    issue_status: defaultIssueStatus(hasPdf),
    // Stamp issued_at only when we actually have a PDF link; else
    // leave null so the later provider-execution phase can set it.
    issued_at: hasPdf ? nowIso : null,
    issued_by: hasPdf ? ctx.user.id : null,
    pdf_attachment_id: input.pdf_attachment_id ?? null,
    verification_code: generateVerificationCode(),
    metadata_json: input.metadata_json ?? {},
    created_by: ctx.user.id,
  });

  return toOpsIssuedCertificateDto(row);
}
