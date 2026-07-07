// CRM data — read server functions. Every one runs on the Worker and reads
// through a request-scoped Base44 client, so all results are already
// row-level-security scoped to the logged-in rep (or the whole team, for a
// manager/admin). None of this data is ever cached (markPrivate).

import { createServerFn } from "@tanstack/react-start";
import { getServerClient, markPrivate } from "./server.js";
import { computeStats } from "./stats.js";
import type { Activity, Contact, DashboardStats, Deal } from "./types.js";

const PAGE = 5000;

async function loadDeals(base44: Awaited<ReturnType<typeof getServerClient>>): Promise<Deal[]> {
  return (await base44.entities.Deal.list("-created_date", PAGE)) as Deal[];
}

async function loadContacts(
  base44: Awaited<ReturnType<typeof getServerClient>>,
): Promise<Contact[]> {
  return (await base44.entities.Contact.list("-created_date", PAGE)) as Contact[];
}

/** Dashboard: server-computed pipeline KPIs from the caller's own deals. */
export const getDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ stats: DashboardStats; dealCount: number }> => {
    markPrivate();
    const base44 = await getServerClient();
    const deals = await loadDeals(base44);
    return { stats: computeStats(deals), dealCount: deals.length };
  },
);

/** Kanban board: the caller's deals plus the contacts to label the cards. */
export const getPipeline = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ deals: Deal[]; contacts: Contact[] }> => {
    markPrivate();
    const base44 = await getServerClient();
    const [deals, contacts] = await Promise.all([loadDeals(base44), loadContacts(base44)]);
    return { deals, contacts };
  },
);

/** Contacts page: the caller's contacts + how many deals reference each. */
export const getContactsData = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ contacts: Contact[]; dealsByContact: Record<string, number> }> => {
    markPrivate();
    const base44 = await getServerClient();
    const [contacts, deals] = await Promise.all([loadContacts(base44), loadDeals(base44)]);
    const dealsByContact: Record<string, number> = {};
    for (const deal of deals) {
      if (deal.contact_id) {
        dealsByContact[deal.contact_id] = (dealsByContact[deal.contact_id] ?? 0) + 1;
      }
    }
    return { contacts, dealsByContact };
  },
);

/** Deal detail: the deal, its contact, and its activity timeline. */
export const getDealDetail = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(
    async ({
      data: id,
    }): Promise<{ deal: Deal | null; contact: Contact | null; activities: Activity[] }> => {
      markPrivate();
      const base44 = await getServerClient();

      const deal = (await base44.entities.Deal.get(id).catch(() => null)) as Deal | null;
      if (!deal) return { deal: null, contact: null, activities: [] };

      const [contact, activities] = await Promise.all([
        deal.contact_id
          ? ((await base44.entities.Contact.get(deal.contact_id).catch(() => null)) as Contact | null)
          : Promise.resolve(null),
        base44.entities.Activity.filter({ deal_id: id }, "-created_date", 200).catch(
          () => [] as Activity[],
        ) as Promise<Activity[]>,
      ]);

      return { deal, contact, activities };
    },
  );
