/* ── Cognitivo Junior · la puerta ────────────────────────────────────
   Se escribe el código UNA VEZ por equipo y queda guardado hasta que se
   vence. No por sesión: una maestra de preescolar no va a escribir un
   código cada mañana, y si se lo pides, deja de abrir el juego.

   Funciona sin internet. Se valida una vez contra el servidor, se
   guarda la fecha de corte, y de ahí en adelante el juego abre con la
   tableta desconectada. En muchos centros el wifi no llega al salón.

   Vuelve a verificar en silencio cada siete días cuando haya señal —
   así un código apagado deja de servir aunque el equipo haya estado
   semanas sin conexión.

   Esto no es un candado y no pretende serlo. Quien quiera saltárselo
   con las herramientas del navegador puede. Lo que se vende es una
   licencia institucional, no una cerradura.
   ──────────────────────────────────────────────────────────────────── */
(function(g){
'use strict';

var SB='https://sdaphocueugzfvjovuxd.supabase.co';
var KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYXBob2N1ZXVnemZ2am92dXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjQyMDgsImV4cCI6MjA5OTIwMDIwOH0.pDAzf4P6dD9eNEBlnP95SdF5BI-R84-Rdc0vKzYcn7M';
var K='cj-acceso';
var RECHECK_DAYS=7;

function hoy(){ return new Date().toISOString().slice(0,10) }
function diasDesde(iso){
  if(!iso)return 999;
  try{ return Math.floor((Date.now()-new Date(iso).getTime())/86400000) }catch(e){ return 999 }
}
function leer(){
  try{ var v=localStorage.getItem(K); return v?JSON.parse(v):null }catch(e){ return null }
}
function guardar(v){
  try{ localStorage.setItem(K,JSON.stringify(v)); return true }catch(e){ return false }
}
function borrar(){ try{ localStorage.removeItem(K) }catch(e){} }

function rpc(name,args){
  return fetch(SB+'/rest/v1/rpc/'+name,{
    method:'POST',
    headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify(args||{})
  }).then(function(r){ if(!r.ok)throw new Error('rpc '+r.status); return r.json() });
}

/* Vale mientras no tenga fecha, o la fecha no haya pasado. */
function vigente(c){
  if(!c||!c.code)return false;
  if(!c.until)return true;
  return c.until >= hoy();
}

var T={
  es:{
    t:'Cognitivo Junior',
    p:'Escribe el código de tu centro. Se escribe una sola vez en esta tableta.',
    ph:'CJ-••••-••••',
    go:'Entrar',
    bad:'Ese código no sirve. Míralo otra vez.',
    exp:'Ese código se venció el {D}. Escríbenos y lo renovamos.',
    net:'No hay conexión. Si ya habías entrado en esta tableta, los juegos abren igual.',
    off:'Este navegador no puede guardar el acceso (ventana privada). Prueba en una ventana normal.',
    bye:'Salir de este centro'
  },
  en:{
    t:'Cognitivo Junior',
    p:'Enter your centre’s code. You type it once on this tablet.',
    ph:'CJ-••••-••••',
    go:'Enter',
    bad:'That code does not work. Check it again.',
    exp:'That code ended on {D}. Write to us and we will renew it.',
    net:'No connection. If you already signed in on this tablet, the games still open.',
    off:'This browser cannot store the access (private window). Try a normal window.',
    bye:'Leave this centre'
  }
};
var LANG='es';
try{ LANG=localStorage.getItem('cfh_lang')||localStorage.getItem('cp-lang')||
  localStorage.getItem('fc-lang')||
  ((navigator.language||'').toLowerCase().indexOf('es')===0?'es':'en'); }catch(e){}
function t(k){ return (T[LANG]&&T[LANG][k])||T.es[k] }

function fecha(d){
  if(!d)return '';
  try{ return new Date(d+'T12:00:00').toLocaleDateString(LANG==='es'?'es-PR':'en-US',
        {day:'numeric',month:'long',year:'numeric'}); }catch(e){ return d }
}

function pintarPuerta(onOk){
  var o=document.createElement('div');
  o.id='cjGate';
  o.innerHTML=
    '<style>'+
    '#cjGate{position:fixed;inset:0;z-index:99999;background:#FAF7F2;color:#3A4A5A;'+
      'font-family:"Trebuchet MS","Segoe UI",Arial,sans-serif;display:flex;align-items:center;'+
      'justify-content:center;padding:24px;overflow-y:auto}'+
    '#cjGate .cx{width:100%;max-width:380px;text-align:center}'+
    '#cjGate h2{font-size:1.5rem;font-weight:800;letter-spacing:-.025em;margin:0 0 8px}'+
    '#cjGate h2 i{font-style:normal;color:#F0B429}'+
    '#cjGate p{font-size:.92rem;color:#7D8C9A;margin:0 0 20px;line-height:1.5}'+
    '#cjGate input{width:100%;padding:16px;border:2px solid #D0DCE5;border-radius:14px;'+
      'background:#fff;color:#3A4A5A;font:inherit;font-size:1.25rem;text-align:center;'+
      'font-family:"SFMono-Regular",Consolas,Menlo,monospace;letter-spacing:.05em}'+
    '#cjGate input:focus{outline:none;border-color:#5B8DB8;box-shadow:0 0 0 3px rgba(91,141,184,.15)}'+
    '#cjGate button{width:100%;margin-top:14px;padding:17px;border:none;border-radius:16px;'+
      'background:#5B8DB8;color:#fff;font:inherit;font-size:1.05rem;font-weight:800;cursor:pointer}'+
    '#cjGate .m{margin-top:14px;font-size:.9rem;font-weight:700;min-height:1.2em;color:#C96A5B}'+
    '</style>'+
    '<div class="cx">'+
      '<h2>Cognitivo <i>Junior</i></h2>'+
      '<p>'+t('p')+'</p>'+
      '<input id="cjGateIn" type="text" maxlength="14" placeholder="'+t('ph')+'" '+
        'autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="go">'+
      '<button id="cjGateGo">'+t('go')+'</button>'+
      '<p class="m" id="cjGateMsg"></p>'+
    '</div>';
  document.body.appendChild(o);

  var inp=o.querySelector('#cjGateIn'), btn=o.querySelector('#cjGateGo'), msg=o.querySelector('#cjGateMsg');
  function say(s){ msg.textContent=s||'' }

  function probar(){
    var v=(inp.value||'').trim();
    if(!v)return;
    btn.disabled=true; say('…');
    rpc('cj_code_check',{p_code:v})
      .then(function(r){
        btn.disabled=false;
        if(!r||!r.ok){
          if(r&&r.reason==='expired') return say(t('exp').replace('{D}',fecha(r.until)));
          return say(t('bad'));
        }
        var c={code:v.toUpperCase(),site:r.site,kind:r.kind,until:r.until,checked:new Date().toISOString()};
        if(!guardar(c)) return say(t('off'));
        o.remove();
        onOk(c);
      })
      .catch(function(e){ console.error(e); btn.disabled=false; say(t('net')) });
  }
  btn.onclick=probar;
  inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){e.preventDefault();probar()} });
  setTimeout(function(){ try{ inp.focus() }catch(e){} },80);
}

