/**
 * middlewares/errorHandler.js
 * Middleware global de tratamento de erros.
 * Deve ser o ultimo middleware registrado no app.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  console.error('[ERRO ' + statusCode + '] ' + message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
