# Migração do Firebase para MySQL na Hostinger

Este documento contém instruções detalhadas para migrar a aplicação do Firebase para um banco de dados MySQL hospedado na Hostinger.

## Arquivos criados

1. **Arquivos PHP para o backend** (pasta `hostinger-api/`):
   - `config.php`: Configurações de conexão com o banco de dados
   - `auth.php`: Endpoints para autenticação (registro, login, verificação)
   - `posts.php`: Endpoints para gerenciamento de posts
   - `comments.php`: Endpoints para gerenciamento de comentários
   - `database.sql`: Script SQL para criar as tabelas necessárias

2. **Arquivos modificados no frontend**:
   - `src/api.ts`: Novo arquivo que substitui o Firebase com funções para comunicação com a API
   - `src/contexts/AuthContext.tsx`: Modificado para usar a nova API em vez do Firebase

## Passos para a migração

### 1. Configurar o banco de dados MySQL na Hostinger

1. Faça login no painel da Hostinger
2. Acesse a seção de bancos de dados
3. Crie um novo banco de dados MySQL (se ainda não existir)
4. Anote as informações de conexão:
   - Host: `localhost`
   - Nome do banco: `u770443625_corpmonar`
   - Usuário: `u770443625_corpmonaradmin`
   - Senha: (a senha que você definiu)

### 2. Criar as tabelas no banco de dados

1. Acesse o phpMyAdmin através do painel da Hostinger
2. Selecione o banco de dados `u770443625_corpmonar`
3. Vá para a aba "SQL"
4. Cole o conteúdo do arquivo `hostinger-api/database.sql` e execute

### 3. Configurar e fazer upload dos arquivos PHP

1. Edite o arquivo `hostinger-api/config.php` e atualize a senha do banco de dados
2. Faça upload de todos os arquivos PHP para o diretório de sua escolha no servidor da Hostinger (por exemplo, `/public_html/api/`)
3. Verifique as permissões dos arquivos (geralmente 644 para arquivos e 755 para diretórios)

### 4. Atualizar o frontend React

1. Edite o arquivo `src/api.ts` e atualize a constante `API_BASE_URL` com o URL correto para sua API:
   ```typescript
   const API_BASE_URL = 'https://seudominio.com/api'; // Substitua pelo URL real
   ```

2. Compile e faça o deploy da aplicação React:
   ```bash
   npm run build
   # Faça upload dos arquivos da pasta build para o servidor
   ```

## Estrutura do banco de dados

O banco de dados MySQL contém as seguintes tabelas:

- `users`: Armazena informações de usuários
  - `uid`: ID único do usuário
  - `email`: Email do usuário (único)
  - `password`: Senha do usuário (hash)
  - `display_name`: Nome de exibição
  - `photo_url`: URL da foto de perfil
  - `is_admin`: Flag para indicar se o usuário é administrador
  - `auth_token`: Token de autenticação
  - `created_at`: Data de criação
  - `last_login`: Data do último login

- `posts`: Armazena posts
  - `id`: ID único do post
  - `title`: Título do post
  - `content`: Conteúdo do post
  - `author_id`: ID do autor (referência a users.uid)
  - `created_at`: Data de criação
  - `updated_at`: Data de atualização

- `comments`: Armazena comentários em posts
  - `id`: ID único do comentário
  - `post_id`: ID do post (referência a posts.id)
  - `content`: Conteúdo do comentário
  - `author_id`: ID do autor (referência a users.uid)
  - `created_at`: Data de criação

- `documents`: Armazena documentos
  - `id`: ID único do documento
  - `title`: Título do documento
  - `description`: Descrição do documento
  - `file_url`: URL do arquivo
  - `author_id`: ID do autor (referência a users.uid)
  - `created_at`: Data de criação

- `announcements`: Armazena anúncios
  - `id`: ID único do anúncio
  - `title`: Título do anúncio
  - `content`: Conteúdo do anúncio
  - `author_id`: ID do autor (referência a users.uid)
  - `created_at`: Data de criação

- `announcement_reads`: Rastreia quais anúncios foram lidos por quais usuários
  - `announcement_id`: ID do anúncio (referência a announcements.id)
  - `user_id`: ID do usuário (referência a users.uid)
  - `read_at`: Data de leitura

## Credenciais de administrador padrão

Um usuário administrador padrão é criado durante a instalação:
- Email: admin@corpbonifacio.com.br
- Senha: admin123

**Importante**: Altere esta senha imediatamente após a primeira instalação!

## Funcionalidades implementadas

- ✅ Autenticação de usuários (registro, login, logout)
- ✅ Gerenciamento de posts (criar, ler, atualizar, excluir)
- ✅ Gerenciamento de comentários (adicionar, excluir)
- ✅ Permissões de administrador (editar/excluir posts de qualquer usuário)

## Funcionalidades a implementar

- ⏳ Upload de imagens
- ⏳ Atualização de perfil
- ⏳ Alteração de senha
- ⏳ Gerenciamento de documentos
- ⏳ Sistema de anúncios

## Solução de problemas

- Verifique os logs de erro do PHP se encontrar problemas
- Certifique-se de que as permissões de arquivo estão corretas
- Verifique se as configurações de CORS estão corretas se encontrar erros de acesso entre origens
- Para depurar problemas de API, use as ferramentas de desenvolvedor do navegador (aba Network)
