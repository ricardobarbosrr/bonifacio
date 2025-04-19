# Documentação do Banco de Dados - Corp Bonifácio

## Visão Geral
Este documento detalha a estrutura completa do banco de dados do sistema Corp Bonifácio. O sistema é dividido em três grandes subsistemas:

1. **Sistema de Artigos** - Gerenciamento de conteúdo principal
2. **Sistema de Posts** - Feed social e interações rápidas
3. **Sistema de Anúncios** - Comunicação interna e notificações

## Estrutura do Banco de Dados

### Sistema de Artigos

#### 1. Artigos (`articles`)
Tabela principal de conteúdo longo e estruturado.

```sql
CREATE TABLE articles (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  category VARCHAR(255) DEFAULT NULL,
  tags LONGTEXT CHECK (json_valid(tags)),
  reading_time INT DEFAULT NULL,
  excerpt TEXT DEFAULT NULL,
  featured_image VARCHAR(255) DEFAULT NULL,
  cover_color VARCHAR(7) DEFAULT NULL,
  custom_font VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT NULL
)
```

#### 2. Categorias (`categories`)
Classificação primária de artigos.

```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY unique_category (name)
)
```

#### 3. Tags (`tags`)
Classificação secundária e palavras-chave.

```sql
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY unique_tag (name)
)
```

#### 4. Relações Artigos-Categorias (`article_categories`)
Associativa entre artigos e categorias.

```sql
CREATE TABLE article_categories (
  article_id VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (article_id, category_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
)
```

#### 5. Relações Artigos-Tags (`article_tags`)
Associativa entre artigos e tags.

```sql
CREATE TABLE article_tags (
  article_id VARCHAR(255) NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
)
```

### Sistema de Posts

#### 6. Posts (`posts`)
Posts rápidos para feed social.

```sql
CREATE TABLE posts (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  author_id VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  FOREIGN KEY (author_id) REFERENCES users(uid)
)
```

#### 7. Curtidas em Posts (`post_likes`)
Registro de curtidas em posts.

```sql
CREATE TABLE post_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_post_user (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
)
```

### Sistema de Anúncios

#### 8. Anúncios (`announcements`)
Anúncios e comunicações internas.

```sql
CREATE TABLE announcements (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  important TINYINT(1) NOT NULL DEFAULT 0,
  background_color VARCHAR(50) DEFAULT NULL,
  text_color VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(50) NOT NULL,
  read_by LONGTEXT NOT NULL DEFAULT '[]' CHECK (json_valid(read_by)),
  FOREIGN KEY (created_by) REFERENCES users(uid)
)
```

### Sistema de Usuários

#### 9. Usuários (`users`)
Tabela central de usuários.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL,
  last_login DATETIME DEFAULT NULL,
  auth_token VARCHAR(64) DEFAULT NULL,
  is_admin TINYINT(1) DEFAULT 0,
  photo_url VARCHAR(255) DEFAULT NULL,
  is_founder TINYINT(1) NOT NULL DEFAULT 0
)
```

### Sistema de Interações

#### 10. Comentários (`comments`)
Comentários em artigos.

```sql
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uid)
)
```

#### 11. Curtidas (`likes`)
Curtidas em artigos.

```sql
CREATE TABLE likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY unique_like (article_id, user_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uid)
)
```

#### 12. Notificações (`notifications`)
Notificações do sistema.

```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(uid)
)
```

### Sistema de Documentos

#### 13. Documentos (`documents`)
Gerenciamento de documentos.

```sql
CREATE TABLE documents (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL,
  uploaded_by VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(uid)
)
```

## Índices e Performance

### Índices Principais
1. Chaves primárias em todas as tabelas
2. Índices únicos para emails e UIDs de usuários
3. Índices para buscas frequentes em:
   - Curtidas (article_id, user_id)
   - Comentários (article_id)
   - Posts (author_id)
   - Notificações (user_id)

### Otimizações
1. Uso de InnoDB para todas as tabelas
2. Suporte a transações ACID
3. Charset UTF8MB4 para suporte Unicode completo
4. Chaves estrangeiras com CASCADE para integridade

## Segurança e Integridade

### Medidas de Segurança
1. Senhas armazenadas com hash
2. Tokens de autenticação temporários
3. Sistema de permissões (admin/founder)
4. Validação JSON em campos estruturados

### Integridade Referencial
1. Chaves estrangeiras em todas as relações
2. Ações CASCADE para exclusão
3. Restrições UNIQUE onde apropriado
4. Valores padrão para campos críticos

## Subsistemas e Funcionalidades

### 1. Sistema de Conteúdo
- Artigos longos com formatação rica
- Posts rápidos para feed social
- Categorização e tags
- Suporte a mídia (imagens)

### 2. Sistema Social
- Curtidas em artigos e posts
- Comentários
- Contadores de visualizações
- Feed de atividades

### 3. Sistema de Comunicação
- Anúncios importantes
- Notificações personalizadas
- Rastreamento de leitura
- Customização visual

### 4. Sistema de Documentos
- Upload e gerenciamento
- Controle de versão
- Metadados e categorização
- Rastreamento de uploads

## Manutenção e Monitoramento

### Tarefas Regulares
1. Backup diário do banco
2. Verificação de integridade
3. Otimização de índices
4. Limpeza de tokens expirados

### Monitoramento
1. Tamanho das tabelas
2. Performance de consultas
3. Uso de índices
4. Logs de erro

## Evolução Futura

### Possíveis Melhorias
1. Partição de tabelas grandes
2. Cache de consultas frequentes
3. Arquivamento de dados antigos
4. Replicação para leitura

### 1. Usuários (`users`)
Tabela principal de usuários do sistema.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(32) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL,
  last_login DATETIME DEFAULT NULL,
  auth_token VARCHAR(64) DEFAULT NULL,
  is_admin TINYINT(1) DEFAULT 0,
  photo_url VARCHAR(255) DEFAULT NULL,
  is_founder TINYINT(1) NOT NULL DEFAULT 0
)
```

