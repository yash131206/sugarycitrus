const nav=document.querySelector('.nav-links');const toggle=document.querySelector('.menu-toggle');
const navCard=document.querySelector('.nav');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false');if(navCard)navCard.classList.toggle('nav--open',open);});}
function closeNav(){if(nav)nav.classList.remove('open');if(toggle)toggle.setAttribute('aria-expanded','false');if(navCard)navCard.classList.remove('nav--open');}
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',closeNav));
// tapping anywhere outside the menu closes it
document.addEventListener('click',e=>{
  if(!nav||!nav.classList.contains('open'))return;
  const navEl=document.querySelector('.nav');
  if(navEl&&navEl.contains(e.target))return;
  closeNav();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();});
window.addEventListener('resize',()=>{if(window.innerWidth>850)closeNav();});
const revealAll=()=>document.querySelectorAll('.reveal:not(.visible)').forEach(el=>el.classList.add('visible'));
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -4% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  setTimeout(revealAll,1200);
}else{revealAll();}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

/* theme toggle */
(function(){
  var btn=document.querySelector('.theme-toggle');
  var root=document.documentElement;
  function sync(){
    var dark=root.getAttribute('data-theme')==='dark';
    if(btn){btn.setAttribute('aria-pressed',dark?'true':'false');btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');}
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',dark?'#11100E':'#F9F2E4');
  }
  sync();
  if(btn){btn.addEventListener('click',function(){
    var next=root.getAttribute('data-theme')==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem('theme',next);}catch(e){}
    sync();
  });}
})();
