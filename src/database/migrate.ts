import 'dotenv/config';
import { getDatabase } from './connection';

getDatabase();

console.log('Migrations executadas com sucesso.');
