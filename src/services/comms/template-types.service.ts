import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import * as repo from "@repositories/template_types/template-types.repository";
import {
  toTemplateTypeDto,
  type TemplateTypeDto,
} from "@modules/comms/template-types.dto";

export async function listTemplateTypes(
  ctx: OpsAuthedContext
): Promise<TemplateTypeDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toTemplateTypeDto);
}
