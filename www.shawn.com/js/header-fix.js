/* ============ 清逸的博客 · 全站统一顶栏（与主页完全同构，源码级重写版） ============
 * 1. 所有页面 HTML 中旧 Vue 顶栏 header.xw-header 已整体替换为主页同构顶栏
 *    （header.nav > .nav-in > .logo/.nav-links/.nav-user，位于 #app 之外、body 开头）
 * 2. 本脚本只负责运行期统一管理：规格兜底（NAV_CSS）、选中高亮、登录态、工具开关、
 *    导航文案、移动端汉堡、Vue 页内容留白；对仍有 xw-header 的页面做兜底移除
 * 3. 首页/关于我/文章列表（原生 .nav）、登录页（.site-header）不重复注入
 * 依赖：soulsoft-tools.css（未加载时动态加载）
 */
(function () {
  "use strict";

  function loadCss(href) {
    if (document.querySelector('link[href$="' + href.split("/").pop() + '"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }

  /* 相对根路径前缀（按页面目录深度） */
  function depthPrefix() {
    var segs = location.pathname.replace(/^\/+/, "").split("/");
    segs.pop(); // 去掉文件名
    if (!segs.length) return "";
    return segs.map(function () { return ".."; }).join("/") + "/";
  }
  var P = depthPrefix();

  function injectStyle(css) {
    if (document.getElementById("shawn-nav-css")) return;
    var s = document.createElement("style");
    s.id = "shawn-nav-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* 主页顶栏统一样式（与主页 index.html 实际渲染完全一致：fixed z50、58px 白玻璃、渐变 LOGO、胶囊导航、蓝字浅蓝底选中、右侧胶囊登录按钮）
   * 显式 box-sizing:border-box，避免不同页面全局盒模型规则导致细微视觉差异 */
  var NAV_CSS =
    "header.nav,header.nav *,header.site-header,header.site-header *{box-sizing:border-box!important}" +
    "header.nav,header.site-header{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:50!important;background:rgba(255,255,255,.82)!important;backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);border-bottom:1px solid #e4e9f0!important;box-shadow:0 8px 28px rgba(15,23,42,.05)!important;height:58px!important;padding:0 20px;font-size:16px;line-height:1.6}" +
    ".nav-in,.site-header .inner{max-width:1200px!important;margin:0 auto!important;height:100%;display:flex;align-items:center;gap:26px!important;padding:0 24px;width:100%}" +
    ".nav .logo,.site-header .logo{font-size:19px!important;font-weight:800!important;letter-spacing:.5px;white-space:nowrap;text-decoration:none!important;background:linear-gradient(135deg,#2563eb,#0ea5e9)!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:#2563eb!important}" +
    ".nav-links,.site-nav{display:flex;gap:4px;flex:1;flex-wrap:wrap;font-size:14px}" +
    ".nav-links a,.site-nav a{font-size:14px!important;font-weight:600!important;line-height:1.6!important;color:#5a6a7a!important;padding:7px 12px!important;border-radius:999px!important;text-decoration:none!important;transition:all .15s ease;white-space:nowrap}" +
    ".nav-links a:hover,.nav-links a.on,.site-nav a:hover,.site-nav a.on{color:#2563eb!important;background:rgba(37,99,235,.08)!important}" +
    ".nav-user{font-size:14px;white-space:nowrap}" +
    ".nav-user a,.header-user a{display:inline-flex!important;align-items:center;gap:6px;color:#2563eb!important;background:#f4f8ff!important;border:1px solid #e4e9f0!important;padding:7px 16px!important;border-radius:999px!important;font-size:13px!important;font-weight:600!important;text-decoration:none!important;box-shadow:0 6px 16px rgba(15,23,42,.05);transition:all .15s ease}" +
    ".nav-user a:hover,.header-user a:hover{background:#e9f2ff!important;transform:translateY(-1px)}" +
    ".nav-user .btn-exit{color:#64748b;margin-left:10px;cursor:pointer;border:0;background:none;font-size:13px;font-weight:600}" +
    "@media(max-width:900px){.nav-links,.site-nav{display:none}}";

  function injectNavCss() { injectStyle(NAV_CSS); }

  /* 兜底清理：仍有 Vue 原顶栏的页面（如未替换的旧页面）直接从 DOM 移除 */
  function removeLegacyHeader() {
    document.querySelectorAll("header.xw-header").forEach(function (h) {
      if (h.parentNode) h.parentNode.removeChild(h);
    });
  }

  /* 兜底注入：仅当页面完全没有顶栏时注入主页同构顶栏（如部分后台页面） */
  function injectHeader() {
    if (document.querySelector("header.nav, .site-header")) return;
    var navItems = [
      [P + "index.html", "首页", ""],
      [P + "piano/index.html", "在线钢琴", "piano"],
      [P + "music/index.html", "在线乐器", "music"],
      [P + "tiaoyin/index.html", "调音器", "tiaoyin"],
      [P + "metronome/index.html", "节拍器", "metronome"],
      [P + "article/index.html", "文章", ""],
      [P + "aboutme/index.html", "关于我", ""]
    ];
    var h = document.createElement("header");
    h.className = "nav injected-nav";
    var inner = document.createElement("div");
    inner.className = "nav-in";
    inner.style.boxSizing = "border-box";
    inner.style.width = "min(1200px, 100%)";
    inner.style.maxWidth = "none";
    inner.style.margin = "0 auto";
    inner.style.padding = "0 24px";
    var logo = document.createElement("a");
    logo.className = "logo";
    logo.href = P + "index.html";
    logo.textContent = "清逸的博客";
    var nav = document.createElement("nav");
    nav.className = "nav-links";
    navItems.forEach(function (it) {
      var a = document.createElement("a");
      a.href = it[0];
      a.textContent = it[1];
      if (it[2]) a.setAttribute("data-tool", it[2]);
      nav.appendChild(a);
    });
    var user = document.createElement("div");
    user.className = "nav-user";
    user.id = "navUser";
    var ua = document.createElement("a");
    ua.href = P + "user/login.html";
    ua.textContent = "登录";
    user.appendChild(ua);
    inner.appendChild(logo);
    inner.appendChild(nav);
    inner.appendChild(user);
    h.appendChild(inner);
    document.body.insertBefore(h, document.body.firstChild);
  }

  /* 登录态渲染（与主页一致：读 xw_username）
   * 登录/注册页（/user/）自身负责 navUser 渲染（含「登录 / 注册」双入口切换），此处跳过避免覆盖 */
  function renderNavUser() {
    if (/\/user\//.test(location.pathname)) return;
    var box = document.getElementById("navUser");
    if (!box) return;
    var u = null;
    try { u = localStorage.getItem("xw_username"); } catch (e) {}
    box.innerHTML = "";
    if (u) {
      var span = document.createElement("span");
      span.textContent = u;
      span.style.color = "#2563eb";
      span.style.fontWeight = "600";
      var btn = document.createElement("button");
      btn.className = "btn-exit";
      btn.textContent = "退出";
      btn.onclick = function () {
        try { localStorage.removeItem("xw_token"); localStorage.removeItem("xw_username"); } catch (e) {}
        location.reload();
      };
      box.appendChild(span);
      box.appendChild(btn);
    } else {
      var a = document.createElement("a");
      a.href = P + "user/login.html";
      a.textContent = "登录";
      box.appendChild(a);
    }
  }

  /* 当前导航目录 */
  function currentDir() {
    var p = location.pathname;
    if (/\/piano\//.test(p)) return "piano";
    if (/\/music\//.test(p)) return "music";
    if (/\/tiaoyin\//.test(p)) return "tiaoyin";
    if (/\/metronome\//.test(p)) return "metronome";
    if (/\/article\//.test(p)) return "article";
    if (/\/aboutme\//.test(p)) return "aboutme";
    if (/\/user\//.test(p) || /\/auth\//.test(p)) return "";
    return "home";
  }
  function hrefDir(href) {
    if (!href) return "";
    var m = href.match(/([a-z0-9_-]+)\/index\.html$/);
    if (m) return m[1];
    if (href === "/" || href === "../" || href === "..") return "home";
    m = href.match(/^\/([a-z0-9_-]+)\/?$/);
    if (m) return m[1];
    return "";
  }
  /* 选中高亮：与主页一致（.on 类，蓝字浅蓝底） */
  function highlightNav() {
    var cur = currentDir();
    if (!cur) return;
    document.querySelectorAll(".nav-links a, .site-nav a, .header-nav a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var target = hrefDir(href);
      if (!target) {
        if (href === "index.html" || href === "./index.html" || href === "" || href === ".") {
          target = cur;
        } else if (/\.\.\/index\.html$/.test(href)) {
          target = "home";
        } else {
          return;
        }
      }
      if (target !== cur) return;
      a.classList.add("on");
      var li = a.closest("li");
      if (li) li.classList.add("active");
    });
  }

  /* 导航文案统一（旧文案 Html5钢琴 等统一为 在线钢琴） */
  function normalizeNavText() {
    document.querySelectorAll(".nav-links a, .site-nav a, .header-nav a").forEach(function (a) {
      var t = a.textContent.trim();
      if (t === "Html5钢琴" || t === "H5钢琴" || t === "H5 钢琴" || t === "在线钢琴Html5" || t === "HTML5钢琴") {
        a.textContent = "在线钢琴";
      }
    });
  }

  /* 工具开关同步：后台关闭的工具在导航隐藏（与主页一致） */
  function syncToolsNav() {
    try {
      fetch("/api/tools.json").then(function (r) { return r.json(); }).then(function (j) {
        if (!j || !j.ok || !j.data) return;
        var enabled = {};
        j.data.forEach(function (t) { if (t.enabled) enabled[t.key] = 1; });
        var map = { "在线钢琴": "piano", "在线乐器": "music", "调音器": "tiaoyin", "节拍器": "metronome" };
        document.querySelectorAll(".nav-links a, .site-nav a, .header-nav a").forEach(function (a) {
          var key = a.getAttribute("data-tool") || map[a.textContent.trim()];
          if (key && !enabled[key]) {
            a.style.display = "none";
          }
        });
      }).catch(function () {});
    } catch (e) {}
  }

  /* 移动端汉堡（统一顶栏使用） */
  function injectHamburger() {
    if (document.querySelector(".mobile-hamburger")) return;
    var header = document.querySelector("header.nav.injected-nav, header.xw-header, header.nav, .site-header");
    if (!header) return;
    var btn = document.createElement("button");
    btn.className = "mobile-hamburger";
    btn.type = "button";
    btn.setAttribute("aria-label", "菜单");
    btn.appendChild(document.createElement("span"));
    var mask = document.createElement("div");
    mask.className = "mobile-drawer-mask";
    var drawer = document.createElement("div");
    drawer.className = "mobile-drawer";
    var logo = document.createElement("div");
    logo.className = "drawer-logo";
    logo.textContent = "清逸的博客";
    var nav = document.createElement("ul");
    nav.className = "drawer-nav";
    var src = header.querySelector(".nav-links, .header-nav, .site-nav");
    if (src) {
      src.querySelectorAll("a").forEach(function (a) {
        var li = document.createElement("li");
        var na = document.createElement("a");
        na.href = a.getAttribute("href") || "#";
        na.textContent = a.textContent.trim();
        li.appendChild(na);
        nav.appendChild(li);
      });
    }
    var userWrap = document.createElement("div");
    userWrap.className = "drawer-user";
    var srcUser = header.querySelector(".nav-user a, .header-user a, .absolute-user a");
    if (srcUser) {
      var ua = document.createElement("a");
      ua.href = srcUser.getAttribute("href") || "#";
      ua.textContent = srcUser.textContent.trim();
      userWrap.appendChild(ua);
    }
    drawer.appendChild(logo);
    drawer.appendChild(nav);
    if (userWrap.children.length) drawer.appendChild(userWrap);
    document.body.appendChild(btn);
    document.body.appendChild(mask);
    document.body.appendChild(drawer);
    function toggle(open) {
      var willOpen = (open === undefined) ? !drawer.classList.contains("open") : open;
      drawer.classList.toggle("open", willOpen);
      mask.classList.toggle("show", willOpen);
      btn.classList.toggle("active", willOpen);
      document.body.style.overflow = willOpen ? "hidden" : "";
    }
    btn.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
    mask.addEventListener("click", function () { toggle(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggle(false); });
  }

  function run() {
    loadCss(P + "soulsoft-tools.css");
    injectNavCss();
  }
  function runDom() {
    removeLegacyHeader();
    injectHeader();
    /* 静态顶栏为 fixed（与主页一致）；Vue 页面（含 #app）原 xw-header 移除后内容上顶，需让出顶部 58px。
       首页/关于我/文章列表等原生 .nav 页面本身已预留留白，不额外加。 */
    if (document.querySelector("header.nav") && document.querySelector("#app")) {
      document.body.style.paddingTop = "58px";
    }
    renderNavUser();
    normalizeNavText();
    injectHamburger();
    highlightNav();
    syncToolsNav();
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); }
  else { run(); }
  setTimeout(runDom, 600);
  setTimeout(runDom, 1800);
})();
