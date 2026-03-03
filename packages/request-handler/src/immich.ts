import dayjs from "dayjs";

import type { IntegrationKindByCategory } from "@homarr/definitions";
import { createIntegrationAsync } from "@homarr/integrations";
import type { ImmichServerStats } from "@homarr/integrations";

import { createCachedIntegrationRequestHandler } from "./lib/cached-integration-request-handler";

export const immichStatsRequestHandler = createCachedIntegrationRequestHandler<
  ImmichServerStats,
  IntegrationKindByCategory<"photoService">,
  Record<string, never>
>({
  async requestAsync(integration) {
    const integrationInstance = await createIntegrationAsync(integration);
    return await integrationInstance.getServerStatsAsync();
  },
  cacheDuration: dayjs.duration(15, "minute"),
  queryKey: "smartHome-entityState",
});
