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

  // Tactile World 로고 (점자 셀 모티프) — 재사용 SVG
  function LOGO(size){
    var s=size||34;
    return '<svg class="tw-logo" width="'+s+'" height="'+s+'" viewBox="0 0 40 40" role="img" aria-label="Tactile World">'+
      '<rect x="2" y="2" width="36" height="36" rx="10" fill="#17150F"/>'+
      '<circle cx="15" cy="13" r="3.1" fill="#FF4F00"/><circle cx="25" cy="13" r="3.1" fill="#FF4F00"/>'+
      '<circle cx="15" cy="20" r="3.1" fill="#4A463E"/><circle cx="25" cy="20" r="3.1" fill="#FF4F00"/>'+
      '<circle cx="15" cy="27" r="3.1" fill="#FF4F00"/><circle cx="25" cy="27" r="3.1" fill="#4A463E"/>'+
      '</svg>';
  }
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
        '<div class="ac-brand">'+LOGO(34)+
          '<div class="bt">Tactile World<small>관리자 콘솔</small></div></div>'+
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
