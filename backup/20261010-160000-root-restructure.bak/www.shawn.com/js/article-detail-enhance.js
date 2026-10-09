/* ============ 清逸的博客 · 文章详情页增强 ============
 * 1. 正文居中显示（820 容器，页面中央），右侧「最近更新」为独立 fixed 悬浮控件（DOM 剥离，不参与正文布局）
 * 2. 右侧仅展示最近更新文章列表（按发布时间降序前 8 篇），不展示本文标签/全部分类
 * 3. 评论区上方添加 上一篇（新日期）/ 下一篇（旧日期） 切换控件，与正文、评论同宽（右侧让位 56px）
 * 4. 支持分栏/标签筛选：URL ?col=分栏名 或 ?tag=标签名 时，右侧列表与底部跳转限定在分栏/标签内
 * 5. 移动端自适应：正文 → 上/下篇（竖排）→ 最近更新 → 评论区；图片/文本不超界
 * 6. 渲染及时：正文容器宽度与评论、跳转控件一致，标题溢出省略
 * 数据源：同目录 meta.json（56 篇文章元数据，离线可用）
 */
(function () {
  "use strict";

  var CURRENT_FILE = location.pathname.split("/").pop();

  function readState() {
    try {
      var st = window.__PINIA_STATE__;
      return (st && st.article) ? st.article : null;
    } catch (e) { return null; }
  }

  function qs(name) {
    var m = location.search.match(new RegExp("[?&]" + name + "=([^&]+)"));
    if (m) { try { return decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) { return m[1]; } }
    return "";
  }

  function fmtDate(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var ENH_CSS =
    /* PC：正文容器（820 居中于页面中央），正文 / 跳转控件 / 评论同宽（右侧让位 56px） */
    ".page-container{width:100%!important;max-width:none!important;margin:0 auto!important;display:block!important}" +
    ".content-container{display:block!important;width:100%!important;max-width:none!important;box-sizing:border-box}" +
    ".detail-wrapper{max-width:820px;margin:0 auto;width:100%;min-width:0;box-sizing:border-box;padding-right:56px}" +
    ".article-pager{max-width:820px;margin:0 auto;width:100%;box-sizing:border-box;padding:20px 56px 6px 0;display:flex;gap:14px}" +
    ".xw-pinlun2,.article-pinlun{max-width:820px!important;margin:0 auto!important;width:100%!important;box-sizing:border-box;padding-right:56px}" +
    /* 最近更新：独立 fixed 悬浮控件（DOM 在 body 层，不参与正文布局，不绑 frame） */
    ".recent-container{position:fixed!important;top:74px;right:16px;width:240px;z-index:40;margin:0!important;padding:0!important;box-sizing:border-box}" +
    ".recent-container .recent-block{width:100%!important;max-width:100%!important;box-sizing:border-box;background:#fff;border:1px solid #e4e9f0;border-radius:12px;padding:16px;box-shadow:0 6px 20px rgba(15,23,42,.08)}" +
    ".category-list-head{font-size:14px;font-weight:700;color:#2563eb;margin-bottom:12px}" +
    ".recent-list{list-style:none;margin:0;padding:0}" +
    ".recent-list li{border-bottom:1px dashed #edf0f4;padding:9px 0}" +
    ".recent-list li:last-child{border-bottom:0}" +
    ".recent-list a{display:block;color:#334155;font-size:13px;line-height:1.5;text-decoration:none;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}" +
    ".recent-list a:hover{color:#2563eb}" +
    ".recent-list time{display:block;color:#94a3b8;font-size:11px;margin-top:3px}" +
    /* 上一篇 / 下一篇（PC 横排，标题溢出省略，min-width:0 保证 flex 收缩不超出文章宽度） */
    ".article-pager a{flex:1 1 0;min-width:0;display:block;background:#fff;border:1px solid #e4e9f0;border-radius:12px;padding:12px 16px;text-decoration:none;transition:all .15s ease;box-shadow:0 6px 20px rgba(15,23,42,.04)}" +
    ".article-pager a:hover{border-color:#2563eb;transform:translateY(-1px)}" +
    ".article-pager .ap-label{display:block;font-size:11px;color:#94a3b8;margin-bottom:4px}" +
    ".article-pager .ap-title{display:block;color:#1e293b;font-size:14px;font-weight:600;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}" +
    ".article-pager .ap-date{display:block;color:#94a3b8;font-size:12px;margin-top:5px}" +
    ".article-pager a.disabled{opacity:.45;pointer-events:none}" +
    ".article-pager a.ap-next{text-align:right}" +
    /* 窄屏（<1240）：悬浮窗放不下时转为正文下方静态卡片（正文全宽居中） */
    "@media(max-width:1240px){.recent-container{position:static!important;top:auto;right:auto;width:100%!important;max-width:820px;margin:14px auto 0!important;padding:0!important;z-index:auto}}" +
    /* 移动端：正文 → 上/下篇（竖排）→ 最近更新 → 评论区；图片/文本不超界 */
    "@media(max-width:960px){" +
    ".content-container{display:block!important}" +
    ".detail-wrapper{max-width:100%!important;padding-right:0;padding-left:0}" +
    ".article-pager{max-width:100%!important;padding:16px 0 4px;flex-direction:column;gap:10px}" +
    ".article-pager a{width:100%}" +
    ".article-pager a.ap-next{text-align:left}" +
    ".xw-pinlun2,.article-pinlun{max-width:100%!important;padding-right:0}" +
    ".recent-container{max-width:100%!important;margin:14px 0 0!important}" +
    ".detail-wrapper img,.detail-content img,.article-detail img{max-width:100%!important;height:auto!important}" +
    ".detail-content,.article-detail{overflow-wrap:break-word;word-break:break-word}" +
    ".detail-content pre,.detail-content code{max-width:100%;overflow-x:auto;white-space:pre-wrap}" +
    ".detail-content table{max-width:100%;display:block;overflow-x:auto}" +
    ".detail-content iframe,.detail-content video{max-width:100%}" +
    "}";

  function injectStyle() {
    if (document.getElementById("article-enh-css")) return;
    var s = document.createElement("style");
    s.id = "article-enh-css";
    s.textContent = ENH_CSS;
    document.head.appendChild(s);
  }

  var mqMobile = window.matchMedia("(max-width:960px)");

  /* DOM 剥离：PC 时悬浮控件在 body 层（fixed，不绑 frame）；移动端移回评论区之前（static 顺序） */
  function placeRecent(recent) {
    if (!recent) return;
    var pinlun = document.querySelector(".xw-pinlun2, .article-pinlun");
    var content = document.querySelector(".content-container");
    if (mqMobile.matches) {
      var target = pinlun || content || document.body;
      if (target && target.parentNode && recent.parentNode !== target.parentNode) {
        target.parentNode.insertBefore(recent, target);
      }
    } else {
      if (recent.parentNode !== document.body) document.body.appendChild(recent);
    }
  }

  function buildRecentSidebar(list, col, tag) {
    /* 幂等：清理已存在的最近更新栏 */
    document.querySelectorAll(".recent-container").forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    var recent = document.createElement("div");
    recent.className = "recent-container";
    var block = document.createElement("div");
    block.className = "recent-block";
    var head = document.createElement("div");
    head.className = "category-list-head";
    head.textContent = col || tag ? "最近更新（" + (col || tag) + "）" : "最近更新";
    var ul = document.createElement("ul");
    ul.className = "recent-list";
    var n = Math.min(8, list.length);
    for (var i = 0; i < n; i++) {
      var p = list[i];
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = p.file + (col ? "?col=" + encodeURIComponent(col) : "") + (tag ? "?tag=" + encodeURIComponent(tag) : "");
      a.textContent = p.title;
      var tm = document.createElement("time");
      tm.textContent = fmtDate(p.date);
      li.appendChild(a);
      li.appendChild(tm);
      ul.appendChild(li);
    }
    block.appendChild(head);
    block.appendChild(ul);
    recent.appendChild(block);
    /* 先放 body 层，再由 placeRecent 按 PC/移动端放置（DOM 剥离，不参与正文布局） */
    document.body.appendChild(recent);
    placeRecent(recent);
  }

  function buildPager(list, idx, col, tag) {
    var detail = document.querySelector(".detail-wrapper");
    if (!detail) return;
    var nav = document.createElement("nav");
    nav.className = "article-pager";
    var q = (col ? "?col=" + encodeURIComponent(col) : "") + (tag ? "?tag=" + encodeURIComponent(tag) : "");
    var prev = list[idx - 1];
    var next = list[idx + 1];
    function mk(p, label, cls, textAlign) {
      var a = document.createElement("a");
      a.className = cls;
      if (p) {
        a.href = p.file + q;
        var l = document.createElement("span");
        l.className = "ap-label";
        l.textContent = label;
        var t = document.createElement("span");
        t.className = "ap-title";
        t.textContent = p.title;
        var d = document.createElement("span");
        d.className = "ap-date";
        d.textContent = fmtDate(p.date);
        a.appendChild(l); a.appendChild(t); a.appendChild(d);
      } else {
        a.classList.add("disabled");
        var l2 = document.createElement("span");
        l2.className = "ap-label";
        l2.textContent = label;
        var t2 = document.createElement("span");
        t2.className = "ap-title";
        t2.textContent = "没有更新的一篇";
        a.appendChild(l2); a.appendChild(t2);
      }
      return a;
    }
    nav.appendChild(mk(prev, "上一篇", "ap-prev"));
    nav.appendChild(mk(next, "下一篇", "ap-next"));
    /* 插到正文之后（移动端顺序：正文 → 上下篇 → 最近更新 → 评论区） */
    if (detail.nextSibling) detail.parentNode.insertBefore(nav, detail.nextSibling);
    else detail.parentNode.appendChild(nav);
  }

  function run() {
    injectStyle();
    var art = readState();
    if (!art) return;
    /* run() 可能被多次调用（立即 + 延迟），先清理自身产生的元素与旧侧栏保证幂等 */
    document.querySelectorAll(".recent-container, .article-pager").forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    /* 右侧不展示全部分类/本文标签：移除原站分类侧栏 */
    document.querySelectorAll(".side-container").forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    var col = qs("col");
    var tag = qs("tag");
    // 分栏在线数据（source_file 集合），失败时降级用 category/tags 匹配
    var colFiles = null;
    var needCol = col && !tag;
    function inScope(p) {
      if (tag) return (p.tags || []).concat(p.category || []).indexOf(tag) >= 0;
      if (col) {
        /* 在线分栏数据非空时按其匹配；空或失败时降级用 category/tags 匹配 */
        if (colFiles && colFiles.length) return colFiles.indexOf(p.file) >= 0;
        return (p.category || []).concat(p.tags || []).indexOf(col) >= 0;
      }
      return true;
    }
    function render(meta) {
      var all = (meta && meta.posts) || [];
      var scoped = all.filter(inScope);
      var idx = -1;
      for (var i = 0; i < scoped.length; i++) {
        if (scoped[i].file === CURRENT_FILE) { idx = i; break; }
      }
      buildRecentSidebar(scoped, col, tag);
      buildPager(scoped, idx, col, tag);
    }
    if (needCol) {
      try {
        fetch("/api/public/posts?column=" + encodeURIComponent(col) + "&size=50")
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (j && j.ok && j.data && j.data.list) {
              colFiles = j.data.list.map(function (p) { return p.source_file; });
            }
            fetch("meta.json").then(function (r) { return r.json(); }).then(render).catch(function () { render(null); });
          })
          .catch(function () {
            fetch("meta.json").then(function (r) { return r.json(); }).then(render).catch(function () { render(null); });
          });
        return;
      } catch (e) {}
    }
    fetch("meta.json").then(function (r) { return r.json(); }).then(render).catch(function () { render(null); });
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); }
  else { run(); }
  setTimeout(run, 600);
  setTimeout(run, 1800);

  /* 视口切换（PC 悬浮 / 移动端下移）时重新放置悬浮控件 */
  var _lastMq = mqMobile.matches;
  window.addEventListener("resize", function () {
    var now = mqMobile.matches;
    if (now !== _lastMq) {
      _lastMq = now;
      placeRecent(document.querySelector(".recent-container"));
    }
  });
})();
