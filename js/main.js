/* ============================================================
   LUKE BAFFAIT — replica · motion system
   GSAP + ScrollTrigger + Lenis + SplitType
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;
const clamp = gsap.utils.clamp;

/* ---------- 1. LENIS ---------- */
let lenis;
function initLenis(){
  lenis = new Lenis({ duration:1.2, lerp:0.1, smoothWheel:true,
    easing:(t)=>Math.min(1,1.001-Math.pow(2,-10*t)) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t)=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
}

/* ---------- 2. CUSTOM CURSOR ---------- */
function initCursor(){
  if (isTouch) return;
  const ring=document.getElementById("cursor");
  const dot=document.getElementById("cursor-dot");
  const label=document.getElementById("cursor-label");
  const xR=gsap.quickTo(ring,"x",{duration:0.5,ease:"power3"});
  const yR=gsap.quickTo(ring,"y",{duration:0.5,ease:"power3"});
  const xD=gsap.quickTo(dot,"x",{duration:0.1,ease:"power3"});
  const yD=gsap.quickTo(dot,"y",{duration:0.1,ease:"power3"});
  window.addEventListener("mousemove",(e)=>{ xR(e.clientX);yR(e.clientY);xD(e.clientX);yD(e.clientY); });
  gsap.to(ring,{scale:1,duration:0.6,ease:"power3.out",delay:0.2});
  const setLabel=(t)=>{ label.textContent=t||""; gsap.to(label,{opacity:t?1:0,scale:t?1:0.6,duration:0.3}); };
  document.querySelectorAll("[data-cursor]").forEach(el=>{
    el.addEventListener("mouseenter",()=>{ gsap.to(ring,{scale:1.9,duration:0.4}); gsap.to(dot,{scale:0,duration:0.3}); setLabel(el.getAttribute("data-cursor")); });
    el.addEventListener("mouseleave",()=>{ gsap.to(ring,{scale:1,duration:0.4}); gsap.to(dot,{scale:1,duration:0.3}); setLabel(""); });
  });
  document.querySelectorAll("a:not([data-cursor]), .chr-hover, .skill-header, .st-seg").forEach(el=>{
    el.addEventListener("mouseenter",()=>gsap.to(ring,{scale:1.5,duration:0.4}));
    el.addEventListener("mouseleave",()=>gsap.to(ring,{scale:1,duration:0.4}));
  });
}

/* ---------- 3. MAGNETIC ---------- */
function initMagnetic(){
  if (isTouch) return;
  document.querySelectorAll(".magnetic").forEach(el=>{
    const inner=el.querySelector("[data-magnetic-text]")||el;
    el.addEventListener("mousemove",(e)=>{
      const r=el.getBoundingClientRect();
      const x=(e.clientX-(r.left+r.width/2))*0.4, y=(e.clientY-(r.top+r.height/2))*0.4;
      gsap.to(el,{x,y,duration:0.6,ease:"power3.out"});
      gsap.to(inner,{x:x*0.3,y:y*0.3,duration:0.6,ease:"power3.out"});
    });
    el.addEventListener("mouseleave",()=>{
      gsap.to(el,{x:0,y:0,duration:0.7,ease:"elastic.out(1,0.4)"});
      gsap.to(inner,{x:0,y:0,duration:0.7,ease:"elastic.out(1,0.4)"});
    });
  });
}

/* ---------- 4. HERO CANVAS — moving red lights ---------- */
function initHeroCanvas(){
  const cv=document.getElementById("hero-canvas");
  const ctx=cv.getContext("2d");
  let w,h,dpr;
  const blobs=[
    {x:0.30,y:0.40,r:0.55,c:[255,30,0],   a:0.55,sx:0.00007,sy:0.00009,px:0,py:1.7},
    {x:0.70,y:0.55,r:0.50,c:[255,59,20],  a:0.42,sx:0.00009,sy:0.00006,px:2.1,py:0.4},
    {x:0.55,y:0.25,r:0.40,c:[120,10,0],   a:0.60,sx:0.00011,sy:0.0001, px:4.0,py:3.1},
    {x:0.42,y:0.72,r:0.45,c:[255,40,5],   a:0.30,sx:0.00006,sy:0.00012,px:1.0,py:5.2},
    {x:0.85,y:0.30,r:0.35,c:[80,0,0],     a:0.50,sx:0.00008,sy:0.00007,px:3.3,py:2.0},
  ];
  let intensity=1;        // dimmed as you scroll past hero
  function resize(){
    dpr=Math.min(2,window.devicePixelRatio||1);
    w=cv.clientWidth; h=cv.clientHeight;
    cv.width=w*dpr; cv.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,1,1);
  }
  resize(); window.addEventListener("resize",resize);
  function draw(t){
    ctx.globalCompositeOperation="source-over";
    ctx.fillStyle="#0a0a0a"; ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation="lighter";
    const D=Math.max(w,h);
    blobs.forEach(b=>{
      const bx=(b.x+Math.sin(t*b.sx+b.px)*0.16)*w;
      const by=(b.y+Math.cos(t*b.sy+b.py)*0.16)*h;
      const rad=b.r*D*(0.85+Math.sin(t*0.0004+b.px)*0.15);
      const g=ctx.createRadialGradient(bx,by,0,bx,by,rad);
      const a=b.a*intensity;
      g.addColorStop(0,`rgba(${b.c[0]},${b.c[1]},${b.c[2]},${a})`);
      g.addColorStop(0.5,`rgba(${b.c[0]},${b.c[1]},${b.c[2]},${a*0.25})`);
      g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(bx,by,rad,0,Math.PI*2); ctx.fill();
    });
    // subtle grain-free vignette
    ctx.globalCompositeOperation="source-over";
    const v=ctx.createRadialGradient(w/2,h/2,h*0.2,w/2,h/2,h*0.85);
    v.addColorStop(0,"rgba(0,0,0,0)"); v.addColorStop(1,"rgba(0,0,0,0.55)");
    ctx.fillStyle=v; ctx.fillRect(0,0,w,h);
  }
  gsap.ticker.add(()=>draw(performance.now()));
  return { setIntensity:(v)=>{ intensity=v; } };
}

