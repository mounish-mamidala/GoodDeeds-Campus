document.addEventListener("DOMContentLoaded", async () => {
  const opportunities = await GD.getOpportunities().catch(() => []);
  document.querySelector("#featured").innerHTML = opportunities.slice(0,3).map(GD.card).join("") || "<p>No opportunities yet.</p>";
  document.querySelector("#op-count").textContent = opportunities.length;
  const regs = GD.getRegistrations();
  document.querySelector("#vol-count").textContent = new Set(regs.map(r=>r.userEmail)).size || "—";
  document.querySelector("#impact-count").textContent = regs.filter(r=>r.status==="COMPLETED").length;
});
