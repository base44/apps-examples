// Seed the CRM with a realistic set of contacts, deals, and activities so you
// can see the dashboard, board, and copilot light up immediately.
//
// Usage (from the app directory, after `npm install` and `base44 deploy`):
//
//   BASE44_APP_ID=<your app id> \
//   BASE44_EMAIL=<your login email> \
//   BASE44_PASSWORD=<your password> \
//   node scripts/seed.mjs
//
// Everything is created as YOU (owner_email / created_by = your email), so it
// all lands inside your row-level-security scope. Re-running adds another set.

import { createClient } from "@base44/sdk";

const appId = process.env.BASE44_APP_ID;
const email = process.env.BASE44_EMAIL;
const password = process.env.BASE44_PASSWORD;

if (!appId || !email || !password) {
  console.error(
    "Missing env vars. Set BASE44_APP_ID, BASE44_EMAIL and BASE44_PASSWORD.\n" +
      "Find the app id in base44/.app.jsonc after `base44 link`.",
  );
  process.exit(1);
}

const base44 = createClient({ appId });

function daysFromNow(n) {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
}

const CONTACTS = [
  { name: "Jordan Lee", company: "Acme Corp", title: "VP Operations", email: "jordan@acme.com", phone: "+1 555 010 0101" },
  { name: "Priya Nair", company: "Northwind", title: "Head of IT", email: "priya@northwind.io", phone: "+1 555 010 0102" },
  { name: "Marcus Cole", company: "Globex", title: "CFO", email: "marcus@globex.com", phone: "+1 555 010 0103" },
  { name: "Sofia Marín", company: "Initech", title: "Director of Sales", email: "sofia@initech.com", phone: "+1 555 010 0104" },
  { name: "Wei Chen", company: "Umbrella", title: "Procurement Lead", email: "wei@umbrella.co", phone: "+1 555 010 0105" },
  { name: "Hannah Brooks", company: "Soylent", title: "COO", email: "hannah@soylent.com", phone: "+1 555 010 0106" },
  { name: "Diego Torres", company: "Hooli", title: "Eng Manager", email: "diego@hooli.com", phone: "+1 555 010 0107" },
  { name: "Amelia Fox", company: "Vandelay", title: "Owner", email: "amelia@vandelay.com", phone: "+1 555 010 0108" },
];

// [title, contactIndex, amount, stage, closeInDays]
const DEALS = [
  ["Acme Corp — Enterprise plan", 0, 48000, "negotiation", 9],
  ["Northwind — Platform rollout", 1, 120000, "proposal", 21],
  ["Globex — Annual renewal", 2, 36000, "qualified", 40],
  ["Initech — Pilot expansion", 3, 18500, "lead", 55],
  ["Umbrella — Security add-on", 4, 27000, "proposal", 14],
  ["Soylent — Multi-seat upgrade", 5, 64000, "negotiation", 6],
  ["Hooli — Data migration", 6, 15000, "qualified", 33],
  ["Vandelay — Starter package", 7, 9000, "lead", 60],
  ["Acme Corp — Support tier", 0, 12000, "won", -12],
  ["Globex — Onboarding services", 2, 22000, "won", -30],
  ["Initech — Legacy renewal", 3, 8000, "lost", -5],
];

// [dealIndex, type, summary]
const ACTIVITIES = [
  [0, "call", "Walked through pricing. They want a 3-year term — sending revised quote."],
  [0, "email", "Sent updated proposal with volume discount."],
  [1, "meeting", "Kickoff with IT + procurement. Security review is the gating item."],
  [5, "call", "Champion confirmed budget approved; legal reviewing MSA."],
  [2, "note", "Renewal at risk — competitor reached out to them. Book exec sync."],
];

async function main() {
  console.log(`Logging in as ${email}…`);
  await base44.auth.loginViaEmailPassword(email, password);
  const me = await base44.auth.me();
  const owner = me.email;
  console.log(`Authenticated as ${owner}. Seeding…`);

  const contacts = [];
  for (const c of CONTACTS) {
    contacts.push(await base44.entities.Contact.create({ ...c, owner_email: owner }));
  }
  console.log(`  ✓ ${contacts.length} contacts`);

  const deals = [];
  for (const [title, ci, amount, stage, closeInDays] of DEALS) {
    deals.push(
      await base44.entities.Deal.create({
        title,
        contact_id: contacts[ci].id,
        amount,
        stage,
        close_date: daysFromNow(closeInDays),
        owner_email: owner,
      }),
    );
  }
  console.log(`  ✓ ${deals.length} deals`);

  let n = 0;
  for (const [di, type, summary] of ACTIVITIES) {
    await base44.entities.Activity.create({
      type,
      summary,
      deal_id: deals[di].id,
      contact_id: deals[di].contact_id,
    });
    n++;
  }
  console.log(`  ✓ ${n} activities`);

  console.log("Done! Open the app and check the dashboard, board, and copilot.");
}

main().catch((err) => {
  console.error("Seed failed:", err?.message ?? err);
  process.exit(1);
});