/* ---------- 5. PRELOADER ---------- */
function runPreloader(onDone){
  const luke=document.getElementById("pl-luke");
  const baf=document.getElementById("pl-baffait");
  const dot=document.querySelector(".pl-dot");
  const counter=document.getElementById("pl-counter");
  const tag=document.getElementById("pl-tag");
  const introBg=document.getElementById("intro-bg");
  const nameLayer=document.getElementById("name-layer");
  if (lenis) lenis.stop();

  // GSAP must fully own these transforms: zero the `y` so the CSS translateY(100%)
  // (parsed as y:899px) doesn't linger and cancel the yPercent sweep.
  gsap.set([".t-panel-red",".t-panel-dark"],{yPercent:100, y:0});
  gsap.set("#intro-bg",{yPercent:0, y:0});

  // guarantee a clean end state no matter what
  const finish=()=>{
    gsap.set(["#intro-bg",".t-panel-red",".t-panel-dark"],{yPercent:-100});
    gsap.set(nameLayer,{display:"none"});
    if(lenis)lenis.start();
    onDone&&onDone();
  };

  const obj={v:0};
  let introStarted=false;
  const startHero=()=>{ if(introStarted)return; introStarted=true; heroIntro(); };

  const tl=gsap.timeline({ defaults:{ease:"power3.out"}, onComplete:()=>{ if(lenis)lenis.start(); onDone&&onDone(); }});
  tl.to(tag,{opacity:1,duration:0.6},0.1)
    .fromTo(luke,{opacity:0,yPercent:40},{opacity:1,yPercent:0,duration:0.9},0.2)
    .fromTo(baf,{opacity:0,yPercent:40},{opacity:1,yPercent:0,duration:0.9},0.32)
    .fromTo(dot,{opacity:0,scale:0},{opacity:1,scale:1,duration:0.6,ease:"back.out(2)"},0.5)
    .to(obj,{v:100,duration:2.0,ease:"power2.inOut",onUpdate:()=>{counter.textContent=String(Math.round(obj.v)).padStart(3,"0");}},0.2)
    .to([luke,baf,dot,counter,tag],{opacity:0,yPercent:-30,duration:0.5,stagger:0.04,ease:"power3.in"},2.35)
    .set(nameLayer,{display:"none"},2.95)
    // single continuous sweep per layer (cover + lift in one motion → no tween conflict)
    .fromTo(".t-panel-red",{yPercent:100},{yPercent:-100,duration:1.15,ease:"power4.inOut"},2.9)
    .fromTo(".t-panel-dark",{yPercent:100},{yPercent:-100,duration:1.15,ease:"power4.inOut"},3.08)
    .to("#intro-bg",{yPercent:-100,duration:1.0,ease:"expo.inOut"},3.32)
    .add(startHero,3.5);
  window.__pl=tl; // debug: seek with __pl.progress(1)
  return tl;
}

