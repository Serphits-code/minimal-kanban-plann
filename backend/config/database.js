import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

class Database {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'kanban_planner',
      port: parseInt(process.env.DB_PORT || '5432'),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // Converts MySQL-style ? placeholders to PostgreSQL $n placeholders
  _convertParams(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }

  async query(sql, params = []) {
    try {
      const pgSql = this._convertParams(sql);
      const result = await this.pool.query(pgSql, params);
      // Attach affectedRows to the rows array so existing code still works
      const rows = result.rows;
      rows.affectedRows = result.rowCount;
      rows.rowCount = result.rowCount;
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

export default new Database();