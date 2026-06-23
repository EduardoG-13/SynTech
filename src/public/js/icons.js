(function () {
  'use strict';

  // Vocabulário único de ícones da interface. Os nomes correspondem à
  // biblioteca oficial Google Material Symbols Rounded, hospedada localmente.
  var icons = {
    abate: 'agriculture',
    abaco_calculo_total: 'calculate',
    acesso_restrito: 'shield_lock',
    alerta: 'warning',
    andamento: 'pending',
    aperto_maos_acordo: 'handshake',
    bebedouro: 'water_drop',
    bloqueado: 'lock',
    boleta: 'description',
    Brinco: 'sell',
    bussola_direcao_guia: 'explore',
    calendario_pagina_agenda: 'calendar_month',
    caminhao_transporte_gado: 'local_shipping',
    capataz: 'engineering',
    carrinho_compras_gado: 'shopping_cart',
    cedula_dinheiro_bovino: 'payments',
    cerca: 'fence',
    cerca_eletrica: 'electric_bolt',
    cerca_quebrada: 'fence',
    comitiva_peao_a_cavalo: 'directions_walk',
    concluido: 'check_circle',
    configuracao: 'settings',
    coordenador: 'groups',
    dashboard_analise_dados: 'dashboard',
    destido: 'location_on',
    editar: 'edit',
    eletrica: 'electric_bolt',
    entrada_animais_recebimento_compra: 'call_received',
    envio_animais_caixa: 'call_made',
    evolucao: 'trending_up',
    excluir: 'delete',
    exit: 'logout',
    gerente: 'manage_accounts',
    GPS: 'my_location',
    grava_audio: 'mic',
    hidraulica: 'water_drop',
    historico_tempo_voltar: 'history',
    home: 'home',
    identidade: 'badge',
    indicador_com_dedo: 'touch_app',
    infra: 'construction',
    iniciar_task: 'play_arrow',
    instalar_aplicativo_celular: 'install_mobile',
    localizacao: 'location_on',
    lupa: 'search',
    movimentacao: 'swap_horiz',
    nascimento: 'pets',
    notificacao_dispositivo_movel: 'notifications',
    obto: 'heart_broken',
    offline: 'cloud_off',
    olho_senha_aberto: 'visibility',
    olho_senha_fechado: 'visibility_off',
    Pasto: 'grass',
    pendente: 'pending',
    Placa_de_carro: 'pin',
    salvar: 'save',
    sincroniza: 'sync',
    sincronizacao: 'sync',
    tarefa_concluida_sucesso: 'task_alt',
    tarefa_pendente_aguardando_acao: 'pending_actions',
    tarefas: 'assignment',
    tira_foto: 'photo_camera',
    voltar: 'arrow_back'
  };

  function name(key) {
    return icons[key] || 'category';
  }

  function html(key, className) {
    var classes = 'material-symbols-rounded ui-icon';
    if (className) classes += ' ' + className;
    return '<span class="' + classes + '" aria-hidden="true">' + name(key) + '</span>';
  }

  window.BRPIcons = { name: name, html: html, map: icons };
})();
