# Guia de Instalação na VPS — Almeidaplanner (projetosobj.almeida.marketing)

> **ATENÇÃO (para a IA que está executando este guia):**
> Este arquivo deve ser executado passo a passo em ordem. Antes de configurar portas e banco de dados,
> **verifique o estado atual da VPS** para não interferir em outros projetos em execução.
> Nunca sobrescreva configurações existentes do Nginx, PostgreSQL ou PM2 de outros projetos.

---

## Visão Geral da Arquitetura

```
Internet
   │
   ▼
Nginx (:80/:443) → projetosobj.almeida.marketing
   ├── / → serve arquivos estáticos do frontend (React build)
   └── /api/ → proxy → Node.js backend (porta a definir abaixo)

Node.js Backend (Express) → PostgreSQL (banco isolado)
```

---

## PASSO 1 — Verificar Pré-requisitos

Execute cada comando e confirme que os programas estão instalados:

```bash
node --version        # Esperado: v18+ ou v20+
npm --version         # Esperado: v9+
pm2 --version         # Esperado: v5+
nginx -v              # Esperado: nginx/1.x
psql --version        # Esperado: PostgreSQL 13+
git --version         # Esperado: git 2.x
certbot --version     # Esperado: certbot 2.x (para SSL)
```

Se algum estiver faltando, instale antes de continuar.

---

## PASSO 2 — Verificar Portas em Uso (CRÍTICO)

**Antes de escolher a porta do backend**, verifique o que já está rodando:

```bash
# Ver todas as portas em uso por processos Node/outros
ss -tlnp | grep LISTEN
# ou
netstat -tlnp 2>/dev/null | grep LISTEN

# Ver especificamente o que está em cada porta suspeita
ss -tlnp | grep -E '3001|3002|3003|3004|4000|5000|8000|8080'
```

**Escolha uma porta LIVRE** para o backend deste projeto.
Por padrão este projeto usa `3001`. Se já estiver ocupada, escolha `3010`, `3020`, etc.
**Anote a porta escolhida** — você vai usá-la nos próximos passos como `BACKEND_PORT`.

---

## PASSO 3 — Verificar Bancos PostgreSQL Existentes

**Não apague nem modifique bancos existentes.**

```bash
# Listar bancos existentes
sudo -u postgres psql -c "\l"

# Listar usuários existentes
sudo -u postgres psql -c "\du"
```

O banco deste projeto se chamará `kanban_planner` e o usuário `kanban_user`.
Se já existirem com esses nomes de outros projetos, use nomes alternativos como `kanban_planner_almeida` / `kanban_user_almeida`.

---

## PASSO 4 — Clonar o Repositório

```bash
# Escolha um diretório para hospedar o projeto (não conflitar com outros)
cd /var/www
git clone https://github.com/Serphits-code/minimal-kanban-plann almeidaplanner
cd almeidaplanner
```

---

## PASSO 5 — Configurar o Backend

### 5.1 Instalar dependências do backend

```bash
cd /var/www/almeidaplanner/backend
npm install
```

### 5.2 Criar arquivo `.env` do backend

Substitua `BACKEND_PORT` pela porta que você escolheu no Passo 2.
Substitua `DB_NAME`, `DB_USER`, `DB_PASSWORD` pelos valores que você escolheu no Passo 3.
Use uma senha forte para `DB_PASSWORD` e `JWT_SECRET`.

```bash
cat > /var/www/almeidaplanner/backend/.env << 'EOF'
# Banco de Dados PostgreSQL
DB_HOST=localhost
DB_USER=kanban_user
DB_PASSWORD=SENHA_FORTE_AQUI
DB_NAME=kanban_planner
DB_PORT=5432

# Servidor
PORT=3001
NODE_ENV=production

# JWT (use uma string aleatória longa)
JWT_SECRET=SEGREDO_JWT_ALEATORIO_LONGO_AQUI_MIN_32_CHARS
EOF
```

> **IMPORTANTE:** Edite o arquivo criado com os valores reais antes de continuar:
> ```bash
> nano /var/www/almeidaplanner/backend/.env
> ```

### 5.3 Criar banco de dados e usuário PostgreSQL

Substitua os valores pelos mesmos usados no `.env`:

```bash
sudo -u postgres psql << 'SQL'
CREATE USER kanban_user WITH PASSWORD 'SENHA_FORTE_AQUI';
CREATE DATABASE kanban_planner OWNER kanban_user;
GRANT ALL PRIVILEGES ON DATABASE kanban_planner TO kanban_user;
SQL
```

### 5.4 Inicializar o banco de dados (criar tabelas e dados iniciais)

