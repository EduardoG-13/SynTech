import db from './src/backend/config/database';
import { v7 as uuidv7 } from 'uuid';

const capataz = db.prepare("SELECT id, retiro_id FROM usuarios WHERE perfil='Capataz' LIMIT 1").get() as any;
if (!capataz) {
    console.error("Nenhum capataz encontrado!");
    process.exit(1);
}

const origemId = capataz.retiro_id;
const destino = db.prepare("SELECT id FROM retiros WHERE id != ? LIMIT 1").get(origemId) as any;
const destinoId = destino.id;
const dateStr = new Date().toISOString().slice(0, 10);

const insertMov = db.prepare(`
    INSERT INTO movimentacoes (
      id, capataz_id, retiro_id, data, categoria, quantidade,
      tipo_operacao, grupo_id, numero_boleta, 
      tipo_negocio, retiro_origem_id, retiro_destino_id,
      sincronizado, validado, criado_em
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      1, 1, ?
    )
`);

db.exec('BEGIN TRANSACTION');
try {
    const grupoEnvio = uuidv7();
    insertMov.run(
        uuidv7(), capataz.id, origemId, dateStr, 'BEZERRO', 10,
        'transferencia', grupoEnvio, 'BOL-MOCK-ENV',
        'envio', origemId, destinoId,
        new Date().toISOString()
    );

    const grupoReceb = uuidv7();
    insertMov.run(
        uuidv7(), capataz.id, destinoId, dateStr, 'BEZERRO', 8,
        'transferencia', grupoReceb, 'BOL-MOCK-REC',
        'recebimento', origemId, destinoId,
        new Date().toISOString()
    );

    db.exec('COMMIT');
    console.log("Mock boletas criadas com conflito (10 envios vs 8 recebimentos)!");
} catch (e) {
    db.exec('ROLLBACK');
    console.error(e);
}