/* ---------- 6. HERO INTRO ---------- */
function heroIntro(){
  const tl=gsap.timeline({defaults:{ease:"expo.out"}});
  tl.fromTo(".hero-tagline",{opacity:0,yPercent:20},{opacity:1,yPercent:0,duration:1.1},0)
    .fromTo(".hero-bar",{opacity:0,yPercent:30},{opacity:1,yPercent:0,duration:1.1},0.1)
    .fromTo(".scroll-pct, .scroll-timeline",{opacity:0},{opacity:1,duration:0.6,onComplete:()=>{
        document.getElementById("scroll-pct").classList.add("visible");
        document.getElementById("scroll-timeline").classList.add("visible");
      }},0.4);
  // split hero name letters
  const hn=new SplitType(".hero-name",{types:"chars"});
  tl.from(hn.chars,{yPercent:120,opacity:0,duration:0.9,stagger:0.03},0.2);
}

/* ---------- 7. HERO SCROLL — reveal photo opens + 360 ---------- */
function initHeroScroll(heroCanvas){
  const img=document.getElementById("reveal-image");
  const frame=document.getElementById("reveal-frame");
  const overlay=document.getElementById("reveal-overlay");
  const phraseEl=document.getElementById("reveal-phrase");
  const ps=new SplitType(phraseEl,{types:"chars"});
  ps.chars.forEach(c=>c.classList.add("rp-char"));
  gsap.set(ps.chars,{opacity:0,yPercent:80});

  const tl=gsap.timeline({
    scrollTrigger:{ trigger:".scroll-wrap", start:"top top", end:"bottom bottom", scrub:1,
      onUpdate:(self)=>{ if(heroCanvas) heroCanvas.setIntensity(1-self.progress*0.65); } }
  });
  // image opens
  tl.to(img,{scale:1,duration:1.2,ease:"power2.out"},0.3)
    .to(frame,{scale:1,duration:1.2,ease:"power2.out"},0.3)
    .to(ps.chars,{opacity:1,yPercent:0,duration:1,stagger:0.04,ease:"power3.out"},0.5)
    // 360 spin
    .to(img,{rotationY:360,duration:3,ease:"none"},0.9)
    .to(phraseEl,{opacity:0,duration:0.6},1.6)
    // fade hero content out as we leave
    .to(".hero-tagline, .hero-bar",{opacity:0,duration:0.8},2.0)
    .to(img,{scale:1.15,duration:1.2,ease:"power2.in"},2.6)
    .to(overlay,{opacity:1,duration:1,ease:"power2.in"},3.0)
    .to([img,frame],{scale:0,opacity:0,duration:0.6},3.6);
}

