(() => {
  const sample = [
    {id:1,title:"Beach Cleanup Drive",category:"Environment",location:"Marina Beach, Chennai",event_date:"2027-01-17",start_time:"07:00",duration_hours:3,available_slots:35,joined_count:12,organizer:"Green Campus Club",description:"Clean the shoreline, segregate waste and spread awareness about protecting marine ecosystems."},
    {id:2,title:"Weekend Teaching Support",category:"Education",location:"Community Learning Centre, Chennai",event_date:"2027-01-24",start_time:"09:30",duration_hours:2,available_slots:18,joined_count:8,organizer:"Campus Outreach",description:"Help school students practice reading, mathematics and computer fundamentals."},
    {id:3,title:"Community Food Packing",category:"Community",location:"T. Nagar, Chennai",event_date:"2027-02-01",start_time:"10:00",duration_hours:2.5,available_slots:24,joined_count:14,organizer:"ServeTogether",description:"Pack essential grocery kits with a local community group for distribution."},
    {id:4,title:"Campus Blood Donation Camp Support",category:"Health",location:"College Campus, Chennai",event_date:"2027-02-08",start_time:"08:30",duration_hours:4,available_slots:12,joined_count:6,organizer:"Student Welfare Cell",description:"Assist with registrations, queue management and donor guidance. Volunteers do not perform medical tasks."}
  ];
  const cfg = window.GD_CONFIG;
  const read = key => JSON.parse(localStorage.getItem(key) || "null");
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const api = async (path, options={}) => {
    const response = await fetch(`${cfg.API_BASE}${path}`, {
      credentials:"include",
      headers:{"Content-Type":"application/json", ...(options.headers || {})},
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  };
  const getUser = async () => {
    if (cfg.USE_DEMO_DATA) return read("gd_user");
    return (await api("/auth/me")).user;
  };
  const getOpportunities = async () => {
    if (cfg.USE_DEMO_DATA) return read("gd_opportunities") || sample;
    return (await api("/opportunities")).opportunities;
  };
  const getRegistrations = () => read("gd_registrations") || [];
  const saveRegistrations = rows => write("gd_registrations", rows);
  const statusMessage = (message, type="success") => {
    const node = document.querySelector("#notice");
    if (node) { node.textContent = message; node.className = `notice ${type}`; node.hidden = false; }
    else alert(message);
  };
  const formatDate = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
  const card = o => `<article class="card"><span class="tag">${esc(o.category)}</span><h3>${esc(o.title)}</h3><p>${esc(o.description || "Join this community initiative and make a difference.")}</p><div class="meta"><span>📅 ${formatDate(o.event_date)}</span><span>📍 ${esc(o.location)}</span></div><div class="meta"><span>🙋 ${o.joined_count || 0}/${o.available_slots} joined</span><span>⏱ ${o.duration_hours} hrs</span></div><a class="btn secondary" href="opportunity-details.html?id=${o.id}">View details</a></article>`;
  const updateNav = async () => {
    const user = await getUser().catch(() => null);
    const auth = document.querySelector("#auth-nav");
    if (auth) auth.innerHTML = user
      ? `<span class="muted">Hi, ${esc(user.name)}</span><a href="contributions.html">My Contributions</a>${user.role === "ADMIN" ? '<a href="admin.html">Admin</a>' : ""}<button class="btn small secondary" id="logout-btn">Log out</button>`
      : '<a href="login.html">Log in</a><a class="btn small" href="register.html">Sign up</a>';
    document.querySelector("#logout-btn")?.addEventListener("click", async () => {
      try { if (!cfg.USE_DEMO_DATA) await api("/auth/logout",{method:"POST"}); } catch {}
      localStorage.removeItem("gd_user"); location.href="index.html";
    });
  };
  window.GD = {cfg,api,read,write,esc,sample,getUser,getOpportunities,getRegistrations,saveRegistrations,statusMessage,formatDate,card,updateNav};
  document.addEventListener("DOMContentLoaded", updateNav);
})();
