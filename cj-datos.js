/* ── Cognitivo Junior · progreso ─────────────────────────────────────
   Todo vive en esta tableta y en ningún otro sitio. No hay servidor, no
   hay cuenta, no hay subida. Si se borran los datos del navegador, esto
   se va con ellos — y eso hay que decírselo al maestro, no esconderlo.

   Por defecto NO se apunta nada. El maestro tiene que escoger un nombre
   antes de empezar; mientras diga "sin nombre", el juego no guarda ni
   una línea. La promesa de la portada se mantiene cierta por defecto.

   Los nombres son del maestro: puede poner "Sofía", "Sofía R." o "S.R."
   Nosotros no pedimos apellido y no hacemos falta uno.
   ──────────────────────────────────────────────────────────────────── */
(function(g){
'use strict';

var K_KIDS='cj-kids', K_LOG='cj-log';

/* A quién se le está apuntando ahora. Vive FUERA del selector a
   propósito: la pantalla del maestro se redibuja cada vez que toca
   velocidad, tablero o rondas, y si esto viviera dentro del selector
   se perdería el nene en cada toque — con su nombre todavía puesto en
   la lista. Un fallo así no se ve: la maestra cree que está apuntando
   y no se apunta nada. */
var picked=null;

function read(key,fallback){
  try{ var v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }
  catch(e){ return fallback; }
}
function write(key,val){
  try{ localStorage.setItem(key,JSON.stringify(val)); return true; }
  catch(e){ return false; }   /* modo privado, espacio lleno: seguimos igual */
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7) }

var CJ={
  available:function(){
    try{ localStorage.setItem('cj-t','1'); localStorage.removeItem('cj-t'); return true; }
    catch(e){ return false; }
  },
  kids:function(){ var k=read(K_KIDS,[]); return Array.isArray(k)?k:[] },
  addKid:function(name){
    name=String(name||'').trim().slice(0,30);
    if(!name)return null;
    var ks=CJ.kids();
    var dup=ks.filter(function(x){return x.name.toLowerCase()===name.toLowerCase()})[0];
    if(dup)return dup;
    var kid={id:uid(),name:name};
    ks.push(kid); ks.sort(function(a,b){return a.name.localeCompare(b.name)});
    write(K_KIDS,ks); return kid;
  },
  removeKid:function(id){
    write(K_KIDS,CJ.kids().filter(function(k){return k.id!==id}));
    write(K_LOG,CJ.log().filter(function(e){return e.kid!==id}));
    if(picked===id)picked=null;
  },
  picked:function(){ return picked },
  kidName:function(id){
    var k=CJ.kids().filter(function(x){return x.id===id})[0];
    return k?k.name:'';
  },

  log:function(){ var l=read(K_LOG,[]); return Array.isArray(l)?l:[] },
  /* Sin nombre no se apunta nada. Es la regla, no una opción. */
  record:function(e){
    if(!e||!e.kid)return false;
    var l=CJ.log();
    l.push({
      id:uid(), kid:e.kid, game:e.game||'', at:new Date().toISOString(),
      bpm:e.bpm||null, board:e.board||'', rounds:e.rounds||0,
      perfect:e.perfect||0, helped:e.helped||0
    });
    if(l.length>2000)l=l.slice(-2000);   /* un salón entero cabe de sobra */
    return write(K_LOG,l);
  },
  forKid:function(id){
    return CJ.log().filter(function(e){return e.kid===id})
                   .sort(function(a,b){return b.at.localeCompare(a.at)});
  },
  clearAll:function(){ write(K_KIDS,[]); write(K_LOG,[]) },

  csv:function(){
    var rows=[['nene','juego','fecha','velocidad','tablero','rondas','perfectas','con ayuda']];
    CJ.log().slice().sort(function(a,b){return a.at.localeCompare(b.at)}).forEach(function(e){
      rows.push([CJ.kidName(e.kid),e.game,e.at,e.bpm,e.board,e.rounds,e.perfect,e.helped]);
    });
    return rows.map(function(r){
      return r.map(function(c){
        c=String(c==null?'':c);
        return /[",\n]/.test(c) ? '"'+c.replace(/"/g,'""')+'"' : c;
      }).join(',');
    }).join('\n');
  },

  /* El selector que sale en la pantalla del maestro, antes de empezar.
     Devuelve una función que dice a quién se le apunta — o null. */
  mountPicker:function(el,lang,onChange){
    if(!el)return function(){return null};
    var sel=null;
    var t=(lang==='en')
      ? {who:'Who is playing?', none:'— no name, nothing recorded —', add:'+ add a name',
         ph:'First name', save:'Add', cancel:'Cancel',
         off:'This browser will not keep progress (private window or storage is off).'}
      : {who:'¿Quién juega?', none:'— sin nombre, no se apunta nada —', add:'+ añadir un nombre',
         ph:'Nombre', save:'Añadir', cancel:'Cancelar',
         off:'Este navegador no va a guardar el progreso (ventana privada o almacenamiento apagado).'};

    function paint(){
      if(!CJ.available()){
        el.innerHTML='<div class="s-label">'+t.who+'</div><p class="s-hint">'+t.off+'</p>';
        return;
      }
      var ks=CJ.kids();
      el.innerHTML=
        '<div class="s-label">'+t.who+'</div>'+
        '<select class="cj-sel" id="cjWho">'+
          '<option value="">'+t.none+'</option>'+
          ks.map(function(k){
            return '<option value="'+k.id+'"'+(k.id===picked?' selected':'')+'>'+
              String(k.name).replace(/[&<>"]/g,function(m){
                return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]}) +
            '</option>';
          }).join('')+
          '<option value="__add">'+t.add+'</option>'+
        '</select>'+
        '<div id="cjAdd" style="display:none;margin-top:8px">'+
          '<input class="cj-in" id="cjName" maxlength="30" placeholder="'+t.ph+'" '+
            'autocapitalize="words" autocomplete="off">'+
          '<div style="display:flex;gap:7px;margin-top:7px">'+
            '<button class="cj-b" id="cjSave">'+t.save+'</button>'+
            '<button class="cj-b alt" id="cjCancel">'+t.cancel+'</button>'+
          '</div>'+
        '</div>';

      sel=el.querySelector('#cjWho');
      sel.onchange=function(){
        if(sel.value==='__add'){
          el.querySelector('#cjAdd').style.display='block';
          el.querySelector('#cjName').focus();
          sel.value=picked||'';
        }else{
          picked=sel.value||null;
          if(onChange)onChange(picked);
        }
      };
      el.querySelector('#cjCancel').onclick=function(){
        el.querySelector('#cjAdd').style.display='none';
      };
      el.querySelector('#cjSave').onclick=function(){
        var kid=CJ.addKid(el.querySelector('#cjName').value);
        if(kid){ picked=kid.id; if(onChange)onChange(picked); }
        paint();
      };
      el.querySelector('#cjName').onkeydown=function(ev){
        if(ev.key==='Enter'){ ev.preventDefault(); el.querySelector('#cjSave').click(); }
      };
    }
    paint();
    return function(){ return picked };
  }
};

g.CJ=CJ;
})(window);
