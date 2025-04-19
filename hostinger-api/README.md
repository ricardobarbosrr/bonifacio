# Migração do Firebase para MySQL na Hostinger

Este diretório contém os arquivos necessários para migrar a aplicação do Firebase para um banco de dados MySQL hospedado na Hostinger.

## Configuração para Desenvolvimento Local

### 1. Configurar o banco de dados MySQL local

1. Certifique-se de que o MySQL está instalado e rodando em sua máquina
2. Execute o script `setup-database.bat` na raiz do projeto para criar o banco de dados e importar o esquema
   ```
   cd ..
   setup-database.bat
   ```

### 2. Iniciar o servidor PHP local

1. Certifique-se de que o PHP está instalado e configurado no PATH
2. Execute o script `start-api.bat` na raiz do projeto para iniciar o servidor PHP
   ```
   cd ..
   start-api.bat
   ```
3. O servidor estará disponível em `http://localhost:8000`

### 3. Configurar o frontend React

1. Edite o arquivo `.env` na raiz do projeto e defina a variável `VITE_API_BASE_URL` para `http://localhost:8000/api`
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

## Passos para a migração

### 1. Configurar o banco de dados MySQL na Hostinger

1. Faça login no painel da Hostinger
2. Acesse a seção de bancos de dados
3. Crie um novo banco de dados MySQL (se ainda não existir)
4. Anote as informações de conexão:
   - Host: `srv1893.hstgr.io`
   - Nome do banco: `u770443625_corpmonar`
   - Usuário: `u770443625_corpmonaradmin`
   - Senha: (a senha que você definiu)

### 2. Configurar os arquivos PHP

1. Edite o arquivo `config.php` e atualize a senha do banco de dados
2. Faça upload de todos os arquivos PHP para o diretório de sua escolha no servidor da Hostinger (por exemplo, `/public_html/api/`)

### 3. Criar as tabelas no banco de dados

1. Acesse o phpMyAdmin através do painel da Hostinger
2. Selecione o banco de dados `u770443625_corpmonar`
3. Vá para a aba "SQL"
4. Cole o conteúdo do arquivo `database.sql` e execute

### 4. Atualizar o frontend React

1. Edite o arquivo `src/api.ts` e atualize a constante `API_BASE_URL` com o URL correto para sua API
   ```typescript
   const API_BASE_URL = 'https://seudominio.com/api'; // Substitua pelo URL real
   ```

2. Modifique os componentes React que usam o Firebase para usar a nova API:
   - Substitua importações do Firebase por importações do novo arquivo `api.ts`
   - Atualize as chamadas de função para usar os métodos correspondentes da nova API

## Estrutura do banco de dados

O banco de dados MySQL contém as seguintes tabelas:

- `users`: Armazena informações de usuários
- `posts`: Armazena posts
- `comments`: Armazena comentários em posts
- `documents`: Armazena documentos
- `announcements`: Armazena anúncios
- `announcement_reads`: Rastreia quais anúncios foram lidos por quais usuários

## Credenciais de administrador padrão

Um usuário administrador padrão é criado durante a instalação:
- Email: admin@co rpmonar.com
- Senha: admin123

**Importante**: Altere esta senha imediatamente após a primeira instalação!

## Solução de problemas

- Verifique os logs de erro do PHP se encontrar problemas
- Certifique-se de que as permissões de arquivo estão corretas (geralmente 644 para arquivos e 755 para diretórios)
- Verifique se as configurações de CORS estão corretas se encontrar erros de acesso entre origens
