/* BrokerFlow data boundary. The console uses clearly marked sample records by default.
   A future authenticated host can inject BROKERFLOW_CLIENT_CONFIG with apiBase and
   getAccessToken(). No current endpoint returns a private console dataset. */
(function () {
  "use strict";
  const sample = {
    deals: [
      { id: "BF-2408", company: "Northstar Fleet Services", contact: "Maya Chen", initials: "NC", amount: 185000, product: "Equipment financing", stage: "Needs review", stageKey: "review", age: "2h ago", owner: "Jordan F.", source: "Referral · Summit CPAs", risk: "Missing documents", color: "teal" },
      { id: "BF-2407", company: "Hearth & Harbor Bakery", contact: "Luis Moreno", initials: "HB", amount: 92000, product: "Working capital", stage: "Documents", stageKey: "documents", age: "5h ago", owner: "Alex R.", source: "Website intake", risk: "Bank statements requested", color: "violet" },
      { id: "BF-2406", company: "Meridian Dental Group", contact: "Priya Shah", initials: "MD", amount: 310000, product: "Practice expansion", stage: "Lender matching", stageKey: "matching", age: "Yesterday", owner: "Jordan F.", source: "Referral · Oakline Advisors", risk: "Broker review required", color: "blue" },
      { id: "BF-2405", company: "Blue Ridge Fabrication", contact: "Evan Brooks", initials: "BR", amount: 245000, product: "Equipment financing", stage: "Intake", stageKey: "intake", age: "Yesterday", owner: "Sam T.", source: "Partner referral", risk: "Intake in progress", color: "amber" },
      { id: "BF-2404", company: "Kindred Home Care", contact: "Amara Davis", initials: "KH", amount: 135000, product: "Business line of credit", stage: "Ready for review", stageKey: "review", age: "2 days ago", owner: "Alex R.", source: "Website intake", risk: "Review requested", color: "rose" },
      { id: "BF-2403", company: "Cedar & Stone Landscaping", contact: "Noah Kim", initials: "CS", amount: 68000, product: "Working capital", stage: "Documents", stageKey: "documents", age: "3 days ago", owner: "Sam T.", source: "Referral · Fieldstone", risk: "1 item outstanding", color: "green" }
    ],
    reviews: [
      { id: "RV-0184", company: "Northstar Fleet Services", contact: "Maya Chen", initials: "NC", request: "Equipment financing", amount: 185000, priority: "High", reason: "Missing information", detail: "Two recent business bank statements have not been attached to the intake record.", time: "12 min ago", owner: "Jordan F.", color: "teal" },
      { id: "RV-0183", company: "Kindred Home Care", contact: "Amara Davis", initials: "KH", request: "Business line of credit", amount: 135000, priority: "Normal", reason: "Broker review requested", detail: "The intake summary is ready for an internal completeness check.", time: "48 min ago", owner: "Alex R.", color: "rose" },
      { id: "RV-0182", company: "Blue Ridge Fabrication", contact: "Evan Brooks", initials: "BR", request: "Equipment financing", amount: 245000, priority: "Normal", reason: "New referral", detail: "A partner referral was captured. Confirm the supplied contact permission and intake details.", time: "2 hr ago", owner: "Sam T.", color: "amber" },
      { id: "RV-0181", company: "Meridian Dental Group", contact: "Priya Shah", initials: "MD", request: "Practice expansion", amount: 310000, priority: "Low", reason: "Routing notes ready", detail: "Review the proposed next steps and confirm any external submission separately.", time: "Yesterday", owner: "Jordan F.", color: "blue" }
    ],
    partners: [
      { name: "Summit CPAs", initials: "SC", type: "Accounting firm", referrals: 12, status: "Active", last: "Today", color: "blue" },
      { name: "Oakline Advisors", initials: "OA", type: "Business advisory", referrals: 8, status: "Active", last: "Yesterday", color: "teal" },
      { name: "Fieldstone Network", initials: "FN", type: "Commercial real estate", referrals: 6, status: "Onboarding", last: "Oct 8", color: "amber" },
      { name: "Harborview Legal", initials: "HL", type: "Legal services", referrals: 3, status: "Active", last: "Oct 6", color: "violet" }
    ],
    activity: [
      { title: "New referral captured", description: "Northstar Fleet Services · Summit CPAs", status: "Completed", time: "10:42 AM", icon: "↳", color: "teal", type: "referral" },
      { title: "Document reminder prepared", description: "Hearth & Harbor Bakery · Draft queued for broker review", status: "Needs review", time: "10:18 AM", icon: "▤", color: "amber", type: "documents" },
      { title: "Review task created", description: "Kindred Home Care · Internal completeness check", status: "Completed", time: "9:56 AM", icon: "☷", color: "blue", type: "review" },
      { title: "Partner status digest generated", description: "Summit CPAs · Sample workflow activity", status: "Completed", time: "9:30 AM", icon: "♧", color: "violet", type: "partners" },
      { title: "Lender routing notes prepared", description: "Meridian Dental Group · Human review required", status: "Needs review", time: "Yesterday", icon: "⌁", color: "amber", type: "routing" },
      { title: "Follow-up reminder logged", description: "Blue Ridge Fabrication · No message sent from this demo", status: "Logged", time: "Yesterday", icon: "↻", color: "green", type: "follow-up" }
    ],
    integrations: [
      { name: "HubSpot", type: "CRM", initials: "H", color: "orange", status: "Not connected", detail: "Sync contacts, companies and broker-owned deal stages." },
      { name: "Zapier", type: "Automation", initials: "z", color: "amber", status: "Available", detail: "Connect intake and follow-up workflows across your tools." },
      { name: "Make", type: "Automation", initials: "M", color: "violet", status: "Available", detail: "Orchestrate review tasks and operational notifications." },
      { name: "n8n", type: "Automation", initials: "n", color: "rose", status: "Available", detail: "Run workflows in your own hosted automation environment." }
    ]
  };
  const config = window.BROKERFLOW_CLIENT_CONFIG || {};
  async function get(resource) {
    if (config.apiBase && typeof config.getAccessToken === "function" && config.resources && config.resources[resource]) {
      try {
        const token = await config.getAccessToken();
        const response = await fetch(new URL(config.resources[resource], config.apiBase), { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
        if (!response.ok) throw new Error("Authenticated data request failed");
        return { data: await response.json(), source: "connected" };
      } catch (error) {
        console.warn("BrokerFlow data source unavailable; showing sample data.", error);
      }
    }
    return { data: sample[resource] || [], source: "sample" };
  }
  window.BrokerFlowData = { get, sample };
})();
