(() => {
const config=window.ZBC_CONFIG||{}, label=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmt=new Intl.DateTimeFormat("en-PH",{timeZone:config.timezone||"Asia/Manila",weekday:"long",year:"numeric",month:"long",day:"numeric"});
function parts(){return Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:config.timezone||"Asia/Manila",weekday:"long",hour:"2-digit",minute:"2-digit",hour12:true}).formatToParts(new Date()).map(p=>[p.type,p.value]))}
function day(){return parts().weekday.toLowerCase()}
function renderToday(){
 const classes=config.schedule?.[day()]||[], active=classes.length>0;
 dayPill.textContent=fmt.format(new Date());
 if(active){
   heroTitle.textContent=classes.length>1?classes.length+" Classes Today":classes[0].subject;
   heroSubtitle.textContent=classes.map(x=>x.subject+" • "+x.instructor).join("  |  ");
   todaySubject.textContent=classes.map(x=>x.subject).join(" / ");
   todayInstructor.textContent=classes.map(x=>x.instructor).join(" / ");
   todayTime.textContent=config.classTime||"6:00 PM"; todayMode.textContent="Online";
   const z=classes.find(x=>x.platform==="Zoom"), d=classes.find(x=>x.platform==="Discord");
   zoomBtn.href=z?.link||"#"; discordBtn.href=d?.link||"#";
   zoomBtn.classList.toggle("disabled",!z); discordBtn.classList.toggle("disabled",!d);
 } else {
   heroTitle.textContent="No Regular Class Today"; heroSubtitle.textContent="Regular ZBC online classes run Monday through Thursday.";
   todaySubject.textContent="No regular class";todayInstructor.textContent="—";todayTime.textContent="—";todayMode.textContent="—";
   zoomBtn.href="#";discordBtn.href="#";zoomBtn.classList.add("disabled");discordBtn.classList.add("disabled");
 }}
function renderSchedule(){
 const current=day(), days=["monday","tuesday","wednesday","thursday"];
 scheduleGrid.innerHTML=days.map(d=>{const items=config.schedule?.[d]||[];return '<article class="schedule-item '+(d===current?'active':'')+'>'+(d===current?'<span class="active-dot"></span>':'')+'<div class="schedule-day">'+label(d)+'</div>'+items.map(x=>'<div class="class-entry"><h4>'+x.subject+'</h4><p>'+x.instructor+'</p><p>'+config.classTime+' • '+x.platform+'</p><a class="class-link" href="'+x.link+'" target="_blank" rel="noopener">Open '+x.platform+'</a></div>').join("")+'</article>'}).join("")}
function announcements(){announcementList.innerHTML=(config.announcements||[]).map(x=>'<div class="announcement"><strong>'+x.title+'</strong><p>'+x.text+'</p></div>').join("")}
function clock(){const p=parts();liveClock.textContent=p.hour+":"+p.minute+" "+p.dayPeriod}
let deferredPrompt;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove("hidden")});installBtn.addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add("hidden")});
function online(){offlineBanner.classList.toggle("hidden",navigator.onLine)}window.addEventListener("online",online);window.addEventListener("offline",online);
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
renderToday();renderSchedule();announcements();clock();online();setInterval(clock,30000);
})();