const nav=document.querySelector('.nav-links');const toggle=document.querySelector('.menu-toggle');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false');});}
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>{if(nav)nav.classList.remove('open');if(toggle)toggle.setAttribute('aria-expanded','false');}));
const revealAll=()=>document.querySelectorAll('.reveal:not(.visible)').forEach(el=>el.classList.add('visible'));
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -4% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  setTimeout(revealAll,1200);
}else{revealAll();}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
