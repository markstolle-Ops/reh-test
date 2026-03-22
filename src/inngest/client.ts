import { Inngest } from "inngest";

/**
 * Singleton Inngest client for RealEstateHunter.
 * Import this in API routes and server-side code.
 */
export const inngest = new Inngest({ id: "realestatehunter" });
