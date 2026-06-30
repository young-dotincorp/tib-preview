
(function(){
  "use strict";
  if (window.__TW_REPLY__) return;
  var ICON_MSG='<path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/>';
  var ICON_X='<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>';
  function svg(inner){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+inner+'</svg>';}
  function esc(s){var d=document.createElement("div");d.textContent=(s==null?"":String(s));return d.innerHTML;}
  function clean(t){return (t||"").replace(/^\uCC57\uBD07[\u00B7\u30FB\s]*/,"");}
  function bubble(side,text,metaCls,metaText){
    return '<div class="twr-row '+side+'"><div class="twr-bubble"><div class="twr-b-text">'+esc(text)+'</div>'+
      (metaText?'<div class="'+metaCls+'">'+esc(metaText)+'</div>':'')+'</div></div>';
  }
  var cur=null;
  function close(){
    if(!cur)return;
    if(cur.poll){clearInterval(cur.poll);cur.poll=null;}
    var ov=cur.ov; cur=null;
    ov.classList.remove("in");
    document.removeEventListener("keydown",onKey,true);
    setTimeout(function(){ if(ov&&ov.parentNode) ov.parentNode.removeChild(ov); }, 200);
  }
  function onKey(e){ if(e.key==="Escape"){ e.stopPropagation(); close(); } }
  window.__TW_REPLY__ = function(inq, sb, onDone){
    inq = inq || {};
    close();
    var name = inq.name || "\uBC29\uBB38\uC790";
    var sub  = clean(inq.type) || "\uCC57\uBD07 \uBB38\uC758";
    var ov = document.createElement("div");
    ov.className="twr-ovl";
    ov.setAttribute("role","dialog");
    ov.setAttribute("aria-modal","true");
    ov.setAttribute("aria-label", name+" \uB2D8\uC758 \uBB38\uC758 \uB2F5\uBCC0");
    var existing = (inq.reply!=null && String(inq.reply).trim()!=="")
      ? bubble("sent", inq.reply, "twr-b-time", "\uC774\uBBF8 \uBCF4\uB0B8 \uB2F5\uBCC0") : "";
    ov.innerHTML =
      '<button class="twr-x" type="button" aria-label="\uB2EB\uAE30">'+svg(ICON_X)+'</button>'+
      '<div class="twr-card">'+
        '<div class="twr-hd"><span class="twr-hd-ic">'+svg(ICON_MSG)+'</span>'+
          '<div><div class="twr-hd-name">'+esc(name)+'</div><div class="twr-hd-sub">'+esc(sub)+(inq.email?' \u00B7 '+esc(inq.email):'')+'</div></div></div>'+
        '<div class="twr-body">'+'<div class="twr-note" role="status"></div>'+
        '</div>'+
        '<div class="twr-endbar"><button class="twr-end" type="button">상담 종료</button></div>'+'<div class="twr-foot">'+
          '<textarea class="twr-input" rows="1" placeholder="\uB2F5\uBCC0\uC744 \uC785\uB825\uD558\uC138\uC694\u2026 (Ctrl/\u2318+Enter\uB85C \uC804\uC1A1)"></textarea>'+
          '<button class="twr-send" type="button">'+svg(ICON_MSG)+'\uBCF4\uB0B4\uAE30</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(ov);
    cur = {ov:ov};
    var body=ov.querySelector(".twr-body");
    var input=ov.querySelector(".twr-input");
    var sendBtn=ov.querySelector(".twr-send");
    var note=ov.querySelector(".twr-note");var seen={};var closed=false;function addBubble(side,text,mc,mt){note.insertAdjacentHTML("beforebegin",bubble(side,text,mc,mt));body.scrollTop=body.scrollHeight;}function addSys(t){note.insertAdjacentHTML("beforebegin","<div class=\"twr-sys\">"+esc(t)+"</div>");body.scrollTop=body.scrollHeight;}var endBtn=ov.querySelector(".twr-end");function setClosed(c){closed=c;if(input)input.disabled=c;if(sendBtn)sendBtn.disabled=c;if(endBtn){endBtn.disabled=c;endBtn.textContent=c?"종료됨":"상담 종료";}}function renderThread(list){(list||[]).forEach(function(m){if(!m||seen[m.id])return;seen[m.id]=1;if(m.sender==="system"){addSys(m.body);setClosed(true);}else if(m.sender==="admin"){addBubble("sent",m.body,"twr-b-time","방문자 챗봇에 전달됨");setClosed(false);}else{addBubble("recv",m.body,"twr-b-meta","");setClosed(false);}});}function fallback(){if(inq.message)addBubble("recv",inq.message,"twr-b-meta",inq.email||"");if(inq.reply)addBubble("sent",inq.reply,"twr-b-time","이미 보낸 답변");}if(endBtn)endBtn.addEventListener("click",function(){if(closed||!inq.ticket||!sb||!sb.rpc)return;endBtn.disabled=true;sb.rpc("close_chat",{p_conversation:inq.ticket,p_by:"admin"}).then(function(res){if(res&&res.error){endBtn.disabled=false;showNote("종료에 실패했어요.",true);return;}if(res&&res.data&&res.data.id)seen[res.data.id]=1;addSys("상담이 종료되었어요.");setClosed(true);showNote("상담을 종료했어요.",false);try{if(typeof onDone==="function")onDone("done");}catch(e){}}).catch(function(){endBtn.disabled=false;showNote("오류가 발생했어요.",true);});});if(inq.ticket&&sb&&sb.rpc){sb.rpc("chat_list",{p_conversation:inq.ticket}).then(function(res){var list=(res&&res.data)||[];if(list.length){renderThread(list);}else{fallback();}}).catch(function(){fallback();});if(cur)cur.poll=setInterval(function(){if(!sb||!sb.rpc)return;sb.rpc("chat_list",{p_conversation:inq.ticket}).then(function(res){renderThread((res&&res.data)||[]);}).catch(function(){});},4000);}else{fallback();}
    function showNote(msg,isErr){ note.textContent=msg; note.className="twr-note show"+(isErr?" err":""); }
    function autoGrow(){ input.style.height="auto"; input.style.height=Math.min(120,input.scrollHeight)+"px"; }
    input.addEventListener("input",autoGrow);
    ov.addEventListener("mousedown",function(e){ if(e.target===ov) close(); });
    ov.querySelector(".twr-x").addEventListener("click",close);
    document.addEventListener("keydown",onKey,true);
    var sending=false;
    function doSend(){
      if(sending)return;
      var text=(input.value||"").trim();
      if(!text){ input.focus(); return; }
      if(!inq.ticket){ showNote("\uC774 \uBB38\uC758\uB294 \uCC57\uBD07 \uC811\uC218\uBC88\uD638\uAC00 \uC5C6\uC5B4 \uCC57\uBD07 \uB2F5\uBCC0\uC744 \uBCF4\uB0BC \uC218 \uC5C6\uC5B4\uC694.",true); return; }
      if(!sb||!sb.rpc){ showNote("\uC5F0\uACB0\uC5D0 \uBB38\uC81C\uAC00 \uC788\uC5B4\uC694. \uC0C8\uB85C\uACE0\uCE68 \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",true); return; }
      sending=true; sendBtn.disabled=true; input.disabled=true; note.className="twr-note";
      sb.rpc("admin_chat_post",{p_conversation:inq.ticket,p_body:text}).then(function(res){
        if(res&&res.error){ sending=false; sendBtn.disabled=false; input.disabled=false; showNote("\uBCF4\uB0B4\uC9C0 \uBABB\uD588\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",true); return; }
        if(res&&res.data&&res.data.id)seen[res.data.id]=1;addBubble("sent", text, "twr-b-time", "방문자 챗봇에 전달됨");
        input.value=""; autoGrow();
        showNote("답변을 보냈어요. 방문자 대화창에 바로 표시돼요.",false);
        body.scrollTop=body.scrollHeight;
        input.disabled=false; sendBtn.disabled=false; sending=false;
        try{ if(typeof onDone==="function") onDone("open"); }catch(e){} try{setClosed(false);}catch(e){}
      }).catch(function(){ sending=false; sendBtn.disabled=false; input.disabled=false; showNote("\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694.",true); });
    }
    sendBtn.addEventListener("click",doSend);
    input.addEventListener("keydown",function(e){ if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){ e.preventDefault(); doSend(); } });
    requestAnimationFrame(function(){ ov.classList.add("in"); setTimeout(function(){ try{input.focus();}catch(e){} },120); });
  };
})();
