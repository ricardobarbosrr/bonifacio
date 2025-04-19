# Guia do Desenvolvedor - Banco de Dados

## Visão Geral dos Subsistemas

### 1. Sistema de Artigos
- **Principal:** `articles`
- **Relacionados:** `categories`, `tags`, `article_categories`, `article_tags`
- **Interações:** `likes`, `comments`
- **Campos Importantes:** 
  - `tags`: Array JSON
  - `reading_time`: Calculado automaticamente
  - `excerpt`: Resumo do artigo

### 2. Sistema de Posts
- **Principal:** `posts`
- **Relacionados:** `post_likes`
- **Contadores Automáticos:**
  - `views`: Visualizações
  - `likes_count`: Total de curtidas
  - `comments`: Total de comentários

### 3. Sistema de Anúncios
- **Principal:** `announcements`
- **Características:**
  - Customização visual (cores)
  - Marcação de leitura
  - Priorização (importante/normal)

### 4. Sistema de Documentos
- **Principal:** `documents`
- **Recursos:**
  - Upload de arquivos
  - Controle de versão
  - Metadados (tipo, tamanho)

## Convenções de Nomenclatura

### Campos Comuns
1. Timestamps:
   - `createdAt`
   - `updatedAt`
   - `readAt`

2. Relacionamentos:
   - `authorId`
   - `userId`
   - `uploadedBy`
   - `createdBy`

3. Mídia:
   - `imageUrl`
   - `fileUrl`
   - `photoUrl`

### Padrões JSON
1. Arrays em JSON:
   ```json
   {
     "tags": ["tech", "news"],
     "readBy": ["user1", "user2"]
   }
   ```

2. Metadados em JSON:
   ```json
   {
     "fileMetadata": {
       "type": "pdf",
       "size": 1024,
       "version": "1.0"
     }
   }
   ```

## Queries Comuns

### 1. Busca de Artigos com Relacionamentos
```sql
SELECT 
    a.*,
    u.display_name as author_name,
    COUNT(DISTINCT l.id) as likes_count,
    COUNT(DISTINCT c.id) as comments_count,
    GROUP_CONCAT(DISTINCT t.name) as tags
FROM articles a
LEFT JOIN users u ON a.author_id = u.uid
LEFT JOIN likes l ON a.id = l.article_id
LEFT JOIN comments c ON a.id = c.article_id
LEFT JOIN article_tags at ON a.id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id;
```

### 2. Feed de Posts com Interações
```sql
SELECT 
    p.*,
    u.display_name as author_name,
    u.photo_url as author_photo,
    COUNT(pl.id) as likes_count
FROM posts p
JOIN users u ON p.author_id = u.uid
LEFT JOIN post_likes pl ON p.id = pl.post_id
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### 3. Anúncios Não Lidos
```sql
SELECT a.*
FROM announcements a
WHERE JSON_SEARCH(a.read_by, 'one', ?) IS NULL;
```

## Transações e Integridade

### 1. Criação de Artigo com Tags
```sql
START TRANSACTION;

INSERT INTO articles (...) VALUES (...);
SET @article_id = LAST_INSERT_ID();

INSERT INTO article_tags (article_id, tag_id)
SELECT @article_id, id FROM tags WHERE name IN (?);

COMMIT;
```

### 2. Exclusão com Cascade
- Todas as chaves estrangeiras usam `ON DELETE CASCADE`
- Exemplo: Ao excluir um artigo, são removidos automaticamente:
  - Curtidas
  - Comentários
  - Relações com tags/categorias

## Otimizações

### 1. Índices
- Chaves primárias: `id`
- Chaves únicas: `email`, `uid`
- Índices compostos: `(article_id, user_id)`

### 2. Contadores
- Manter contadores atualizados via triggers
- Usar campos calculados para métricas frequentes

### 3. JSON
- Usar campos JSON para dados flexíveis
- Validar JSON antes de inserir

## Segurança

### 1. Permissões
- `is_admin`: Acesso administrativo
- `is_founder`: Privilégios máximos
- Validar permissões em todas as operações

### 2. Autenticação
- Tokens temporários
- Senhas com hash
- Sessões com timeout

### 3. Validação
- Sanitizar inputs
- Validar tipos de arquivo
- Limitar tamanhos de upload

## Monitoramento

### 1. Logs
```sql
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id VARCHAR(255),
    user_id VARCHAR(32),
    created_at TIMESTAMP
);
```

### 2. Métricas
- Tamanho das tabelas
- Índices mais usados
- Queries lentas

## Backup e Recuperação

### 1. Backup Diário
```bash
mysqldump -h host -u user -p database > backup.sql
```

### 2. Pontos de Restauração
- Manter backups incrementais
- Testar restauração periodicamente

## Evolução do Schema

### 1. Migrations
- Usar versionamento de schema
- Documentar alterações
- Manter scripts de rollback

### 2. Compatibilidade
- Manter compatibilidade retroativa
- Usar ALTER TABLE com cuidado
- Testar migrações
