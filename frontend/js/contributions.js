document.addEventListener("DOMContentLoaded", async () => {
  const user = await GD.getUser().catch(()=>null);
  if (!user) { location.href="login.html"; return; }
  let rows=[], stats={joined:0,completed:0,hours:0};
  if (GD.cfg.USE_DEMO_DATA) {
    const all = GD.getRegistrations().filter(r=>r.userEmail===user.email);
    const ops = await GD.getOpportunities();
    rows = all.map(r=>({...r,opportunity:ops.find(o=>o.id===r.opportunityId)})).filter(r=>r.opportunity);
    stats={joined:rows.filter(r=>["JOINED","APPROVED"].includes(r.status)).length,completed:rows.filter(r=>r.status==="COMPLETED").length,hours:rows.filter(r=>r.status==="COMPLETED").reduce((s,r)=>s+Number(r.hours||0),0)};
  } else {
    try { const result=await GD.api("/contributions/me"); rows=result.contributions; stats=result.stats; }
    catch(e) { GD.statusMessage(e.message,"error"); }
  }
  document.querySelector("#joined-stat").textContent=stats.joined;
  document.querySelector("#completed-stat").textContent=stats.completed;
  document.querySelector("#hours-stat").textContent=stats.hours;
  document.querySelector("#contribution-list").innerHTML=rows.map(r=>`<article class="card"><div class="row-between"><span class="tag">${GD.esc(r.opportunity.category)}</span><b class="status">${GD.esc(r.status)}</b></div><h3>${GD.esc(r.opportunity.title)}</h3><div class="meta"><span>📅 ${GD.formatDate(r.opportunity.event_date)}</span><span>📍 ${GD.esc(r.opportunity.location)}</span></div><p class="muted">Hours awarded: ${r.hours_awarded ?? r.hours ?? 0}</p></article>`).join("") || '<div class="empty">You have not joined any opportunities yet. <a href="opportunities.html">Explore opportunities</a>.</div>';
});
