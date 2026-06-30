
(function(){
  if(window.__TW_CHAT__) return;
  var IM='<path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/>';
  var IX='<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>';
  function svg(i){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+i+'</svg>';}
  function esc(s){var d=document.createElement("div");d.textContent=(s==null?"":String(s));return d.innerHTML;}
  function SB(){return window.__TIB_SB__||{};}
  var SBC=null;try{var _sb0=SB();if(window.supabase&&window.supabase.createClient&&_sb0.url){SBC=window.supabase.createClient(_sb0.url,_sb0.key,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});}}catch(e){}
  function tok(cb){if(!SBC){cb(null);return;}try{SBC.auth.getSession().then(function(r){var s=r&&r.data?r.data.session:null;cb(s?s.access_token:null);}).catch(function(){cb(null);});}catch(e){cb(null);}}
  function rpc(fn,body,cb){try{var sb=SB();tok(function(t){fetch(sb.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{'apikey':sb.key,'Authorization':'Bearer '+(t||sb.key),'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.ok?r.json():null;}).then(function(j){cb(j);}).catch(function(){cb(null);});});}catch(e){cb(null);}}
  function bubble(side,text){return '<div class="twr-row '+side+'"><div class="twr-bubble"><div class="twr-b-text">'+esc(text)+'</div></div></div>';}
  var cur=null;
  function close(){if(!cur)return;if(cur.poll){clearInterval(cur.poll);cur.poll=null;}var ov=cur.ov;cur=null;ov.classList.remove("in");document.removeEventListener("keydown",onKey,true);setTimeout(function(){if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);},200);}
  function onKey(e){if(e.key==="Escape"){e.stopPropagation();close();}}
  window.__TW_CHAT__=function(conv,info){
    info=info||{};if(!conv)return;close();
    var sub=(info.type||"").replace(/^\uCC57\uBD07[\u00B7\u30FB\s]*/,"")||"\uCC44\uD305 \uC0C1\uB2F4";
    var ov=document.createElement("div");ov.className="twr-ovl";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.setAttribute("aria-label","\uC0C1\uB2F4 \uB0B4\uC5ED");
    ov.innerHTML='<button class="twr-x" type="button" aria-label="\uB2EB\uAE30">'+svg(IX)+'</button>'+
      '<div class="twr-card">'+
        '<div class="twr-hd"><span class="twr-hd-ic">'+svg(IM)+'</span><div><div class="twr-hd-name">\uC0C1\uB2F4 \uB0B4\uC5ED</div><div class="twr-hd-sub">'+esc(sub)+'</div></div></div>'+
        '<div class="twr-body"><div class="twr-note" role="status"></div></div>'+
        '<div class="twr-endbar"><button class="twr-end" type="button">\uC0C1\uB2F4 \uC885\uB8CC</button></div>'+
        '<div class="twr-foot"><textarea class="twr-input" rows="1" placeholder="\uBA54\uC2DC\uC9C0\uB97C \uC785\uB825\uD558\uC138\uC694\u2026 (Ctrl/\u2318+Enter)"></textarea><button class="twr-send" type="button">'+svg(IM)+'\uBCF4\uB0B4\uAE30</button></div>'+
      '</div>';
    document.body.appendChild(ov);cur={ov:ov};
    var body=ov.querySelector(".twr-body"),input=ov.querySelector(".twr-input"),sendBtn=ov.querySelector(".twr-send"),note=ov.querySelector(".twr-note"),endBtn=ov.querySelector(".twr-end");
    var seen={},closed=false,sending=false;
    function showNote(m,e){note.textContent=m;note.className="twr-note show"+(e?" err":"");}
    function addB(side,text){note.insertAdjacentHTML("beforebegin",bubble(side,text));body.scrollTop=body.scrollHeight;}
    function addSys(t){note.insertAdjacentHTML("beforebegin",'<div class="twr-sys">'+esc(t)+'</div>');body.scrollTop=body.scrollHeight;}
    function setClosed(c){closed=c;input.disabled=c;sendBtn.disabled=c;endBtn.disabled=c;endBtn.textContent=c?"\uC885\uB8CC\uB428":"\uC0C1\uB2F4 \uC885\uB8CC";}
    function render(list){(list||[]).forEach(function(m){if(!m||seen[m.id])return;seen[m.id]=1;if(m.sender==="system"){addSys(m.body);setClosed(true);}else if(m.sender==="admin"){addB("recv",m.body);setClosed(false);}else{addB("sent",m.body);setClosed(false);}});}
    function load(){rpc("chat_list",{p_conversation:conv},function(list){if(list&&list.length){render(list);}else{addSys("\uB300\uD654 \uB0B4\uC5ED\uC774 \uC5C6\uC5B4\uC694.");}});}
    function autoGrow(){input.style.height="auto";input.style.height=Math.min(120,input.scrollHeight)+"px";}
    input.addEventListener("input",autoGrow);
    function send(){if(sending||closed)return;var t=(input.value||"").trim();if(!t){input.focus();return;}sending=true;sendBtn.disabled=true;rpc("chat_user_post",{p_conversation:conv,p_body:t},function(row){sending=false;sendBtn.disabled=false;if(!(row&&row.id)){showNote("\uC804\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.",true);return;}seen[row.id]=1;addB("sent",t);input.value="";autoGrow();input.focus();});}
    sendBtn.addEventListener("click",send);
    input.addEventListener("keydown",function(e){if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();send();}});
    endBtn.addEventListener("click",function(){if(closed)return;endBtn.disabled=true;rpc("close_chat",{p_conversation:conv,p_by:"user"},function(row){if(!row){endBtn.disabled=false;showNote("\uC885\uB8CC\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.",true);return;}if(row.id)seen[row.id]=1;addSys("\uC0C1\uB2F4\uC774 \uC885\uB8CC\uB418\uC5C8\uC5B4\uC694.");setClosed(true);});});
    ov.querySelector(".twr-x").addEventListener("click",close);
    ov.addEventListener("mousedown",function(e){if(e.target===ov)close();});
    document.addEventListener("keydown",onKey,true);
    load();
    cur.poll=setInterval(function(){rpc("chat_list",{p_conversation:conv},function(list){render(list);});},4000);
    requestAnimationFrame(function(){ov.classList.add("in");setTimeout(function(){try{input.focus();}catch(e){}},120);});
  };
})();