/* ---------- 8. RED FLUID WAVE ---------- */
function initFluidLine(){
  const svg=document.getElementById("fluid-svg");
  const path=document.getElementById("fluid-line");
  const host=document.querySelector(".section-after");
  let W=0,H=0, scrollPhase=0, vh=window.innerHeight;

  function measure(){
    W=host.clientWidth; H=host.clientHeight; vh=window.innerHeight;
    svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
    svg.setAttribute("width",W); svg.setAttribute("height",H);
  }
  // smooth ribbon: dense samples, sine wave with a viewport-relative wavelength,
  // amplitude tapered by an envelope, animated by scroll + a gentle continuous drift.
  function build(time){
    const midX=W*0.5;
    const amp=Math.min(W*0.30, 360);
    const lambda=Math.max(vh*1.45, 680);      // one full weave ≈ 1.45 viewports
    const step=Math.max(20, H/440);
    const phase=scrollPhase + time*0.00022;    // scroll travel + slow flow
    const k=(Math.PI*2)/lambda;
    let d="";
    for(let y=-80; y<=H+80; y+=step){
      const t=Math.min(Math.max(y/H,0),1);
      const env=0.32+0.68*Math.sin(t*Math.PI);                       // thin at top/bottom
      const x=midX + Math.sin(y*k + phase)*amp*env
                   + Math.sin(y*k*0.37 + phase*0.6)*amp*0.18*env;     // 2nd harmonic = organic
      d+=(d===""?"M":"L")+x.toFixed(1)+" "+y.toFixed(1)+" ";
    }
    path.setAttribute("d",d);
  }
  measure(); build(0);
  window.addEventListener("resize",()=>{ measure(); build(performance.now()); });
  ScrollTrigger.create({
    trigger:host, start:"top bottom", end:"bottom top", scrub:true,
    onUpdate:(self)=>{ scrollPhase=self.progress*Math.PI*5; }
  });
  gsap.ticker.add(()=>build(performance.now()));   // continuous, alive
}

/* ---------- 9. ABOUT: word highlight + photo ---------- */
function initAbout(){
  document.querySelectorAll("[data-words]").forEach(el=>{
    const s=new SplitType(el,{types:"words"});
    gsap.set(s.words,{opacity:0.18});
    gsap.to(s.words,{opacity:1,stagger:0.4,ease:"none",
      scrollTrigger:{trigger:el,start:"top 82%",end:"bottom 62%",scrub:true}});
  });
  gsap.to("#about-photo",{opacity:1,filter:"blur(0px)",duration:1.4,ease:"power3.out",
    scrollTrigger:{trigger:".about",start:"top 70%"}});
  gsap.fromTo("#about-photo",{yPercent:12},{yPercent:-12,ease:"none",
    scrollTrigger:{trigger:".about",start:"top bottom",end:"bottom top",scrub:true}});
  gsap.from(".about-sub, .about-meta",{y:40,opacity:0,duration:1,ease:"power3.out",stagger:0.1,
    scrollTrigger:{trigger:".about-sub",start:"top 85%"}});
}

/* ---------- 10. PROJECTS hover preview ---------- */
function initProjects(){
  gsap.from(".proj-item",{y:50,opacity:0,duration:0.9,ease:"power3.out",stagger:0.06,
    scrollTrigger:{trigger:".projects-list",start:"top 80%"}});
  if (isTouch) return;
  const prev=document.getElementById("proj-preview");
  const card=document.getElementById("proj-card");
  const xTo=gsap.quickTo(prev,"x",{duration:0.6,ease:"power3"});
  const yTo=gsap.quickTo(prev,"y",{duration:0.6,ease:"power3"});
  const list=document.getElementById("projects-list");
  list.addEventListener("mousemove",(e)=>{ xTo(e.clientX); yTo(e.clientY); });
  document.querySelectorAll(".proj-item").forEach(it=>{
    it.addEventListener("mouseenter",()=>{
      card.style.backgroundImage=`url(${it.getAttribute("data-img")})`;
      gsap.to(prev,{opacity:1,scale:1,rotate:0,duration:0.5,ease:"power3.out"});
      gsap.fromTo(card,{scale:1.3},{scale:1,duration:0.7,ease:"power3.out"});
    });
    it.addEventListener("mouseleave",()=>gsap.to(prev,{opacity:0,scale:0.7,rotate:-6,duration:0.4}));
  });
}

