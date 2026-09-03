// 倩楠老师 · 玩家记录（纯本地，无认证，不联网）
(function () {
  var KEY = 'qiannan_play_records';
  var NAMEKEY = 'qiannan_last_name';
  var _name = null;
  var _gate = null, _panel = null, _btn = null;
  var _active = null; // 当前正在玩的一局：{ idx }
  var _game = '';

  // 注入样式
  var css = document.createElement('style');
  css.textContent =
    '.qn-gate{position:fixed;inset:0;z-index:10000;background:rgba(30,40,70,0.55);display:none;align-items:center;justify-content:center;padding:20px;}'+
    '.qn-gate.show{display:flex;}'+
    '.qn-gate-card{background:#fff;border-radius:26px;padding:26px 24px;max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25);}'+
    '.qn-gate-emoji{font-size:52px;}'+
    '.qn-gate-title{font-size:22px;font-weight:900;color:#343a40;margin-top:6px;}'+
    '.qn-gate-sub{font-size:13px;color:#868e96;margin:6px 0 16px;font-weight:700;}'+
    '.qn-gate-name{width:100%;font-family:inherit;font-size:17px;border:2px solid #d0ebff;border-radius:14px;padding:12px 14px;background:#f8fbff;text-align:center;font-weight:800;color:#343a40;}'+
    '.qn-gate-name:focus{outline:none;border-color:#20c997;}'+
    '.qn-btn{border:none;border-radius:50px;padding:12px 28px;font-family:inherit;font-size:15px;font-weight:800;cursor:pointer;color:#fff;background:linear-gradient(135deg,#ffa94d,#f76707);box-shadow:0 8px 20px rgba(247,103,7,.4);margin-top:14px;}'+
    '.qn-btn.ghost{background:#f1f3f5;color:#5c6b8a;box-shadow:none;margin:0 4px;}'+
    '.qn-recbtn{position:fixed;right:14px;bottom:14px;z-index:9999;border:none;border-radius:50px;padding:10px 16px;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;color:#fff;background:linear-gradient(135deg,#4dabf7,#339af0);box-shadow:0 8px 20px rgba(51,154,240,.4);}'+
    '.qn-panel{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:10001;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -6px 40px rgba(0,0,0,.18);width:100%;max-width:560px;max-height:70vh;overflow:auto;padding:18px 18px 22px;display:none;}'+
    '.qn-panel.show{display:block;}'+
    '.qn-panel-title{font-size:16px;font-weight:900;color:#343a40;margin-bottom:6px;text-align:center;}'+
    '.qn-empty{text-align:center;color:#adb5bd;font-size:14px;padding:26px 0;font-weight:700;}'+
    '.qn-list{max-height:46vh;overflow:auto;margin-top:6px;}'+
    '.qn-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;border-bottom:1px solid #f1f3f5;padding:10px 2px;font-size:14px;color:#343a40;}'+
    '.qn-row b{color:#e8590c;font-size:15px;}'+
    '.qn-game{background:#f3f0ff;color:#7048e8;border-radius:10px;padding:2px 8px;font-size:12px;font-weight:800;}'+
    '.qn-detail{color:#adb5bd;font-size:12px;font-weight:600;}'+
    '.qn-when{color:#5c6b8a;font-size:13px;font-weight:700;}'+
    '.qn-panel-btns{text-align:center;margin-top:10px;}';
  document.head.appendChild(css);

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function nowStr() { var d = new Date(); return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // 开玩前，先让孩子填一次名字
  function nameGate(game, onDone) {
    if (_name) { onDone(_name); return; }
    if (!_gate) {
      _gate = document.createElement('div');
      _gate.className = 'qn-gate';
      _gate.innerHTML =
        '<div class="qn-gate-card">' +
          '<div class="qn-gate-emoji">✏️</div>' +
          '<div class="qn-gate-title">先写下你的名字吧</div>' +
          '<div class="qn-gate-sub">记录谁在闯关、谁得了分～</div>' +
          '<input type="text" class="qn-gate-name" maxlength="12" placeholder="小朋友叫什么名字？">' +
          '<button class="qn-btn">🚀 开始挑战</button>' +
        '</div>';
      document.body.appendChild(_gate);
      var input = _gate.querySelector('.qn-gate-name');
      var go = _gate.querySelector('.qn-btn');
      var last = '';
      try { last = localStorage.getItem(NAMEKEY) || ''; } catch (e) {}
      if (last) input.value = last;
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
      go.addEventListener('click', function () {
        var v = input.value.trim();
        if (!v) { input.focus(); input.style.borderColor = '#fa5252'; return; }
        _name = v;
        try { localStorage.setItem(NAMEKEY, v); } catch (e) {}
        _gate.classList.remove('show');
        onDone(v);
      });
      input.addEventListener('input', function () { input.style.borderColor = '#d0ebff'; });
    }
    _gate.classList.add('show');
  }

  // 开始一局：写一条记录
  function recordStart(game) {
    if (!_name) return;
    var a = load();
    a.push({ name: _name, game: game, detail: '开始挑战', when: nowStr() });
    _active = { idx: a.length - 1 };
    _game = game;
    save(a);
  }

  // 完成一局：把当前这条记录补上结果（中途结束/重开也各记一条）
  function recordFinish(detail) {
    if (!_name) return;
    var a = load();
    if (_active) {
      if (a[_active.idx]) a[_active.idx].detail = '完成 · ' + detail;
      _active = null;
    } else if (_game) {
      a.push({ name: _name, game: _game, detail: '完成 · ' + detail, when: nowStr() });
    }
    save(a);
  }

  // 「记录」按钮 + 弹层
  function recordButton() {
    if (_btn) return;
    _btn = document.createElement('button');
    _btn.className = 'qn-recbtn';
    _btn.textContent = '📋 记录';
    _btn.addEventListener('click', togglePanel);
    document.body.appendChild(_btn);
  }
  function togglePanel() {
    if (_panel && _panel.classList.contains('show')) { _panel.classList.remove('show'); return; }
    if (!_panel) { _panel = document.createElement('div'); _panel.className = 'qn-panel'; document.body.appendChild(_panel); }
    renderPanel();
    _panel.classList.add('show');
  }
  function renderPanel() {
    var a = load().slice().reverse();
    // 只突出最需要的三项：谁 · 几月几号 · 玩了什么
    var html = '<div class="qn-panel-title">📋 谁 · 几月几号 · 玩了什么</div>';
    if (a.length === 0) {
      html += '<div class="qn-empty">还没有记录，先写下名字玩一局吧～</div>';
    } else {
      html += '<div class="qn-list">';
      a.forEach(function (r) {
        html += '<div class="qn-row"><b>' + esc(r.name) + '</b>' +
                '<span class="qn-when">' + esc(r.when) + '</span>' +
                '<span class="qn-game">' + esc(r.game) + '</span>' +
                '<span class="qn-detail">' + esc(r.detail) + '</span></div>';
      });
      html += '</div>';
    }
    html += '<div class="qn-panel-btns"><button class="qn-btn ghost qn-copy">📋 复制记录</button><button class="qn-btn ghost qn-close">关闭</button></div>';
    _panel.innerHTML = html;
    _panel.querySelector('.qn-close').addEventListener('click', function () { _panel.classList.remove('show'); });
    _panel.querySelector('.qn-copy').addEventListener('click', function () {
      var text = a.map(function (r) { return r.name + ' · ' + r.when + ' · ' + r.game + ' · ' + r.detail; }).join('\n');
      try { navigator.clipboard.writeText(text); } catch (e) {}
      var b = _panel.querySelector('.qn-copy'); b.textContent = '✅ 已复制';
    });
  }

  window.qnNameGate = nameGate;
  window.qnRecordStart = recordStart;
  window.qnRecordFinish = recordFinish;
  window.qnRecordButton = recordButton;

  recordButton();
})();
