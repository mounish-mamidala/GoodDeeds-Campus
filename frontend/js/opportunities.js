document.addEventListener("DOMContentLoaded", async () => {
  const search = document.querySelector("#search");
  const category = document.querySelector("#category");
  const list = document.querySelector("#opportunity-list");
  async function render() {
    let rows = await GD.getOpportunities().catch(() => []);
    const q = search.value.toLowerCase();
    rows = rows.filter(o => (!q || `${o.title} ${o.description||""} ${o.location}`.toLowerCase().includes(q)) && (category.value==="All" || o.category===category.value));
    list.innerHTML = rows.map(GD.card).join("") || '<div class="empty">No matching opportunities found.</div>';
  }
  search.addEventListener("input",render); category.addEventListener("change",render); render();
});