/* ---------- 11. CIRCLE GALLERY 360 ---------- */
function initGallery(){
  const ring=document.getElementById("cg-ring");
  const N=14, radius= Math.min(window.innerWidth*0.62, 760);
  for(let i=0;i<N;i++){
    const d=document.createElement("div");
    d.className="cg-img";
    d.style.backgroundImage=`url(https://picsum.photos/seed/cg${i+3}/360/240)`;
    const ang=(360/N)*i;
    d.style.transform=`rotateY(${ang}deg) translateZ(${radius}px)`;
    ring.appendChild(d);
  }
  gsap.set(ring,{rotationX:-6});
  gsap.to(ring,{rotationY:-300,ease:"none",
    scrollTrigger:{trigger:".circle-gallery",start:"top top",end:"bottom bottom",scrub:1}});
  // center phrase words blur-in then out
  const words=document.querySelectorAll(".cg-phrase .word");
  gsap.to(words,{opacity:1,filter:"blur(0px)",stagger:0.12,ease:"power2.out",
    scrollTrigger:{trigger:".circle-gallery",start:"top top",end:"40% top",scrub:true}});
  gsap.to(words,{opacity:0,filter:"blur(8px)",stagger:0.08,ease:"power2.in",
    scrollTrigger:{trigger:".circle-gallery",start:"65% top",end:"bottom bottom",scrub:true}});
}

/* ---------- 12. SKILLS accordion ---------- */
function initSkills(){
  const groups=document.querySelectorAll(".skill-group");
  const setH=(g,open)=>{ const body=g.querySelector(".skill-body");
    gsap.to(body,{height:open?body.scrollHeight:0,duration:0.55,ease:"power3.inOut"}); };
  groups.forEach(g=>{
    const body=g.querySelector(".skill-body");
    gsap.set(body,{height:g.classList.contains("open")?"auto":0});
    g.querySelector(".skill-header").addEventListener("click",()=>{
      const willOpen=!g.classList.contains("open");
      groups.forEach(o=>{ if(o!==g && o.classList.contains("open")){ o.classList.remove("open"); setH(o,false);} });
      g.classList.toggle("open",willOpen); setH(g,willOpen);
    });
  });
  gsap.from(".skill-group",{y:40,opacity:0,duration:0.8,ease:"power3.out",stagger:0.08,
    scrollTrigger:{trigger:".skills-right",start:"top 82%"}});
  gsap.from(".skills-left > *",{y:40,opacity:0,duration:0.9,ease:"power3.out",stagger:0.1,
    scrollTrigger:{trigger:".skills",start:"top 75%"}});
}

/* ---------- 13. AWARDS ---------- */
function initAwards(){
  gsap.from(".award-item",{y:50,opacity:0,duration:0.9,ease:"power3.out",stagger:0.1,
    scrollTrigger:{trigger:".awards-list",start:"top 82%"}});
}

/* ---------- 14. CONTACT blob flood ---------- */
function initContact(){
  const tl=gsap.timeline({scrollTrigger:{trigger:".contact",start:"top top",end:"bottom bottom",scrub:1}});
  tl.to("#contact-blob",{scale:1,duration:1,ease:"power2.inOut"},0);
  // reveal content elements once flooded
  gsap.from(".contact-label, .contact-title, .contact-frame, .contact-mail, .contact-dispo",
    {y:60,opacity:0,duration:1,ease:"power3.out",stagger:0.08,
     scrollTrigger:{trigger:".contact",start:"top 30%"}});
}

/* ---------- 15. FOOTER name ---------- */
function initFooter(){
  gsap.from(".footer-name .fn-word",{yPercent:110,opacity:0,duration:1.1,ease:"expo.out",stagger:0.1,
    scrollTrigger:{trigger:".footer",start:"top 75%"}});
  gsap.from(".footer-top-col",{y:40,opacity:0,duration:0.9,ease:"power3.out",stagger:0.08,
    scrollTrigger:{trigger:".footer-top",start:"top 88%"}});
}