/* Verificación callada: si el código se apagó o se venció, la próxima
   vez que haya señal la tableta se entera y cierra la puerta. */
function revisarCallado(c){
  if(diasDesde(c.checked) < RECHECK_DAYS) return;
  rpc('cj_code_check',{p_code:c.code}).then(function(r){
    if(r&&r.ok){
      c.until=r.until; c.site=r.site; c.kind=r.kind;
      c.checked=new Date().toISOString(); guardar(c);
    }else if(r&&(r.reason==='code'||r.reason==='expired')){
      borrar();   /* se cierra en la próxima apertura, no de golpe a media sesión */
    }
  }).catch(function(){});
}

var CJA={
  /* El juego llama a esto y le pasa lo que hace cuando ya hay acceso. */
  guard:function(onOk){
    var c=leer();
    if(vigente(c)){
      try{ revisarCallado(c) }catch(e){}
      pintarSitio(c);
      if(onOk)onOk(c);
      return;
    }
    if(c) borrar();
    if(document.body) pintarPuerta(function(cc){ pintarSitio(cc); if(onOk)onOk(cc) });
    else document.addEventListener('DOMContentLoaded',function(){
      pintarPuerta(function(cc){ pintarSitio(cc); if(onOk)onOk(cc) });
    });
  },
  info:function(){ var c=leer(); return vigente(c)?c:null },
  site:function(){ var c=leer(); return vigente(c)?c.site:'' },
  /* Para el panel del maestro: soltar este centro de esta tableta. */
  forget:function(){ borrar() },
  label:function(){ return t('bye') }
};

/* El nombre del centro, donde el maestro lo vea. Es lo único que
   desalienta que el código ande de centro en centro — y es social, no
   técnico, que es todo lo que hace falta aquí. */
function pintarSitio(c){
  var el=document.getElementById('cjSite');
  if(!el||!c)return;
  el.textContent=c.site+(c.kind==='prueba'&&c.until?' · '+(LANG==='es'?'prueba hasta ':'trial until ')+fecha(c.until):'');
}

g.CJA=CJA;
})(window);
