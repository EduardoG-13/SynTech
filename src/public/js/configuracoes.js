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
        var dispEl = document.getElementById('conteudo-dispositivos');
        if (dispEl) {
          dispEl.style.display = aba === 'dispositivos' ? 'block' : 'none';
          if (aba === 'dispositivos') carregarDispositivos();
        }
        var auditEl = document.getElementById('conteudo-auditoria');
        if (auditEl) {
          auditEl.style.display = aba === 'auditoria' ? 'block' : 'none';
          if (aba === 'auditoria') carregarAuditoria();
        }
      });
    });
  }

  function carregarAuditoria() {
    var cont = document.getElementById('lista-auditoria-admin');
    if (!cont) return;
    cont.innerHTML = '<p style="color:#8A8A7C;">Carregando...</p>';
    fetch('/api/admin/auditoria?limite=200', { credentials: 'same-origin' })
      .then(tratarResposta)
      .then(function (rows) {
        if (!rows || !rows.length) {
          cont.innerHTML = '<p style="color:#8A8A7C;">Nenhum registro de auditoria encontrado.</p>';
          return;
        }
        cont.innerHTML = rows.map(renderAuditoriaItem).join('');
      })
      .catch(function () {
        cont.innerHTML = '<p style="color:#C0392B;">Erro ao carregar auditoria.</p>';
      });
  }


  function renderAuditoriaItem(r) {
    var rota = r.rota || '';
    var entidade = entidadeAmigavel(r);
    var acao = acaoAmigavel(r, entidade);
    var quando = formatarDataAuditoria(r.criado_em);
    var usuario = r.usuario_nome || 'Usu\u00e1rio n\u00e3o identificado';
    var perfil = r.perfil || 'Perfil n\u00e3o informado';
    var status = statusAuditoria(r.status_http);
    var metodo = r.metodo || 'A\u00e7\u00e3o';
    var icone = iconeAuditoria(r, status);
    var idCurto = extrairIdCurto(rota);

    return '<article class="audit-card ' + status.classeCard + '">' +
      '<div class="audit-icon">' + BRPIcons.html(icone, 'ico-sm') + '</div>' +
      '<div class="audit-content">' +
        '<div class="audit-head">' +
          '<strong class="audit-title">' + escaparHtml(acao) + '</strong>' +
          '<span class="audit-status ' + status.classe + '">' + escaparHtml(status.label) + '</span>' +
        '</div>' +
        '<div class="audit-meta">' +
          '<span>' + BRPIcons.html('calendario_pagina_agenda', 'ico-sm') + escaparHtml(quando || '-') + '</span>' +
          '<span>' + BRPIcons.html('identidade', 'ico-sm') + escaparHtml(usuario) + '</span>' +
          '<span>' + BRPIcons.html('gerente', 'ico-sm') + escaparHtml(perfil) + '</span>' +
        '</div>' +
        '<div class="audit-tags">' +
          '<span class="audit-tag">' + escaparHtml(entidade) + '</span>' +
          '<span class="audit-tag">' + escaparHtml(metodo) + '</span>' +
          '<span class="audit-tag">' + escaparHtml(status.http) + '</span>' +
          (idCurto ? '<span class="audit-tag audit-tag-id">ID ' + escaparHtml(idCurto) + '</span>' : '') +
        '</div>' +
        (rota ? '<details class="audit-route"><summary>Ver rota t\u00e9cnica</summary><code>' + escaparHtml(rota) + '</code></details>' : '') +
      '</div>' +
    '</article>';
  }

  function entidadeAmigavel(r) {
    var rota = String(r.rota || '').toLowerCase();
    var entidade = String(r.entidade_tipo || '').toLowerCase();
    if (rota.includes('/chamados') || entidade === 'chamado') return 'Chamado';
    if (rota.includes('/boletas') || entidade === 'boleta') return 'Boleta';
    if (rota.includes('/tarefas') || entidade === 'tarefa') return 'Tarefa';
    if (rota.includes('/retiros') || entidade === 'retiro') return 'Retiro';
    if (rota.includes('/usuarios') || entidade === 'usuario') return 'Usu\u00e1rio';
    if (rota.includes('/dispositivos') || entidade === 'dispositivo') return 'Dispositivo';
    if (rota.includes('/sincronizacao') || entidade === 'sincronizacao') return 'Sincroniza\u00e7\u00e3o';
    return 'Sistema';
  }

  function acaoAmigavel(r, entidade) {
    var rota = String(r.rota || '').toLowerCase();
    var metodo = String(r.metodo || '').toUpperCase();
    var acao = String(r.acao || '').toLowerCase();

    if (rota.includes('/iniciar')) return entidade + ' iniciado';
    if (rota.includes('/resolver')) return entidade + ' resolvido';
    if (rota.includes('/sincronizacao')) return 'Sincroniza\u00e7\u00e3o executada';
    if (metodo === 'POST' || acao.includes('cria')) return entidade + ' criado';
    if (metodo === 'PUT' || metodo === 'PATCH' || acao.includes('edi')) return entidade + ' atualizado';
    if (metodo === 'DELETE' || acao.includes('excl')) return entidade + ' exclu\u00eddo';
    return entidade + ' acessado';
  }

  function statusAuditoria(statusHttp) {
    var codigo = Number(statusHttp);
    if (!codigo) return { label: 'Sem status', http: 'sem HTTP', classe: 'neutro', classeCard: 'audit-neutro' };
    if (codigo >= 200 && codigo < 300) return { label: 'Sucesso', http: 'HTTP ' + codigo, classe: 'ok', classeCard: 'audit-ok' };
    if (codigo >= 400) return { label: 'Falha', http: 'HTTP ' + codigo, classe: 'erro', classeCard: 'audit-erro' };
    return { label: 'Aten\u00e7\u00e3o', http: 'HTTP ' + codigo, classe: 'alerta', classeCard: 'audit-alerta' };
  }

  function iconeAuditoria(r, status) {
    var entidade = entidadeAmigavel(r);
    if (status.classe === 'erro') return 'alerta';
    if (entidade === 'Chamado') return 'infra';
    if (entidade === 'Boleta') return 'boleta';
    if (entidade === 'Tarefa') return 'tarefas';
    if (entidade === 'Retiro') return 'localizacao';
    if (entidade === 'Usu\u00e1rio') return 'gerente';
    if (entidade === 'Dispositivo') return 'instalar_aplicativo_celular';
    if (entidade === 'Sincroniza\u00e7\u00e3o') return 'sincronizacao';
    return 'concluido';
  }

  function extrairIdCurto(rota) {
    var match = String(rota || '').match(/[0-9a-f]{8}-[0-9a-f-]{20,}/i);
    if (!match) return '';
    return match[0].slice(-6);
  }

  function formatarDataAuditoria(valor) {
    if (!valor) return '';
    var texto = String(valor).replace('T', ' ').slice(0, 16);
    var partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!partes) return texto;
    return partes[3] + '/' + partes[2] + '/' + partes[1] + ' \u00e0s ' + partes[4] + ':' + partes[5];
  }

  function escaparHtml(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------- Dispositivos ----------
  function carregarDispositivos() {
    var cont = document.getElementById('lista-dispositivos-admin');
    if (!cont) return;
    cont.innerHTML = '<p style="color:#8A8A7C;">Carregando…</p>';
    fetch('/api/admin/dispositivos', { credentials: 'same-origin' })
      .then(tratarResposta)
      .then(function (rows) {
        if (!rows || !rows.length) {
          cont.innerHTML = '<p style="color:#8A8A7C;">Nenhum dispositivo vinculado ainda.</p>';
          return;
        }
        cont.innerHTML = rows.map(function (d) {
          var revogado = !!d.revogado_em;
          var ultimo = (d.ultimo_acesso || '').slice(0, 16).replace('T', ' ');
          var botoes = '';
          if (revogado) {
            botoes = '<button class="btn-apagar-disp" data-id="' + d.id + '" style="background:none; border:1px solid #D32F2F; color:#D32F2F; border-radius:8px; padding:0.3rem 0.7rem; cursor:pointer; font-size:0.85rem;">' + BRPIcons.html('excluir', 'ico-sm') + ' Apagar</button>';
          } else {
            botoes = '<button class="btn-revogar-disp" data-id="' + d.id + '" style="background:none; border:1px solid #D32F2F; color:#D32F2F; border-radius:8px; padding:0.3rem 0.7rem; cursor:pointer; font-size:0.85rem;">Revogar</button>';
          }
          return '<div class="lista-item" style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.6rem 0.8rem; border:1px solid #e5e5e0; border-radius:10px; margin-bottom:0.4rem; ' + (revogado ? 'opacity:0.55;' : '') + '">' +
            '<div>' +
              '<div><strong>' + BRPIcons.html('localizacao', 'ico-sm') + ' ' + (d.retiro_nome || '—') + '</strong> · ' + BRPIcons.html('capataz', 'ico-sm') + ' ' + (d.capataz_nome || '—') + '</div>' +
              '<small style="color:#8A8A7C;">Último acesso: ' + (ultimo || '—') + (revogado ? ' · revogado' : '') + '</small>' +
            '</div>' +
            botoes +
          '</div>';
        }).join('');
        cont.querySelectorAll('.btn-revogar-disp').forEach(function (b) {
          b.addEventListener('click', function () { revogarDispositivo(b.dataset.id); });
        });
        cont.querySelectorAll('.btn-apagar-disp').forEach(function (b) {
          b.addEventListener('click', function () { excluirDispositivo(b.dataset.id); });
        });
      })
      .catch(function () { cont.innerHTML = '<p style="color:#C0392B;">Erro ao carregar dispositivos.</p>'; });
  }

  function revogarDispositivo(id) {
    if (!confirm('Revogar este dispositivo? Ele vai pedir seleção de retiro no próximo acesso.')) return;
    fetch('/api/admin/dispositivos/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function () { carregarDispositivos(); })
      .catch(function () { msg(' Erro ao revogar dispositivo.', 'erro'); });
  }

  function excluirDispositivo(id) {
    if (!confirm('Apagar este dispositivo definitivamente? Ele será removido da lista.')) return;
    fetch('/api/admin/dispositivos/' + encodeURIComponent(id) + '/apagar', { method: 'DELETE', credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function () { msg(' Dispositivo apagado.', 'sucesso'); carregarDispositivos(); })
      .catch(function () { msg(' Erro ao apagar dispositivo.', 'erro'); });
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
        msg(' Erro ao carregar dados.', 'erro');
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
          '<span>' + BRPIcons.html('capataz', 'ico-sm') + ' ' + (r.capataz_nome || '—') + ' · ' + BRPIcons.html('coordenador', 'ico-sm') + ' ' + (r.coordenador_nome || '—') + '</span>' +
        '</div>' +
        '<div class="item-acoes">' +
          '<button class="btn-edit" data-id="' + r.id + '" aria-label="Editar retiro">' + BRPIcons.html('editar') + '</button>' +
          '<button class="btn-del" data-id="' + r.id + '" aria-label="Excluir retiro">' + BRPIcons.html('excluir') + '</button>' +
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
        ? ' <span class="badge-perfil admin">' + BRPIcons.html('acesso_restrito', 'ico-sm') + ' ADM</span>'
        : '';
      return '<div class="item-admin">' +
        '<div class="item-info">' +
          '<strong>' + u.nome + '</strong>' +
          '<span class="badge-perfil ' + u.perfil.toLowerCase() + '">' + u.perfil + '</span>' + badgeAdmin +
        '</div>' +
        '<div class="item-acoes">' +
          '<button class="btn-edit" data-id="' + u.id + '" aria-label="Editar usuário">' + BRPIcons.html('editar') + '</button>' +
          '<button class="btn-del" data-id="' + u.id + '" aria-label="Excluir usuário">' + BRPIcons.html('excluir') + '</button>' +
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
        msg(' Retiro salvo!', 'sucesso');
        resetFormRetiro();
        carregarTudo();
      })
      .catch(function () { msg(' Erro ao salvar retiro.', 'erro'); });
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
      .then(function () { msg(' Retiro excluído.', 'sucesso'); carregarTudo(); })
      .catch(function () { msg(' Erro ao excluir.', 'erro'); });
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
    if (!id && !payload.senha) { msg(' Informe uma senha para o novo usuário.', 'erro'); return; }

    var url = id ? '/api/admin/usuarios/' + id : '/api/admin/usuarios';
    var metodo = id ? 'PUT' : 'POST';

    fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(tratarResposta)
      .then(function (res) {
        if (res && res.erro) { msg(' ' + res.erro, 'erro'); return; }
        msg(' Usuário salvo!', 'sucesso');
        resetFormUsuario();
        carregarTudo();
      })
      .catch(function () { msg(' Erro ao salvar usuário.', 'erro'); });
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
        if (res && res.erro) { msg(' ' + res.erro, 'erro'); return; }
        msg(' Usuário excluído.', 'sucesso');
        carregarTudo();
      })
      .catch(function () { msg(' Erro ao excluir.', 'erro'); });
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