**Índices:**
- PRIMARY KEY (`id`)
- UNIQUE KEY `uid` (`uid`)
- UNIQUE KEY `email` (`email`)

**Descrição dos Campos:**
- `id`: Identificador único auto-incrementado
- `uid`: Identificador único do usuário (usado em chaves estrangeiras)
- `email`: Email do usuário (único)
- `password`: Senha criptografada
- `display_name`: Nome de exibição
- `created_at`: Data de criação da conta
- `last_login`: Última data de login
- `auth_token`: Token de autenticação
- `is_admin`: Flag para administradores
- `is_founder`: Flag para fundadores
- `photo_url`: URL da foto de perfil

### 2. Artigos (`articles`)
Armazena os artigos do sistema.

```sql
CREATE TABLE articles (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  category VARCHAR(255) DEFAULT NULL,
  tags LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(tags)),
  reading_time INT DEFAULT NULL,
  excerpt TEXT DEFAULT NULL,
  featured_image VARCHAR(255) DEFAULT NULL,
  cover_color VARCHAR(7) DEFAULT NULL,
  custom_font VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT NULL
)
```

**Descrição dos Campos:**
- `id`: Identificador único do artigo
- `title`: Título do artigo
- `content`: Conteúdo do artigo
- `author_id`: ID do autor (referência a users.uid)
- `image_url`: URL da imagem principal
- `category`: Categoria do artigo
- `tags`: Array JSON de tags
- `reading_time`: Tempo estimado de leitura em minutos
- `excerpt`: Resumo do artigo
- `featured_image`: URL da imagem destacada
- `cover_color`: Cor de capa em formato hex
- `custom_font`: Fonte personalizada
- `created_at`: Data de criação
- `updated_at`: Data de última atualização

### 3. Categorias (`categories`)
Gerencia as categorias dos artigos.

```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY unique_category (name)
)
```

### 4. Tags (`tags`)
Sistema de tags para artigos.

```sql
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY unique_tag (name)
)
```

### 5. Curtidas (`likes`)
Registra as curtidas em artigos.

```sql
CREATE TABLE likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY unique_like (article_id, user_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uid)
)
```

### 6. Comentários (`comments`)
Sistema de comentários em artigos.

```sql
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(uid)
)
```

### 7. Relações Artigos-Categorias (`article_categories`)
Tabela de junção entre artigos e categorias.

```sql
CREATE TABLE article_categories (
  article_id VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (article_id, category_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
)
```

### 8. Relações Artigos-Tags (`article_tags`)
Tabela de junção entre artigos e tags.

```sql
CREATE TABLE article_tags (
  article_id VARCHAR(255) NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
)
```

### 9. Notificações (`notifications`)
Sistema de notificações.

```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(uid)
)
```

## Índices de Performance

O sistema utiliza vários índices para otimizar consultas frequentes:

1. **Artigos:**
   - `idx_articles_author` em `articles(author_id)`

2. **Curtidas:**
   - `idx_likes_article` em `likes(article_id)`
   - `idx_likes_user` em `likes(user_id)`

3. **Comentários:**
   - `idx_comments_article` em `comments(article_id)`
   - `idx_comments_user` em `comments(user_id)`

4. **Notificações:**
   - `idx_notifications_user` em `notifications(user_id)`

## Relacionamentos

1. **Artigos → Usuários:**
   - `articles.author_id` → `users.uid`

2. **Curtidas → Artigos e Usuários:**
   - `likes.article_id` → `articles.id`
   - `likes.user_id` → `users.uid`

3. **Comentários → Artigos e Usuários:**
   - `comments.article_id` → `articles.id`
   - `comments.user_id` → `users.uid`

4. **Artigos ↔ Categorias:**
   - Relacionamento N:N através de `article_categories`

5. **Artigos ↔ Tags:**
   - Relacionamento N:N através de `article_tags`

6. **Notificações → Usuários:**
   - `notifications.user_id` → `users.uid`

## Considerações de Performance

1. Todas as tabelas usam InnoDB para suporte a transações e chaves estrangeiras
2. Charset UTF8MB4 para suporte completo a Unicode
3. Índices estratégicos para otimizar consultas frequentes
4. Chaves estrangeiras com CASCADE para manter integridade referencial

## Manutenção

Para manter o banco de dados otimizado:

1. Regularmente verificar e otimizar índices
2. Monitorar o crescimento das tabelas
3. Fazer backup regular
4. Manter estatísticas atualizadas para o otimizador de consultas

## Segurança

1. Senhas são armazenadas com hash
2. Tokens de autenticação têm validade limitada
3. Permissões são controladas por flags (is_admin, is_founder)
4. Chaves estrangeiras garantem integridade referencial
