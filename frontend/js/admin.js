document.addEventListener("DOMContentLoaded", async () => {
  const user=await GD.getUser().catch(()=>null);
  if (!user) { location.href="login.html"; return; }
  if (user.role!=="ADMIN") { document.querySelector("#admin-root").innerHTML='<div class="empty">Admin access required.</div>'; return; }
  const form=document.querySelector("#op-form"), list=document.querySelector("#admin-list"), regList=document.querySelector("#registration-list");
  async function load() {
    const ops=await GD.getOpportunities();
    list.innerHTML=ops.map(o=>`<article class="card admin-row"><div><span class="tag">${GD.esc(o.category)}</span><h3>${GD.esc(o.title)}</h3><p class="muted">${GD.esc(o.location)} · ${GD.formatDate(o.event_date)}</p></div><div class="actions"><button class="btn small secondary" data-edit="${o.id}">Edit</button><button class="btn small danger" data-delete="${o.id}">Delete</button></div></article>`).join("") || '<div class="empty">No opportunities created yet.</div>';
    list.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>fill(ops.find(o=>o.id===Number(b.dataset.edit))));
    list.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>remove(Number(b.dataset.delete)));
    await loadRegistrations();
  }
  async function loadRegistrations() {
    let rows=[];
    if (GD.cfg.USE_DEMO_DATA) {
      const regs=GD.getRegistrations(), users=GD.read("gd_users")||[], opportunities=await GD.getOpportunities();
      rows=regs.map(r=>({...r,student:users.find(u=>u.email===r.userEmail)||{name:r.userEmail,email:r.userEmail},opportunity:opportunities.find(o=>o.id===r.opportunityId)})).filter(r=>r.opportunity);
    } else {
      try { rows=(await GD.api("/contributions")).registrations; } catch(e) { regList.innerHTML=`<div class="empty">${GD.esc(e.message)}</div>`; return; }
    }
    regList.innerHTML=rows.map(r=>`<article class="card admin-row"><div><h3>${GD.esc(r.opportunity.title)}</h3><p class="muted">${GD.esc(r.student.name)} · ${GD.esc(r.student.email)}</p><span class="tag">${GD.esc(r.status)}</span></div><div class="actions"><select data-status="${r.id}"><option ${r.status==="JOINED"?"selected":""}>JOINED</option><option ${r.status==="APPROVED"?"selected":""}>APPROVED</option><option ${r.status==="COMPLETED"?"selected":""}>COMPLETED</option><option ${r.status==="CANCELLED"?"selected":""}>CANCELLED</option></select><input data-hours="${r.id}" type="number" min="0" step=".5" value="${r.hours_awarded ?? r.hours ?? 0}" aria-label="Hours awarded" style="width:90px;padding:8px;border:1px solid #d6dfda;border-radius:8px"><button class="btn small" data-save-reg="${r.id}">Update</button></div></article>`).join("") || '<div class="empty">No student registrations yet.</div>';
    regList.querySelectorAll("[data-save-reg]").forEach(b=>b.onclick=()=>updateRegistration(Number(b.dataset.saveReg)));
  }
  async function updateRegistration(id) {
    const status=regList.querySelector(`[data-status="${id}"]`).value;
    const hours=Number(regList.querySelector(`[data-hours="${id}"]`).value);
    try {
      if (GD.cfg.USE_DEMO_DATA) {
        const regs=GD.getRegistrations().map(r=>r.id===id?{...r,status,hours:status==="COMPLETED"?hours:0}:r);
        GD.saveRegistrations(regs);
      } else {
        await GD.api(`/contributions/${id}/status`,{method:"PATCH",body:JSON.stringify({status,hours_awarded:hours})});
      }
      GD.statusMessage("Registration updated."); await loadRegistrations();
    } catch(e) { GD.statusMessage(e.message,"error"); }
  }
  function fill(o) {
    for (const [k,v] of Object.entries(o)) { const field=form.elements[k]; if(field) field.value=v??""; }
    form.elements.id.value=o.id;
    window.scrollTo({top:0,behavior:"smooth"});
  }
  async function remove(id) {
    if(!confirm("Delete this opportunity? Its registrations will also be deleted.")) return;
    try {
      if(GD.cfg.USE_DEMO_DATA) GD.write("gd_opportunities",(GD.read("gd_opportunities")||GD.sample).filter(o=>o.id!==id));
      else await GD.api(`/opportunities/${id}`,{method:"DELETE"});
      await load();
    } catch(e) { GD.statusMessage(e.message,"error"); }
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault(); const data=Object.fromEntries(new FormData(form).entries()); const id=data.id; delete data.id;
    data.duration_hours=Number(data.duration_hours); data.available_slots=Number(data.available_slots);
    try {
      if(GD.cfg.USE_DEMO_DATA) {
        let ops=GD.read("gd_opportunities")||GD.sample;
        if(id) ops=ops.map(o=>o.id===Number(id)?{...o,...data,id:Number(id)}:o);
        else ops=[...ops,{...data,id:Date.now(),joined_count:0,organizer:data.organizer||"GoodDeeds Campus"}];
        GD.write("gd_opportunities",ops);
      } else await GD.api(id?`/opportunities/${id}`:"/opportunities",{method:id?"PUT":"POST",body:JSON.stringify(data)});
      form.reset(); form.elements.id.value=""; await load(); GD.statusMessage("Opportunity saved.");
    } catch(err) { GD.statusMessage(err.message,"error"); }
  });
  document.querySelector("#reset-form").onclick=()=>{form.reset();form.elements.id.value="";};
  await load();
});
