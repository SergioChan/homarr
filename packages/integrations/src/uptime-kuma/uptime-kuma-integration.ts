import { ResponseError } from "@homarr/common/server";
import { fetchWithTrustedCertificatesAsync } from "@homarr/core/infrastructure/http";
import type { IntegrationTestingInput } from "../base/integration";
import { Integration } from "../base/integration";
import type { TestingResult } from "../base/test-connection/test-connection-service";
import type { IUptimeKumaIntegration } from "../interfaces/uptime-kuma/uptime-kuma-integration";
import type { UptimeKumaCheck } from "../interfaces/uptime-kuma/uptime-kuma-types";

export class UptimeKumaIntegration extends Integration implements IUptimeKumaIntegration {
  protected async testingAsync(input: IntegrationTestingInput): Promise<TestingResult> {
    // simply try to list checks, this will validate url and key if necessary
    try {
      const url = this.url("/api/checks");
      const response = await input.fetchAsync(this.appendApiKey(url).toString(), {});
      if (!response.ok) {
        throw new ResponseError(response);
      }
      await response.json();
      return { success: true };
    } catch (e) {
      // errors are automatically handled by the integration decorator
      return { success: false, error: (e as Error).message };
    }
  }

  public async listChecksAsync(): Promise<UptimeKumaCheck[]> {
    const url = this.appendApiKey(this.url("/api/checks"));
    const headers: Record<string, string> = {};
    if (super.hasSecretValue("apiKey")) {
      headers["X-API-Key"] = super.getSecretValue("apiKey");
    }

    const response = await fetchWithTrustedCertificatesAsync(url.toString(), {
      headers,
    });

    if (!response.ok) {
      throw new ResponseError(response);
    }

    const json = await response.json();
    // the API returns an object with "checks" or an array depending on version
    const array: unknown = json?.checks ?? json;
    return Array.isArray(array) ? array.map((item) => uptimeKumaCheckSchema.parse(item)) : [];
  }

  public async getCheckAsync(id: number): Promise<UptimeKumaCheck> {
    const url = this.appendApiKey(this.url(`/api/checks/${id}`));
    const headers: Record<string, string> = {};
    if (super.hasSecretValue("apiKey")) {
      headers["X-API-Key"] = super.getSecretValue("apiKey");
    }

    const response = await fetchWithTrustedCertificatesAsync(url.toString(), {
      headers,
    });

    if (!response.ok) {
      throw new ResponseError(response);
    }

    return uptimeKumaCheckSchema.parse(await response.json());
  }

  private appendApiKey(url: URL): URL {
    if (super.hasSecretValue("apiKey")) {
      url.searchParams.set("apiKey", super.getSecretValue("apiKey"));
    }
    return url;
  }
}

import { uptimeKumaCheckSchema } from "../interfaces/uptime-kuma/uptime-kuma-types";
