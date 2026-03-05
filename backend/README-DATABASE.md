# 🗄️ Configuração do Banco de Dados MySQL

## Pré-requisitos

Você precisa ter o MySQL instalado na sua máquina. Recomendo usar:

### Opção 1: XAMPP (Recomendado para Windows)
1. Baixe e instale o XAMPP: https://www.apachefriends.org/download.html
2. Inicie o XAMPP Control Panel
3. Inicie os serviços **Apache** e **MySQL**
4. Acesse phpMyAdmin em: http://localhost/phpmyadmin

### Opção 2: MySQL Standalone
1. Baixe e instale o MySQL: https://dev.mysql.com/downloads/mysql/
2. Configure uma senha para o usuário root (ou deixe em branco)

## Configuração do Banco

### 1. Verifique as configurações no arquivo `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Deixe vazio se não tiver senha
DB_NAME=kanban_planner
DB_PORT=3306
```

### 2. Inicialize o banco de dados:
```bash
# No diretório backend
npm run init-db
```

### 3. Inicie o servidor backend:
```bash
npm run dev
```

### 4. Teste a API:
- Health check: http://localhost:3001/api/health
- Boards: http://localhost:3001/api/boards
- Cards: http://localhost:3001/api/cards
- Tags: http://localhost:3001/api/tags

## Estrutura do Banco

O script criará automaticamente:

### Tabela `boards`
- id (VARCHAR/UUID)
- name (VARCHAR)
- columns (JSON)
- created_at, updated_at (TIMESTAMP)

### Tabela `cards`
- id (VARCHAR/UUID)
- title, description (VARCHAR/TEXT)
- tags, checklist, attachments (JSON)
- due_date, scheduled_date, scheduled_time
- duration, order_position
- column_id, board_id (VARCHAR)
- completed (BOOLEAN)
- created_at, updated_at (TIMESTAMP)

### Tabela `tags`
- id (VARCHAR/UUID)
- name (VARCHAR UNIQUE)
- color (VARCHAR)
- created_at (TIMESTAMP)

### Tabela `employees` (Novo - Visão Projetos)
- id (VARCHAR/UUID)
- name (VARCHAR)
- email (VARCHAR)
- avatar (VARCHAR)
- role (VARCHAR)
- created_at, updated_at (TIMESTAMP)

### Tabela `project_groups` (Novo - Visão Projetos)
- id (VARCHAR/UUID)
- name (VARCHAR)
- board_id (VARCHAR)
- order_position (INT)
- color (VARCHAR)
- created_at, updated_at (TIMESTAMP)

### Colunas adicionais em `cards` (Novo - Visão Projetos)
- assignee_id (VARCHAR) - FK para employees
- priority (ENUM: critical, high, medium, low)
- status (ENUM: not_started, in_progress, done, paused)
- group_id (VARCHAR) - FK para project_groups

## Acesso via phpMyAdmin

1. Abra: http://localhost/phpmyadmin
2. Faça login com:
   - Usuário: root
   - Senha: (deixe vazio ou a senha que configurou)
3. Selecione o banco `kanban_planner`
4. Explore as tabelas e dados

## Próximos Passos

Após configurar o MySQL:
1. Execute `npm run init-db` para criar as tabelas
2. Execute `npm run dev` para iniciar o backend
3. Configure o frontend para usar a API em vez do GitHub Spark KV