/* ---------- 16. SCROLL UI (pct + timeline) ---------- */
function initScrollUI(){
  const pct=document.getElementById("scroll-pct");
  const bar=document.getElementById("st-bar");
  const label=document.getElementById("st-label");
  const sections=[
    {sel:".hero",name:"Hero"},{sel:".about",name:"About"},{sel:".projects",name:"Works"},
    {sel:".circle-gallery",name:"Gallery"},{sel:".skills",name:"Skills"},
    {sel:".awards",name:"Awards"},{sel:".contact",name:"Contact"}
  ];
  const segs=sections.map(()=>{ const s=document.createElement("div"); s.className="st-seg"; bar.appendChild(s); return s; });
  segs.forEach((s,i)=>s.addEventListener("click",()=>{
    const el=document.querySelector(sections[i].sel); if(el&&lenis) lenis.scrollTo(el,{duration:1.4});
  }));
  let hideT;
  ScrollTrigger.create({
    start:0,end:"max",
    onUpdate:(self)=>{
      const p=self.progress;
      pct.textContent=String(Math.round(p*100)).padStart(3,"0");
      // active section
      const scy=window.scrollY+window.innerHeight*0.4;
      let active=0;
      sections.forEach((sc,i)=>{ const el=document.querySelector(sc.sel); if(el){ const top=el.getBoundingClientRect().top+window.scrollY; if(scy>=top) active=i; } });
      segs.forEach((s,i)=>s.classList.toggle("active",i===active));
      label.textContent=sections[active].name;
      label.style.top=(active/(sections.length-1)*100)+"%";
      // show while scrolling
      pct.classList.add("visible"); document.getElementById("scroll-timeline").classList.add("visible");
      clearTimeout(hideT);
      hideT=setTimeout(()=>{ pct.classList.remove("visible"); document.getElementById("scroll-timeline").classList.remove("visible"); },1400);
    }
  });
}

/* ---------- 17. clock + anchors ---------- */
function initClock(){
  const el=document.getElementById("hero-clock"); if(!el) return;
  const up=()=>{ el.textContent=new Date().toLocaleTimeString("fr-FR",{timeZone:"Europe/Paris",hour:"2-digit",minute:"2-digit"})+" CET"; };
  up(); setInterval(up,1000);
}
function initAnchors(){
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",(e)=>{ const id=a.getAttribute("href"); if(id.length<2)return;
      const t=document.querySelector(id); if(!t)return; e.preventDefault(); lenis?lenis.scrollTo(t,{duration:1.4}):t.scrollIntoView(); });
  });
  const top=document.getElementById("back-top"); if(top)top.addEventListener("click",()=>lenis&&lenis.scrollTo(0,{duration:1.6}));
}

/* ---------- BOOT ---------- */
let booted=false;
function boot(){
  if (booted) return; booted=true;
  if ("scrollRestoration" in history) history.scrollRestoration="manual";
  window.scrollTo(0,0);

  initLenis(); initCursor(); initMagnetic(); initClock(); initAnchors();
  const heroCanvas=initHeroCanvas();
  initHeroScroll(heroCanvas);
  initFluidLine();
  initAbout(); initProjects(); initGallery(); initSkills(); initAwards(); initContact(); initFooter();
  initScrollUI();

  if (reduce){
    gsap.set(["#intro-bg","#name-layer",".transition-panel"],{display:"none"});
    if(lenis) lenis.start();
    heroIntro();
  } else {
    if(lenis) lenis.stop();
    runPreloader();
    // safety net: if the intro never lifts (e.g. ticker stalled), force-reveal
    window.setTimeout(()=>{
      const ib=document.getElementById("intro-bg");
      if(ib && new DOMMatrix(getComputedStyle(ib).transform).m42 > -50){
        gsap.set(["#intro-bg",".t-panel-red",".t-panel-dark"],{yPercent:-100,y:0});
        gsap.set("#name-layer",{display:"none"});
        if(lenis) lenis.start();
        heroIntro();
      }
    }, 9000);
  }
  ScrollTrigger.refresh();
  window.setTimeout(()=>ScrollTrigger.refresh(), 1400);
  window.addEventListener("load",()=>ScrollTrigger.refresh());
}

if (document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
