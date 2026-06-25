(function() {
  document.addEventListener('DOMContentLoaded', function() {
    if (!window.RETIRO_ID) return;

    fetch('/api/dashboard/retiros/' + window.RETIRO_ID, { credentials: 'same-origin' })
      .then(function(r) { 
        if (!r.ok) throw new Error('Erro ao carregar retiro');
        return r.json(); 
      })
      .then(function(data) {
        document.getElementById('rd-loader').style.display = 'none';
        document.getElementById('rd-main').style.display = 'block';

        var r = data.retiro;
        document.getElementById('rd-titulo').textContent = r.nome;

        document.getElementById('rd-info-nome').textContent = r.nome;
        document.getElementById('rd-info-numero').textContent = r.numero || '—';
        document.getElementById('rd-info-coordenador').textContent = r.coordenador_nome || '—';
        document.getElementById('rd-info-capataz').textContent = r.capataz_nome || '—';

        var res = data.resumo;
        document.getElementById('rd-boletas-total').textContent = res.total_boletas || 0;
        document.getElementById('rd-boletas-pendentes').textContent = res.boletas_pendentes || 0;
        document.getElementById('rd-chamados-total').textContent = res.chamados_total || 0;
        document.getElementById('rd-chamados-resolvidos').textContent = res.chamados_resolvidos || 0;

        document.getElementById('rd-pill-abertos').textContent = (res.chamados_abertos || 0) + ' abertos';
        document.getElementById('rd-pill-andamento').textContent = (res.chamados_andamento || 0) + ' em andamento';
        document.getElementById('rd-pill-resolvidos').textContent = (res.chamados_resolvidos || 0) + ' resolvidos';

        // Listas
        var contBoletas = document.getElementById('rd-lista-boletas');
        if (!data.boletasRecentes || !data.boletasRecentes.length) {
            contBoletas.innerHTML = '<p style="color:#8A8A7C; text-align: center; padding: 2rem;">Nenhuma boleta registrada neste retiro.</p>';
        } else {
            contBoletas.innerHTML = data.boletasRecentes.map(function(b) {
                return '<div style="padding: 1rem; border: 1px solid #e5e5e0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; background: #fff;">' +
                       '<div><strong style="text-transform: capitalize; font-size: 1.05rem;">' + b.operacao + '</strong><br><small style="color:#8A8A7C">' + (b.data ? b.data.split('T')[0] : '') + '</small></div>' +
                       '<div style="text-align:right;"><strong style="font-size: 1.05rem;">' + b.total_animais + ' cab.</strong><br><small style="color:' + (b.aprovada ? '#2E7D52' : '#A64B00') + '; font-weight: 600;">' + (b.aprovada ? 'Aprovada' : 'Pendente') + '</small></div>' +
                       '</div>';
            }).join('');
        }

        var contChamados = document.getElementById('rd-lista-chamados');
        if (!data.chamadosRecentes || !data.chamadosRecentes.length) {
            contChamados.innerHTML = '<p style="color:#8A8A7C; text-align: center; padding: 2rem;">Nenhum chamado registrado neste retiro.</p>';
        } else {
            contChamados.innerHTML = data.chamadosRecentes.map(function(c) {
                var color = c.status === 'ABERTO' ? '#D32F2F' : (c.status === 'RESOLVIDO' ? '#2E7D52' : '#A64B00');
                var statusText = c.status.replace('_', ' ');
                return '<div style="padding: 1rem; border: 1px solid #e5e5e0; border-radius: 8px; background: #fff;">' +
                       '<div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">' +
                       '<strong style="text-transform: capitalize; font-size: 1.05rem;">' + c.tipo + '</strong> <span style="font-size:0.8rem; font-weight:700; text-transform: uppercase; color:' + color + ';">' + statusText + '</span>' +
                       '</div>' +
                       '<div style="font-size:0.9rem; color:#5c6b5d;">' + (c.descricao || '') + '</div>' +
                       '</div>';
            }).join('');
        }
      })
      .catch(function(err) {
        document.getElementById('rd-loader').innerHTML = '<span style="color:#D32F2F">Erro ao carregar detalhes do retiro.</span>';
      });
  });
})();
