document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#auth-form");
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      if (form.dataset.mode==="register") {
        if (data.password.length<8) throw new Error("Password must be at least 8 characters.");
        if (GD.cfg.USE_DEMO_DATA) {
          const users = GD.read("gd_users") || [];
          if (users.some(u=>u.email===data.email.toLowerCase())) throw new Error("Email already registered.");
          const user = {id:Date.now(),name:data.name,email:data.email.toLowerCase(),role:"STUDENT"};
          users.push({...user,password:data.password}); GD.write("gd_users",users); GD.write("gd_user",user);
        } else {
          const result = await GD.api("/auth/register",{method:"POST",body:JSON.stringify(data)});
          GD.write("gd_user",result.user);
        }
      } else {
        if (GD.cfg.USE_DEMO_DATA) {
          const users = GD.read("gd_users") || [];
          const user = users.find(u=>u.email===data.email.toLowerCase() && u.password===data.password);
          if (!user) throw new Error("Invalid email or password.");
          const {password,...safeUser}=user; GD.write("gd_user",safeUser);
        } else {
          const result = await GD.api("/auth/login",{method:"POST",body:JSON.stringify(data)});
          GD.write("gd_user",result.user);
        }
      }
      location.href="index.html";
    } catch(err) { GD.statusMessage(err.message,"error"); }
  });
});