```bash
cd /var/www/almeidaplanner/backend
node scripts/init-database.js
```

Saída esperada: mensagens de criação de tabelas sem erros.

Verifique se as tabelas foram criadas:
```bash
sudo -u postgres psql -d kanban_planner -c "\dt"
```

---

## PASSO 6 — Configurar PM2 para o Backend

```bash
cd /var/www/almeidaplanner/backend

# Iniciar com PM2 (use um nome único para não conflitar com outros projetos)
pm2 start server.js --name "almeidaplanner-backend" --env production

# Verificar se está rodando
pm2 status
pm2 logs almeidaplanner-backend --lines 20

# Verificar se a porta está respondendo (substitua 3001 pela porta escolhida)
curl -s http://localhost:3001/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | head -c 200
```

Resposta esperada: JSON com mensagem de erro de credenciais (não "connection refused").

### Salvar configuração do PM2

```bash
pm2 save
```

Se quiser que o PM2 inicie automaticamente com o servidor:
```bash
# Execute o comando que o PM2 sugerir:
pm2 startup
# Após executar o comando sugerido, salve novamente:
pm2 save
```

---

## PASSO 7 — Build do Frontend

### 7.1 Instalar dependências do frontend

```bash
cd /var/www/almeidaplanner
npm install
```

### 7.2 Criar arquivo `.env` do frontend

A URL da API deve apontar para o domínio de produção (sem porta, pois passará pelo Nginx):

```bash
cat > /var/www/almeidaplanner/.env << 'EOF'
VITE_API_BASE_URL=https://projetosobj.almeida.marketing/api
EOF
```

### 7.3 Build de produção

```bash
cd /var/www/almeidaplanner
npm run build
```

Saída esperada: pasta `dist/` criada sem erros de TypeScript ou Vite.

Verifique:
```bash
ls -la /var/www/almeidaplanner/dist/
```

---

## PASSO 8 — Configurar Nginx

### 8.1 Verificar configurações Nginx existentes

**NÃO modifique arquivos existentes.**

```bash
# Listar sites ativos
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/conf.d/

# Ver servidor padrão para verificar configurações
cat /etc/nginx/nginx.conf | head -30
```

### 8.2 Criar novo arquivo de configuração para este projeto

Substitua `3001` pela porta do backend escolhida no Passo 2.

```bash
cat > /etc/nginx/sites-available/projetosobj.almeida.marketing << 'EOF'
server {
    listen 80;
    server_name projetosobj.almeida.marketing;

    # Redireciona para HTTPS (após configurar SSL no Passo 9)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name projetosobj.almeida.marketing;

    # SSL (será configurado pelo Certbot no Passo 9)
    # ssl_certificate /etc/letsencrypt/live/projetosobj.almeida.marketing/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/projetosobj.almeida.marketing/privkey.pem;

    # Frontend — arquivos estáticos React
    root /var/www/almeidaplanner/dist;
    index index.html;

    # React SPA — todas as rotas servem index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend — proxy para Node.js
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }

    # Upload de arquivos — pasta uploads
    location /uploads/ {
        alias /var/www/almeidaplanner/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Segurança básica — ocultar dot files
    location ~ /\. {
        deny all;
    }

    # Gzip para melhor performance
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss;

    # Logs específicos deste projeto
    access_log /var/log/nginx/almeidaplanner_access.log;
    error_log /var/log/nginx/almeidaplanner_error.log;

    # Tamanho máximo de upload (para anexos de cards)
    client_max_body_size 10M;
}
EOF
```

> **SE a porta do backend NÃO for 3001:** edite o arquivo e troque `3001` pela porta correta:
> ```bash
> nano /etc/nginx/sites-available/projetosobj.almeida.marketing
> ```

### 8.3 Ativar o site

```bash
# Criar symlink em sites-enabled
ln -s /etc/nginx/sites-available/projetosobj.almeida.marketing \
      /etc/nginx/sites-enabled/projetosobj.almeida.marketing

# Testar configuração Nginx (deve mostrar "syntax is ok" e "test is successful")
nginx -t

# Se OK, recarregar Nginx
systemctl reload nginx
```

---

## PASSO 9 — SSL com Let's Encrypt (Certbot)

```bash
# Obter certificado SSL (substitua o e-mail se necessário)
certbot --nginx -d projetosobj.almeida.marketing --non-interactive \
  --agree-tos --email almeidaestudios@outlook.com

# Verificar auto-renovação
certbot renew --dry-run
```

Após o Certbot, ele automaticamente atualiza o arquivo Nginx com os caminhos dos certificados e habilita HTTPS.

