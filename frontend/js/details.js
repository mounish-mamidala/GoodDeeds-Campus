document.addEventListener("DOMContentLoaded", async () => {
  const id = Number(new URLSearchParams(location.search).get("id"));
  let rows = await GD.getOpportunities().catch(() => []);
  let item = rows.find(o => Number(o.id)===id);
  if (!item && !GD.cfg.USE_DEMO_DATA) {
    try { item = (await GD.api(`/opportunities/${id}`)).opportunity; } catch {}
  }
  const root = document.querySelector("#details");
  if (!item) { root.innerHTML='<div class="empty">Opportunity not found.</div>'; return; }
  root.innerHTML = `<div class="detail-layout"><section class="card"><span class="tag">${GD.esc(item.category)}</span><h1>${GD.esc(item.title)}</h1><p>${GD.esc(item.description)}</p><div class="meta"><span>📅 ${GD.formatDate(item.event_date)}</span><span>🕒 ${GD.esc(item.start_time || "Time to be announced")}</span><span>📍 ${GD.esc(item.location)}</span></div><hr><p><b>Organizer:</b> ${GD.esc(item.organizer)}</p><p><b>Duration:</b> ${item.duration_hours} hours</p><p><b>Volunteer slots:</b> ${item.joined_count||0} / ${item.available_slots}</p><button class="btn" id="join-btn">Join this opportunity</button><p class="muted">You must be logged in to join.</p></section><aside class="card"><h3>Make a difference</h3><p>Small actions create meaningful community impact. Join this initiative and contribute your time.</p><a class="btn secondary" href="opportunities.html">Explore more</a></aside></div>`;
  document.querySelector("#join-btn").addEventListener("click", async () => {
    try {
      const user = await GD.getUser();
      if (!user) { location.href="login.html"; return; }
      if (GD.cfg.USE_DEMO_DATA) {
        const regs = GD.getRegistrations();
        if (regs.some(r=>r.opportunityId===id && r.userEmail===user.email && r.status!=="CANCELLED")) throw new Error("You have already joined this opportunity.");
        regs.push({id:Date.now(),opportunityId:id,userEmail:user.email,status:"JOINED",hours:0,joinedAt:new Date().toISOString()});
        GD.saveRegistrations(regs);
      } else await GD.api(`/opportunities/${id}/join`,{method:"POST"});
      GD.statusMessage("You joined successfully! Check My Contributions.");
    } catch(e) { GD.statusMessage(e.message,"error"); }
  });
});
