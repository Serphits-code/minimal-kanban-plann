import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
};

const dbName = process.env.DB_NAME || 'kanban_planner';

async function initDatabase() {
  let client;

  try {
    const adminClient = new Client({ ...dbConfig, database: 'postgres' });
    await adminClient.connect();

    const dbCheck = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (dbCheck.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' criado com sucesso`);
    } else {
      console.log(`Database '${dbName}' ja existe`);
    }

    await adminClient.end();

    client = new Client({ ...dbConfig, database: dbName });
    await client.connect();

    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        columns JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`DROP TRIGGER IF EXISTS set_boards_updated_at ON boards`);
    await client.query(`
      CREATE TRIGGER set_boards_updated_at
        BEFORE UPDATE ON boards
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tags JSONB DEFAULT '[]',
        checklist JSONB DEFAULT '[]',
        attachments JSONB DEFAULT '[]',
        due_date TIMESTAMP,
        scheduled_date DATE,
        scheduled_time TIME,
        duration INT,
        column_id VARCHAR(255) NOT NULL,
        board_id VARCHAR(36) NOT NULL,
        order_position INT NOT NULL DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        assignee_id VARCHAR(36),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
        status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done', 'paused')),
        group_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `);

    await client.query(`DROP TRIGGER IF EXISTS set_cards_updated_at ON cards`);
    await client.query(`
      CREATE TRIGGER set_cards_updated_at
        BEFORE UPDATE ON cards
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        color VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        avatar VARCHAR(500),
        role VARCHAR(100),
        user_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`DROP TRIGGER IF EXISTS set_employees_updated_at ON employees`);
    await client.query(`
      CREATE TRIGGER set_employees_updated_at
        BEFORE UPDATE ON employees
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`DROP TRIGGER IF EXISTS set_users_updated_at ON users`);
    await client.query(`
      CREATE TRIGGER set_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_groups (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        board_id VARCHAR(36) NOT NULL,
        order_position INT NOT NULL DEFAULT 0,
        color VARCHAR(7) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `);

    await client.query(`DROP TRIGGER IF EXISTS set_project_groups_updated_at ON project_groups`);
    await client.query(`
      CREATE TRIGGER set_project_groups_updated_at
        BEFORE UPDATE ON project_groups
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('Tabelas criadas/verificadas com sucesso');

    const boardsCount = await client.query('SELECT COUNT(*) as count FROM boards');
    if (parseInt(boardsCount.rows[0].count) === 0) {
      const boardId = crypto.randomUUID();
      const defaultColumns = JSON.stringify([
        { id: 'todo', name: 'A Fazer', order: 0 },
        { id: 'progress', name: 'Em Progresso', order: 1 },
        { id: 'done', name: 'Concluido', order: 2 }
      ]);

      await client.query(
        'INSERT INTO boards (id, name, columns) VALUES ($1, $2, $3)',
        [boardId, 'Projeto Exemplo', defaultColumns]
      );

      const exampleTags = [
        { id: crypto.randomUUID(), name: 'Urgente', color: '#ef4444' },
        { id: crypto.randomUUID(), name: 'Importante', color: '#f59e0b' },
        { id: crypto.randomUUID(), name: 'Bug', color: '#dc2626' },
        { id: crypto.randomUUID(), name: 'Feature', color: '#10b981' }
      ];

      for (const tag of exampleTags) {
        await client.query(
          'INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)',
          [tag.id, tag.name, tag.color]
        );
      }

      console.log('Dados de exemplo inseridos');
    }

    const employeesCount = await client.query('SELECT COUNT(*) as count FROM employees');
    if (parseInt(employeesCount.rows[0].count) === 0) {
      const exampleEmployees = [
        { id: crypto.randomUUID(), name: 'Gustavo Almeida', email: 'gustavo@empresa.com', role: 'Desenvolvedor' },
        { id: crypto.randomUUID(), name: 'Maria Silva', email: 'maria@empresa.com', role: 'Designer' },
        { id: crypto.randomUUID(), name: 'Joao Santos', email: 'joao@empresa.com', role: 'Gerente de Projeto' }
      ];

      for (const emp of exampleEmployees) {
        await client.query(
          'INSERT INTO employees (id, name, email, role) VALUES ($1, $2, $3, $4)',
          [emp.id, emp.name, emp.email, emp.role]
        );
      }

      console.log('Funcionarios de exemplo inseridos');
    }

    const groupsCount = await client.query('SELECT COUNT(*) as count FROM project_groups');
    if (parseInt(groupsCount.rows[0].count) === 0) {
      const existingBoards = await client.query('SELECT id FROM boards');
      for (const board of existingBoards.rows) {
        const defaultGroups = [
          { id: crypto.randomUUID(), name: 'Tarefas pendentes', board_id: board.id, order_position: 0, color: '#3b82f6' },
          { id: crypto.randomUUID(), name: 'Concluido', board_id: board.id, order_position: 1, color: '#22c55e' }
        ];
        for (const group of defaultGroups) {
          await client.query(
            'INSERT INTO project_groups (id, name, board_id, order_position, color) VALUES ($1, $2, $3, $4, $5)',
            [group.id, group.name, group.board_id, group.order_position, group.color]
          );
        }
      }
      console.log('Grupos de projeto padrao inseridos');
    }

    // Create or ensure admin user exists
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['almeidaestudios@outlook.com']
    );

    if (adminCheck.rowCount === 0) {
      const adminId = crypto.randomUUID();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Cxz963!@', salt);

      await client.query(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [adminId, 'Almeida Studios', 'almeidaestudios@outlook.com', passwordHash, 'admin']
      );

      const adminEmployeeId = crypto.randomUUID();
      await client.query(
        'INSERT INTO employees (id, name, email, role, user_id) VALUES ($1, $2, $3, $4, $5)',
        [adminEmployeeId, 'Almeida Studios', 'almeidaestudios@outlook.com', 'Administrador', adminId]
      );

      console.log('Usuario administrador criado: almeidaestudios@outlook.com');
    } else {
      console.log('Usuario administrador ja existe');
    }

    console.log('\nBanco de dados inicializado com sucesso!');
    console.log('  Email: almeidaestudios@outlook.com');
    console.log('  Senha: Cxz963!@');

  } catch (error) {
    console.error('Erro ao inicializar database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

initDatabase();