```bash
# Recarregar Nginx novamente
systemctl reload nginx
```

---

## PASSO 10 — Verificação Final

### Checar todos os serviços

```bash
# Backend rodando?
pm2 status almeidaplanner-backend

# Nginx rodando?
systemctl status nginx | grep -E "active|running"

# Porta do backend respondendo?
curl -s http://localhost:3001/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"almeidaestudios@outlook.com","password":"Cxz963!@"}' | python3 -m json.tool 2>/dev/null || echo "sem python3, resposta bruta acima"

# Site acessível via HTTPS?
curl -I https://projetosobj.almeida.marketing
```

### Resultado esperado

- `pm2 status` → `almeidaplanner-backend` com status `online`
- `curl https://projetosobj.almeida.marketing` → HTTP 200 com HTML do React
- Login via curl → JSON com `{ "token": "...", "user": { ... } }`

---

## PASSO 11 — Credenciais Iniciais do Admin

Após o `node scripts/init-database.js` do Passo 5.4, o usuário admin padrão é:

- **Email:** `almeidaestudios@outlook.com`
- **Senha:** `Cxz963!@`

> **⚠️ IMPORTANTE:** Após a instalação, altere a senha do admin acessando o sistema.

---

## PASSO 12 — Permissões de Arquivos

```bash
# Garantir que o Node.js pode escrever na pasta de uploads
chown -R www-data:www-data /var/www/almeidaplanner/backend/uploads 2>/dev/null || \
chown -R $(pm2 list | grep almeidaplanner | awk '{print $NF}' | head -1):$(id -gn) \
  /var/www/almeidaplanner/backend/uploads

# Permissão de escrita
chmod -R 755 /var/www/almeidaplanner/backend/uploads

# Frontend estático
chown -R www-data:www-data /var/www/almeidaplanner/dist
chmod -R 755 /var/www/almeidaplanner/dist
```

---

## Resolução de Problemas

### Backend não inicia

```bash
pm2 logs almeidaplanner-backend --lines 50
# Verificar .env está correto
cat /var/www/almeidaplanner/backend/.env
# Testar conexão com banco
cd /var/www/almeidaplanner/backend && node -e "
import('./config/database.js').then(m => m.default.query('SELECT 1').then(() => console.log('DB OK')).catch(e => console.error('DB ERRO:', e.message)))
"
```

### Nginx retorna 502 Bad Gateway

```bash
# Backend está rodando?
pm2 status
# Porta correta no nginx?
grep proxy_pass /etc/nginx/sites-available/projetosobj.almeida.marketing
# Forçar reinício do backend
pm2 restart almeidaplanner-backend
```

### Frontend retorna 404 em rotas internas

O `try_files $uri $uri/ /index.html;` no Nginx deve resolver. Se não resolver:
```bash
nginx -t && systemctl reload nginx
```

### Porta do backend em conflito

```bash
# Ver qual processo usa a porta
ss -tlnp | grep :3001
# Trocar a porta no .env do backend e reiniciar
nano /var/www/almeidaplanner/backend/.env
# Trocar a porta no nginx
nano /etc/nginx/sites-available/projetosobj.almeida.marketing
pm2 restart almeidaplanner-backend
nginx -t && systemctl reload nginx
```

### Atualizar o projeto (deploy de novas versões)

```bash
cd /var/www/almeidaplanner

# 1. Puxar mudanças
git pull origin main

# 2. Atualizar dependências (se mudaram)
npm install
cd backend && npm install && cd ..

# 3. Rebuild frontend
npm run build

# 4. Reiniciar backend
pm2 restart almeidaplanner-backend

# 5. (Opcional) Rodar migrações se schema mudou
# cd backend && node scripts/init-database.js
```

---

## Resumo de Arquivos Importantes na VPS

| Arquivo/Pasta | Descrição |
|---|---|
| `/var/www/almeidaplanner/` | Raiz do projeto |
| `/var/www/almeidaplanner/dist/` | Frontend compilado (servido pelo Nginx) |
| `/var/www/almeidaplanner/backend/` | API Node.js |
| `/var/www/almeidaplanner/backend/.env` | **Variáveis secretas** (nunca commitar) |
| `/var/www/almeidaplanner/.env` | Env do frontend (VITE_API_BASE_URL) |
| `/etc/nginx/sites-available/projetosobj.almeida.marketing` | Config Nginx |
| `/var/log/nginx/almeidaplanner_access.log` | Logs de acesso |
| `/var/log/nginx/almeidaplanner_error.log` | Logs de erro |

---

*Gerado automaticamente para deploy em VPS com Node + Nginx + PostgreSQL + PM2 já instalados.*
