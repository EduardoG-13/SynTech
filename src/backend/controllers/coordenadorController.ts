import { Request, Response } from 'express';
import coordenadorService from '../services/coordenadorService';

interface SessUsuario {
  id: string;
  perfil: string;
}

// ============ APROVAÇÃO ============

export function listarBoletasPendentes(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const grupos = coordenadorService.listarBoletasPendentes(sess);
    return res.json(grupos);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}

export function aprovarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const idOuGrupo = String(req.params.id);
  try {
    const linhasAtualizadas = coordenadorService.aprovarBoleta(sess, idOuGrupo);
    return res.json({ mensagem: 'Boleta aprovada.', linhas_atualizadas: linhasAtualizadas });
  } catch (error: any) {
    if (error.message === 'Boleta não encontrada.') return res.status(404).json({ erro: error.message });
    if (error.message.includes('Você não é o coordenador')) return res.status(403).json({ erro: error.message });
    return res.status(500).json({ erro: error.message });
  }
}

// ============ EXPORTAÇÃO ============

export async function exportarCsv(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).send('Não autenticado.');

  try {
    const f = req.query as any;
    const formato = (f.formato || 'xlsx').toLowerCase();
    const rows = coordenadorService.buscarMovimentacoesParaExport(sess, f);

    if (formato === 'csv') {
      const csv = coordenadorService.gerarCsv(rows);
      const nomeCsv = f.ids
        ? `boletas_selecionadas_${new Date().toISOString().slice(0, 10)}.csv`
        : `boletas_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeCsv}"`);
      return res.send(csv);
    }

    // === XLSX ===
    const buffer = await coordenadorService.gerarXlsx(rows);
    const filename = f.ids
      ? `boletas_selecionadas_${new Date().toISOString().slice(0, 10)}.xlsx`
      : `boletas_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error: any) {
    return res.status(500).send(error.message);
  }
}

// ============ PDF INDIVIDUAL ============

export function exportarBoletaPdf(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).send('Não autenticado.');

  const idOuGrupo = String(req.params.grupo_id);
  
  try {
    const { stream, filename } = coordenadorService.gerarBoletaPdf(sess, idOuGrupo);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  } catch (error: any) {
    if (error.message === 'Boleta não encontrada.') return res.status(404).send(error.message);
    if (error.message === 'Sem permissão pra essa boleta.') return res.status(403).send(error.message);
    return res.status(500).send(error.message);
  }
}
