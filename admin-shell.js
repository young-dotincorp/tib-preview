/* ============================================================
   admin-shell.js — Tactile World 관리자 공용 셸
   사용법(각 페이지):
     AdminShell.mount({ active:"dashboard", title:"대시보드", icon:"ti-chart-bar" })
       .then(function(ctx){ if(!ctx) return; // 게이트 실패 시 셸이 메시지 표시
         var root = ctx.content;  // 콘텐츠를 채울 영역
         // ctx.sb (supabase), ctx.user, ctx.toast(), ctx.esc()
       });
   전제: 페이지 <head>에 admin-shell.css, supabase-js, admin-shell.js 로드.
   ============================================================ */
(function(){
  "use strict";
  var SB = window.__TIB_SB__ || {
    url: "https://nqgaqzpbhmezkrrlbbhm.supabase.co",
    key: "sb_publishable_IThvI0wJJex8U4UiATHFyw_B_2jIphy"
  };

  // 사이드바 메뉴 (여기 한 줄 추가 = 전 페이지 반영 → 확장성)
  var NAV = [
    { grp:"운영" },
    { key:"dashboard", label:"대시보드",     icon:"ti-chart-bar", href:"admin-dashboard.html" },
    { key:"review",    label:"검수 대기열",   icon:"ti-checklist", href:"admin-review.html", badge:"pending" },
    { key:"inbox",     label:"메시지함",      icon:"ti-mail",      href:"admin-inbox.html" },
    { grp:"관리" },
    { key:"members",   label:"회원 · 관리자", icon:"ti-users",     href:"admin-members.html" }
  ];

  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function initials(s){ s=(s||"").trim(); return s?s.slice(0,2).toUpperCase():"·"; }

  // Tactile World 워드마크 로고 (라이브 index.html에서 추출) — fill=currentColor로 배경별 색 전환
  var TW_LOGO = '<svg class="tw-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 447.3 76.8" fill="currentColor" role="img" aria-label="Tactile World"> <g> <path d="M154.5,53.9V29.3h-9.4V23h25.5v6.2h-9.4v24.6L154.5,53.9L154.5,53.9z"/> <path d="M177.2,54.3c-2.3,0-4.3-0.6-5.8-1.9c-1.5-1.3-2.3-3-2.3-5.3V47c0-2.5,0.9-4.4,2.6-5.6c1.7-1.3,4-1.9,6.9-1.9 c2,0,3.9,0.3,5.8,1V40c0-1.4-0.4-2.5-1.3-3.2c-0.9-0.7-2.1-1.1-3.8-1.1c-2,0-4.2,0.4-6.5,1.3l-1.7-5.1c1.4-0.6,2.9-1.1,4.3-1.4 c1.4-0.3,3-0.5,4.9-0.5c3.6,0,6.2,0.9,8,2.6c1.7,1.7,2.5,4.2,2.5,7.5v13.7h-6.5v-2.6C182.5,53.3,180.2,54.3,177.2,54.3z M179.2,49.7c1.6,0,2.8-0.4,3.8-1.2c1-0.8,1.4-1.8,1.4-3v-1.2c-1.2-0.6-2.7-0.9-4.3-0.9c-1.4,0-2.6,0.3-3.4,0.8 c-0.8,0.6-1.2,1.4-1.2,2.4v0.1c0,0.9,0.3,1.6,1,2.1C177.3,49.4,178.1,49.7,179.2,49.7z"/> <path d="M207.7,54.4c-2.3,0-4.4-0.5-6.3-1.7c-1.9-1.1-3.4-2.6-4.4-4.4c-1.1-1.9-1.6-3.9-1.6-6.1v-0.1 c0-2.2,0.5-4.3,1.6-6.2c1-1.9,2.5-3.3,4.4-4.5c1.9-1.1,4-1.7,6.4-1.7c2.1,0,3.9,0.3,5.4,1c1.5,0.7,2.8,1.7,4,3l-4.1,4.4 c-0.8-0.9-1.7-1.5-2.5-2c-0.8-0.4-1.8-0.6-2.9-0.6c-1.6,0-3,0.6-4.1,1.9S202,40.2,202,42v0.1c0,1.8,0.6,3.4,1.6,4.7 c1.1,1.2,2.6,1.9,4.3,1.9c1.1,0,2-0.2,2.8-0.6c0.8-0.4,1.7-1,2.6-1.9l3.9,4c-1.3,1.4-2.6,2.5-4.1,3.2 C211.7,54,209.9,54.4,207.7,54.4z"/> <path d="M229.7,54.2c-2.2,0-3.9-0.5-5.1-1.6s-1.8-2.9-1.8-5.5V36H220v-5.7h2.8v-6h6.7v6h5.6V36h-5.6v10.1 c0,0.8,0.2,1.3,0.5,1.7c0.3,0.4,0.9,0.6,1.6,0.6c1.2,0,2.3-0.3,3.3-0.8v5.4C233.4,53.8,231.7,54.2,229.7,54.2z"/> <path d="M240.1,24.7L240.1,24.7c0-1.6,1.3-3,3-3h1.1c1.6,0,3,1.3,3,3v0c0,1.6-1.3,3-3,3h-1.1 C241.4,27.6,240.1,26.3,240.1,24.7z M240.3,53.9V30.3h6.7v23.6H240.3z"/> <path d="M253.6,53.9V21.7h6.7v32.1H253.6z"/> <path d="M277.7,54.4c-3.6,0-6.5-1.1-8.8-3.4s-3.5-5.2-3.5-8.8v-0.1c0-2.2,0.5-4.3,1.5-6.2c1-1.9,2.4-3.3,4.2-4.5 s3.8-1.7,6-1.7c1.9,0,3.6,0.4,5.1,1c1.5,0.7,2.7,1.7,3.6,2.9c0.9,1.2,1.6,2.6,2.1,4.1c0.5,1.5,0.7,3.1,0.7,4.8c0,0.3,0,0.9-0.1,1.8 H272c0.3,1.5,1,2.7,2,3.4c1,0.8,2.3,1.2,3.8,1.2c1.1,0,2.1-0.2,3-0.6c0.9-0.4,1.8-1,2.7-1.9l3.8,3.4 C285,52.9,281.8,54.4,277.7,54.4z M272,40.2H282c-0.2-1.5-0.7-2.8-1.6-3.7s-2-1.3-3.4-1.3c-1.4,0-2.5,0.5-3.4,1.3 C272.8,37.4,272.2,38.7,272,40.2z"/> <path d="M292.5,23h3.8l8.8,25.7l8.5-25.8h2.9l8.5,25.8l8.8-25.7h3.6l-11,31h-3l-8.5-25l-8.5,25h-2.9L292.5,23z"/> <path d="M353.4,54.4c-1.7,0-3.3-0.3-4.7-1c-1.4-0.6-2.7-1.5-3.7-2.6c-1.1-1.1-1.9-2.3-2.5-3.7 c-0.6-1.4-0.9-2.9-0.9-4.6v-0.1c0-1.6,0.3-3.1,0.9-4.6c0.6-1.4,1.4-2.7,2.5-3.8c1.1-1.1,2.3-1.9,3.8-2.6c1.5-0.6,3-1,4.8-1 c1.7,0,3.3,0.3,4.7,1c1.5,0.6,2.7,1.5,3.8,2.6s1.9,2.3,2.5,3.7c0.6,1.4,0.9,2.9,0.9,4.6v0.1c0,1.6-0.3,3.1-0.9,4.6 c-0.6,1.4-1.4,2.7-2.5,3.8c-1.1,1.1-2.3,1.9-3.8,2.6C356.7,54.1,355.1,54.4,353.4,54.4z M353.5,51.3c1.2,0,2.4-0.2,3.4-0.7 c1-0.5,1.9-1.1,2.6-1.9c0.7-0.8,1.3-1.7,1.7-2.8s0.6-2.2,0.6-3.4v-0.1c0-1.2-0.2-2.4-0.6-3.5c-0.4-1.1-1-2-1.8-2.8 c-0.8-0.8-1.7-1.4-2.7-1.9c-1-0.5-2.1-0.7-3.4-0.7c-1.2,0-2.4,0.2-3.4,0.7c-1,0.5-1.9,1.1-2.6,1.9s-1.3,1.7-1.7,2.8 c-0.4,1.1-0.6,2.2-0.6,3.4v0.1c0,1.2,0.2,2.4,0.6,3.5c0.4,1.1,1,2,1.8,2.8s1.6,1.4,2.7,1.9C351.2,51.1,352.3,51.3,353.5,51.3z"/> <path d="M371.5,31.1h3.4V37c0.4-0.9,0.9-1.8,1.5-2.6c0.6-0.8,1.3-1.5,2.1-2c0.8-0.6,1.6-1,2.6-1.3c0.9-0.3,2-0.4,3-0.4 v3.6h-0.3c-1.2,0-2.4,0.2-3.5,0.7s-2.1,1.1-2.9,2s-1.5,2-1.9,3.3c-0.5,1.3-0.7,2.8-0.7,4.5v9.1h-3.4L371.5,31.1L371.5,31.1z"/> <path d="M389.6,21.7h3.4v32.1h-3.4V21.7z"/> <path d="M410.5,54.3c-1.4,0-2.7-0.3-4-0.8c-1.3-0.5-2.5-1.3-3.5-2.3c-1-1-1.9-2.2-2.5-3.7c-0.6-1.5-0.9-3.1-0.9-5v-0.1 c0-1.8,0.3-3.5,0.9-5c0.6-1.5,1.4-2.7,2.5-3.7c1-1,2.2-1.8,3.5-2.3c1.3-0.5,2.6-0.8,4-0.8c1.1,0,2,0.1,2.9,0.4s1.7,0.6,2.4,1.1 c0.7,0.4,1.4,1,1.9,1.5s1.1,1.2,1.5,1.8V21.7h3.4v32.1h-3.4v-4.6c-0.5,0.7-1,1.3-1.6,1.9s-1.2,1.2-1.9,1.6 c-0.7,0.5-1.5,0.8-2.4,1.1C412.5,54.2,411.5,54.3,410.5,54.3z M411.1,51.3c1.1,0,2.1-0.2,3.1-0.6c1-0.4,1.9-1,2.6-1.8 c0.8-0.8,1.4-1.7,1.9-2.8s0.7-2.3,0.7-3.6v-0.1c0-1.3-0.2-2.5-0.7-3.6c-0.5-1.1-1.1-2-1.9-2.8s-1.7-1.4-2.6-1.8 c-1-0.4-2-0.6-3.1-0.6c-1.1,0-2.2,0.2-3.1,0.6c-1,0.4-1.8,1-2.5,1.7s-1.3,1.7-1.7,2.8S403,41,403,42.4v0.1c0,1.3,0.2,2.6,0.6,3.7 c0.4,1.1,1,2,1.7,2.8c0.7,0.8,1.6,1.3,2.6,1.8C409,51.1,410,51.3,411.1,51.3z"/> </g> <g> <polygon points="25.6,15.7 25.6,38.3 42.6,38.3 42.6,60.9 65.2,60.9 65.2,38.3 71.2,38.3 57.9,15.7 "/> <path d="M109.1,60.9l26.7-45.2H86.9H60l13.3,22.6l13.3,22.5l10.2-17l-4.3-7.3l1.3-1.3C98.9,43.9,104,52.2,109.1,60.9z" /> </g> </svg>';
  function LOGO(){ return TW_LOGO; }
  window.AdminShellLogo = LOGO;

  function buildShell(active, title, icon){
    var nav = NAV.map(function(it){
      if(it.grp) return '<div class="grp">'+esc(it.grp)+'</div>';
      var on = it.key===active ? " on" : "";
      var badge = it.badge ? '<span class="cnt" id="nav-badge-'+it.key+'" style="display:none"></span>' : "";
      return '<a class="'+on.trim()+'" href="'+it.href+'"><i class="ti '+it.icon+'"></i> '+esc(it.label)+badge+'</a>';
    }).join("");

    var shell =
      '<div class="ac-shell">'+
      '<aside class="ac-side" id="ac-side">'+
        '<div class="ac-brand">'+LOGO()+'<span class="ac-sub">관리자 콘솔</span></div>'+
        '<nav class="ac-nav">'+nav+'</nav>'+
        '<div class="foot">© Dot Inc. · Tactile World</div>'+
      '</aside>'+
      '<div class="ac-scrim" id="ac-scrim"></div>'+
      '<div class="ac-main">'+
        '<header class="ac-top">'+
          '<button class="burger" id="ac-burger" aria-label="메뉴"><i class="ti ti-menu-2"></i></button>'+
          '<h1><i class="ti '+esc(icon||"ti-layout-dashboard")+'"></i> '+esc(title||"관리자")+'</h1>'+
          '<div class="grow"></div>'+
          '<div class="ac-user" id="ac-user"></div>'+
        '</header>'+
        '<main class="ac-content" id="ac-content" aria-live="polite"><div class="msg">불러오는 중…</div></main>'+
      '</div>'+
      '</div>';
    document.body.insertAdjacentHTML("afterbegin", shell);

    // 모바일 사이드바 토글
    var side=document.getElementById("ac-side"), scrim=document.getElementById("ac-scrim");
    function close(){ side.classList.remove("open"); scrim.classList.remove("on"); }
    var burger=document.getElementById("ac-burger");
    if(burger) burger.addEventListener("click",function(){ side.classList.toggle("open"); scrim.classList.toggle("on"); });
    scrim.addEventListener("click", close);
  }

  var toastEl=null;
  function toast(t){
    if(!toastEl){ toastEl=document.createElement("div"); toastEl.className="toast"; document.body.appendChild(toastEl); }
    toastEl.textContent=t; toastEl.classList.add("on");
    setTimeout(function(){ toastEl.classList.remove("on"); }, 2400);
  }

  function gate(sb){
    return sb.auth.getSession().then(function(r){
      var s=r&&r.data?r.data.session:null;
      if(!s){ location.replace("admin-login.html"); return null; }
      var uid=s.user&&s.user.id;
      return sb.from("app_admins").select("user_id").eq("user_id",uid).maybeSingle().then(function(a){
        if(a.error||!a.data){ location.replace("admin-login.html"); return null; }
        return s.user;
      });
    }).catch(function(){ location.replace("admin-login.html"); return null; });
  }

  function renderUser(sb, user){
    var box=document.getElementById("ac-user");
    var name=(user&&(user.user_metadata&&(user.user_metadata.name||user.user_metadata.full_name)))||(user&&user.email)||"관리자";
    box.innerHTML='<span class="av">'+esc(initials(name))+'</span><span class="nm">'+esc(name)+'</span>'+
      '<button class="btn btn-sm" id="ac-logout"><i class="ti ti-logout"></i> 로그아웃</button>';
    document.getElementById("ac-logout").addEventListener("click",function(){
      sb.auth.signOut().then(function(){ location.href="/#/"; }).catch(function(){ location.href="/#/"; });
    });
  }

  // 사이드바 배지(예: 검수 대기 건수) 채우기 — 읽기 전용 count
  function fillBadges(sb){
    var el=document.getElementById("nav-badge-review");
    if(el){
      sb.from("graphics").select("id",{count:"exact",head:true}).eq("status","pending")
        .then(function(res){ if(!res.error){ var n=res.count||0; if(n>0){ el.textContent=n; el.style.display=""; } } })
        .catch(function(){});
    }
  }

  window.AdminShell = {
    esc: esc,
    toast: toast,
    mount: function(opts){
      opts=opts||{};
      if(!(window.supabase && window.supabase.createClient)){
        document.body.insertAdjacentHTML("afterbegin",'<div class="msg" style="margin:40px auto;max-width:520px"><b>연결 라이브러리를 불러오지 못했어요.</b>새로고침해 주세요.</div>');
        return Promise.resolve(null);
      }
      buildShell(opts.active, opts.title, opts.icon);
      var contentEl=document.getElementById("ac-content");
      var sb=window.supabase.createClient(SB.url, SB.key,
        { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:false } });
      this.sb=sb;
      return gate(sb).then(function(user){
        if(!user) return null;
        renderUser(sb, user);
        fillBadges(sb);
        contentEl.innerHTML="";
        return { sb:sb, user:user, content:contentEl, toast:toast, esc:esc };
      });
    }
  };
})();
