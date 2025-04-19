-- Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(32) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    auth_token VARCHAR(255),
    is_admin BOOLEAN DEFAULT 0,
    is_founder BOOLEAN DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

-- Criação da tabela de posts
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255) NULL,
    author_id VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (author_id) REFERENCES users(uid)
);

-- Criação da tabela de comentários
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(32) PRIMARY KEY,
    post_id VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (author_id) REFERENCES users(uid)
);

-- Criação da tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    author_id VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (author_id) REFERENCES users(uid)
);

-- Criação da tabela de likes de posts
CREATE TABLE IF NOT EXISTS post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_post_user (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
);

-- Verificar se a coluna is_founder já existe na tabela users
-- Se não existir, adiciona a coluna
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "is_founder";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN is_founder BOOLEAN DEFAULT 0 AFTER is_admin"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar se a coluna image_url já existe na tabela posts
-- Se não existir, adiciona a coluna
-- Nota: Este comando funciona apenas em MySQL 8.0+
SET @dbname = DATABASE();
SET @tablename = "posts";
SET @columnname = "image_url";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE posts ADD COLUMN image_url VARCHAR(255) NULL AFTER content"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
