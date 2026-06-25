import session from 'express-session';
import db from '../config/database';

export class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    // Cria a tabela de sessões caso não exista
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      )
    `);
  }

  get(sid: string, callback: (err: any, session?: session.SessionData | null) => void) {
    try {
      const row = db.prepare('SELECT sess, expire FROM sessions WHERE sid = ?').get(sid) as any;
      if (!row) {
        return callback(null, null);
      }
      // Verifica se expirou
      if (row.expire < Date.now()) {
        this.destroy(sid, () => {});
        return callback(null, null);
      }
      return callback(null, JSON.parse(row.sess));
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      let expire = Date.now() + 86400000; // Padrão: 1 dia
      if (sessionData?.cookie?.expires) {
        expire = new Date(sessionData.cookie.expires).getTime();
      } else if (sessionData?.cookie?.originalMaxAge) {
        expire = Date.now() + sessionData.cookie.originalMaxAge;
      }
      
      const sessStr = JSON.stringify(sessionData);
      
      db.prepare(`
        INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expire = excluded.expire
      `).run(sid, sessStr, expire);
      
      if (callback) callback();
    } catch (err) {
      if (callback) callback(err);
    }
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      if (callback) callback();
    } catch (err) {
      if (callback) callback(err);
    }
  }

  touch(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      let expire = Date.now() + 86400000;
      if (sessionData?.cookie?.expires) {
        expire = new Date(sessionData.cookie.expires).getTime();
      } else if (sessionData?.cookie?.originalMaxAge) {
        expire = Date.now() + sessionData.cookie.originalMaxAge;
      }
      
      db.prepare('UPDATE sessions SET expire = ? WHERE sid = ?').run(expire, sid);
      if (callback) callback();
    } catch (err) {
      if (callback) callback(err);
    }
  }
}
