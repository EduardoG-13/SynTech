/* configuracoes.js — CRUD de retiros e usuários (Gerente) */

(function () {
  var retirosCache = [];
  var usuariosCache = [];

  document.addEventListener('DOMContentLoaded', function () {
    configurarAbas();
    configurarPerfilUsuario();
    carregarTudo();

    document.getElementById('form-retiro').addEventListener('submit', salvarRetiro);
    document.getElementById('form-usuario').addEventListener('submit', salvarUsuario);
    document.getElementById('ret-btn-cancelar').addEventListener('click', resetFormRetiro);
    document.getElementById('usr-btn-cancelar').addEventListener('click', resetFormUsuario);
  });

  // ---------- Abas ----------
  function configurarAbas() {
    document.querySelectorAll('.aba').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.aba').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var aba = btn.dataset.aba;
        document.getElementById('conteudo-retiros').style.display = aba === 'retiros' ? 'block' : 'none';
        document.getElementById('conteudo-usuarios').style.display = aba === 'usuarios' ? 'block' : 'none';
      });
    });
  }

  // Mostra retiro só p/ Capataz; checkbox de admin só p/ Gerente
  function configurarPerfilUsuario() {
    var sel = document.getElementById('usr-perfil');
    sel.addEventListener('change', function () {
      document.getElementById('usr-retiro-wrap').style.display = sel.value === 'Capataz' ? 'block' : 'none';
      document.getElementById('usr-admin-wrap').style.display = sel.value === 'Gerente' ? 'block' : 'none';
    });
  }

  // ---------- Carregamento ----------
  function carregarTudo() {
    Promise.all([
      fetch('/api/admin/retiros').then(tratarResposta),
      fetch('/api/admin/usuarios').then(tratarResposta)
    ]).then(function (res) {
      retirosCache = res[0] || [];
      usuariosCache = res[1] || [];
      preencherSelects();
      renderRetiros();
      renderUsuarios();
    }).catch(function (err) {
      if (err && err.acesso === false) {
        document.getElementById('config-aviso').style.display = 'block';
      } else {
        msg('❌ Erro ao carregar dados.', 'erro');
      }
    });
  }

  function tratarResposta(r) {
    if (r.status === 403) { return Promise.reject({ acesso: false }); }
    return r.json();
  }

  function preencherSelects() {
    var capatazes = usuariosCache.filter(function (u) { return u.perfil === 'Capataz'; });
    var coords = usuariosCache.filter(function (u) { return u.perfil === 'Coordenador'; });

    var optCap = '<option value="">— Sem capataz —</option>' +
      capatazes.map(function (u) { return '<option value="' + u.id + '">' + u.nome + '</option>'; }).join('');
    var optCoord = '<option value="">— Sem coordenador —</option>' +
      coords.map(function (u) { return '<option value="' + u.id + '">' + u.nome + '</option>'; }).join('');

    document.getElementById('ret-capataz').innerHTML = optCap;
    document.getElementById('ret-coord').innerHTML = optCoord;

    var optRet = '<option value="">— Sem retiro —</option>' +
      retirosCache.map(function (r) { return '<option value="' + r.id + '">' + r.nome + '</option>'; }).join('');
    document.getElementById('usr-retiro').innerHTML = optRet;
  }

  // ---------- Render listas ----------
  function renderRetiros() {
    var cont = document.getElementById('lista-retiros-admin');
    if (!retirosCache.length) { cont.innerHTML = '<p class="vazio">Nenhum retiro cadastrado.</p>'; return; }
    cont.innerHTML = retirosCache.map(function (r) {
      return '<div class="item-admin">' +
        '<div class="item-info">' +
          '<strong>' + r.nome + (r.numero ? ' (' + r.numero + ')' : '') + '</strong>' +
          '<span>👷 ' + (r.capataz_nome || '—') + '  ·  📋 ' + (r.coordenador_nome || '—') + '</span>' +
        '</div>' +
        '<div class="item-acoes">' +
          '<button class="btn-edit" data-id="' + r.id + '">✏️</button>' +
          '<button class="btn-del" data-id="' + r.id + '">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('');

    cont.querySelectorAll('.btn-edit').forEach(function (b) {
      b.addEventListener('click', function () { editarRetiro(b.dataset.id); });
    });
    cont.querySelectorAll('.btn-del').forEach(function (b) {
      b.addEventListener('click', function () { excluirRetiro(b.dataset.id); });
    });
  }

  function renderUsuarios() {
    var cont = document.getElementById('lista-usuarios-admin');
    if (!usuariosCache.length) { cont.innerHTML = '<p class="vazio">Nenhum usuário cadastrado.</p>'; return; }
    cont.innerHTML = usuariosCache.map(function (u) {
      var badgeAdmin = (u.perfil === 'Gerente' && u.is_admin)
        ? ' <span class="badge-perfil admin">🛡️ ADM</span>'
        : '';
      return '<div class="item-admin">' +
        '<div class="item-info">' +
          '<strong>' + u.nome + '</strong>' +
          '<span class="badge-perfil ' + u.perfil.toLowerCase() + '">' + u.perfil + '</span>' + badgeAdmin +
        '</div>' +
        '<div class="item-acoes">' +
          '<button class="btn-edit" data-id="' + u.id + '">✏️</button>' +
          '<button class="btn-del" data-id="' + u.id + '">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('');

    cont.querySelectorAll('.btn-edit').forEach(function (b) {
      b.addEventListener('click', function () { editarUsuario(b.dataset.id); });
    });
    cont.querySelectorAll('.btn-del').forEach(function (b) {
      b.addEventListener('click', function () { excluirUsuario(b.dataset.id); });
    });
  }

  // ---------- Retiro: salvar/editar/excluir ----------
  function salvarRetiro(e) {
    e.preventDefault();
    var id = document.getElementById('ret-id').value;
    var payload = {
      nome: document.getElementById('ret-nome').value.trim(),
      numero: document.getElementById('ret-numero').value.trim(),
      localizacao: document.getElementById('ret-local').value.trim(),
      capataz_id: document.getElementById('ret-capataz').value,
      coordenador_id: document.getElementById('ret-coord').value
    };
    var url = id ? '/api/admin/retiros/' + id : '/api/admin/retiros';
    var metodo = id ? 'PUT' : 'POST';

    fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(tratarResposta)
      .then(function () {
        msg('✅ Retiro salvo!', 'sucesso');
        resetFormRetiro();
        carregarTudo();
      })
      .catch(function () { msg('❌ Erro ao salvar retiro.', 'erro'); });
  }

  function editarRetiro(id) {
    var r = retirosCache.find(function (x) { return x.id === id; });
    if (!r) return;
    document.getElementById('ret-id').value = r.id;
    document.getElementById('ret-nome').value = r.nome || '';
    document.getElementById('ret-numero').value = r.numero || '';
    document.getElementById('ret-local').value = r.localizacao || '';
    document.getElementById('ret-capataz').value = r.capataz_id || '';
    document.getElementById('ret-coord').value = r.coordenador_id || '';
    document.getElementById('ret-btn-cancelar').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function excluirRetiro(id) {
    if (!confirm('Excluir este retiro?')) return;
    fetch('/api/admin/retiros/' + id, { method: 'DELETE' })
      .then(tratarResposta)
      .then(function () { msg('🗑️ Retiro excluído.', 'sucesso'); carregarTudo(); })
      .catch(function () { msg('❌ Erro ao excluir.', 'erro'); });
  }

  function resetFormRetiro() {
    document.getElementById('form-retiro').reset();
    document.getElementById('ret-id').value = '';
    document.getElementById('ret-btn-cancelar').style.display = 'none';
  }

  // ---------- Usuário: salvar/editar/excluir ----------
  function salvarUsuario(e) {
    e.preventDefault();
    var id = document.getElementById('usr-id').value;
    var perfil = document.getElementById('usr-perfil').value;
    var payload = {
      nome: document.getElementById('usr-nome').value.trim(),
      senha: document.getElementById('usr-senha').value,
      perfil: perfil,
      retiro_id: perfil === 'Capataz' ? document.getElementById('usr-retiro').value : '',
      is_admin: perfil === 'Gerente' ? document.getElementById('usr-is-admin').checked : false
    };
    if (!id && !payload.senha) { msg('❌ Informe uma senha para o novo usuário.', 'erro'); return; }

    var url = id ? '/api/admin/usuarios/' + id : '/api/admin/usuarios';
    var metodo = id ? 'PUT' : 'POST';

    fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(tratarResposta)
      .then(function (res) {
        if (res && res.erro) { msg('❌ ' + res.erro, 'erro'); return; }
        msg('✅ Usuário salvo!', 'sucesso');
        resetFormUsuario();
        carregarTudo();
      })
      .catch(function () { msg('❌ Erro ao salvar usuário.', 'erro'); });
  }

  function editarUsuario(id) {
    var u = usuariosCache.find(function (x) { return x.id === id; });
    if (!u) return;
    document.getElementById('usr-id').value = u.id;
    document.getElementById('usr-nome').value = u.nome || '';
    document.getElementById('usr-senha').value = '';
    document.getElementById('usr-senha-hint').style.display = 'block';
    document.getElementById('usr-perfil').value = u.perfil;
    document.getElementById('usr-retiro-wrap').style.display = u.perfil === 'Capataz' ? 'block' : 'none';
    document.getElementById('usr-retiro').value = u.retiro_id || '';
    document.getElementById('usr-admin-wrap').style.display = u.perfil === 'Gerente' ? 'block' : 'none';
    document.getElementById('usr-is-admin').checked = !!u.is_admin;
    document.getElementById('usr-btn-cancelar').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function excluirUsuario(id) {
    if (!confirm('Excluir este usuário?')) return;
    fetch('/api/admin/usuarios/' + id, { method: 'DELETE' })
      .then(tratarResposta)
      .then(function (res) {
        if (res && res.erro) { msg('❌ ' + res.erro, 'erro'); return; }
        msg('🗑️ Usuário excluído.', 'sucesso');
        carregarTudo();
      })
      .catch(function () { msg('❌ Erro ao excluir.', 'erro'); });
  }

  function resetFormUsuario() {
    document.getElementById('form-usuario').reset();
    document.getElementById('usr-id').value = '';
    document.getElementById('usr-senha-hint').style.display = 'none';
    document.getElementById('usr-retiro-wrap').style.display = 'none';
    document.getElementById('usr-btn-cancelar').style.display = 'none';
  }

  // ---------- Mensagem ----------
  function msg(texto, tipo) {
    var el = document.getElementById('config-msg');
    el.textContent = texto;
    el.className = 'config-msg ' + tipo;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { el.style.display = 'none'; }, 3000);
  }
})();
