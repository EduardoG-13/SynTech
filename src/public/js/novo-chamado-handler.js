document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-novo-chamado');
  const fileInput = document.getElementById('foto');
  const fileLabel = document.querySelector('.file-input-wrapper span');

  if (!form) return;

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        if (fileLabel) fileLabel.textContent = `${fileInput.files[0].name}`;
      } else {
        if (fileLabel) fileLabel.textContent = 'Selecionar imagem';
      }
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const descricao = document.getElementById('descricao')?.value.trim() || '';
    const latitude = document.getElementById('latitude')?.value.trim() || '';
    const longitude = document.getElementById('longitude')?.value.trim() || '';
    const tipo = document.getElementById('tipo-ocorrencia')?.value || '';

    if (!tipo) {
      alert('Escolha o tipo de ocorrência.');
      return;
    }

    if (descricao.length < 10) {
      alert('A descrição deve conter ao menos 10 caracteres.');
      return;
    }

    if (!latitude || !longitude) {
      alert('Preencha as coordenadas GPS.');
      return;
    }

    if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
      alert('As coordenadas GPS devem ser números válidos.');
      return;
    }

    alert('Chamado preparado para envio!\n\nSe esta página estiver integrada ao backend do BRPec, você poderá enviar os dados do chamado automaticamente.');
    form.reset();
    if (fileLabel) fileLabel.textContent = 'Selecionar imagem';
  });
});
