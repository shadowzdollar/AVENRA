import { createAvenraClient } from "@avenra/contracts";
import { publicConfig } from "./config";

/** The typed API client, generated from the contract (ADR-008). */
export const api = createAvenraClient({ baseUrl: publicConfig.apiUrl });
