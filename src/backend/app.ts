import express from 'express';
import cors from 'cors';
<<<<<<< HEAD
import path from 'path';
=======
import path from 'path'; // gerencia caminhos fisicos dos arquivos
import { RETIROS } from './config/retiros';
>>>>>>> 27cf09916327b3c6260fee33ef43bff7b3f12f5c

const app = express();
const projectRoot = process.cwd();

// === 1. CONFIGURAÇÕES DO EJS (MOTOR DE VISUALIZAÇÃO) ===
app.set('view engine', 'ejs');
// Aponta para a pasta "views" subindo um nível a partir de "src/backend" (../views)
app.set('views', path.join(__dirname, '../views'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
<<<<<<< HEAD
app.use('/public', express.static(path.join(projectRoot, 'src/public')));

// --------------- Views ---------------
app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'src/views'));
=======
app.use('/public', express.static(path.join(__dirname, '../public')));
>>>>>>> 27cf09916327b3c6260fee33ef43bff7b3f12f5c

// === 3. SERVIR ARQUIVOS ESTÁTICOS (styles, js, imagens) ===
// Permite que o navegador acesse os arquivos de "src/public" sob o caminho "/public/..."
app.use('/public', express.static(path.join(__dirname, '../public')));

// === 4. ROTAS DO FRONT-END (EJS) ===

// 1. Tela de Login (Quem é você?)
app.get('/', (req, res) => {
  res.render('login');
});

// 2. Tela de Seleção de Retiro (para o Capataz)
app.get('/selecionar-retiro', (req, res) => {
  res.render('selecionar-retiro', { retiros: RETIROS });
});

// 3. Tela de Lista de Tarefas (Já com a Sidebar Vertical ativa)
app.get('/tarefas', (req, res) => {
  // Captura o perfil e o retiro da URL (Ex: /tarefas?perfil=Capataz&retiro=Acurizal)
  const perfil = req.query.perfil || 'Capataz';
  const retiro = req.query.retiro || 'Geral';
  
  res.render('tarefas', { perfil, retiro });
});

// === 5. ROTAS DA API (BACKEND) ===
import routes from './routes/index';
app.get('/', (_req, res) => {
  res.render('index');
});

app.use('/api', routes);

// --------------- View Routes ---------------
import viewRoutes from './routes/viewRoutes';
app.use('/', viewRoutes);

export default app;
