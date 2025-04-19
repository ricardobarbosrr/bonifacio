-- Alinhar estrutura do banco de dados com o front-end

-- 1. Modificar o ID da tabela articles para VARCHAR
ALTER TABLE articles MODIFY COLUMN id VARCHAR(255) NOT NULL;

-- 2. Adicionar campos faltantes na tabela articles
ALTER TABLE articles 
ADD COLUMN image_url VARCHAR(255) DEFAULT NULL,
ADD COLUMN category VARCHAR(255) DEFAULT NULL,
ADD COLUMN tags LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(tags)),
ADD COLUMN reading_time INT DEFAULT NULL,
ADD COLUMN excerpt TEXT DEFAULT NULL,
ADD COLUMN featured_image VARCHAR(255) DEFAULT NULL,
ADD COLUMN cover_color VARCHAR(7) DEFAULT NULL,
ADD COLUMN custom_font VARCHAR(255) DEFAULT NULL;
