-- Normalizar nomes dos campos para alinhar com o front-end

-- 1. Renomear campos na tabela announcements
ALTER TABLE announcements 
CHANGE COLUMN background_color backgroundColor VARCHAR(50) DEFAULT NULL,
CHANGE COLUMN text_color textColor VARCHAR(50) DEFAULT NULL,
CHANGE COLUMN created_at createdAt TIMESTAMP NOT NULL DEFAULT current_timestamp(),
CHANGE COLUMN created_by createdBy VARCHAR(50) NOT NULL,
CHANGE COLUMN read_by readBy LONGTEXT NOT NULL DEFAULT '[]' CHECK (json_valid(readBy));

-- 2. Atualizar campos na tabela posts
ALTER TABLE posts 
CHANGE COLUMN created_at createdAt DATETIME NOT NULL,
CHANGE COLUMN updated_at updatedAt DATETIME DEFAULT NULL,
CHANGE COLUMN likes_count likesCount INT NOT NULL DEFAULT 0,
CHANGE COLUMN image_url imageUrl VARCHAR(255) DEFAULT NULL;

-- 3. Atualizar campos na tabela documents
ALTER TABLE documents 
CHANGE COLUMN file_url fileUrl VARCHAR(255) NOT NULL,
CHANGE COLUMN file_type fileType VARCHAR(50) NOT NULL,
CHANGE COLUMN file_size fileSize INT NOT NULL,
CHANGE COLUMN uploaded_by uploadedBy VARCHAR(32) NOT NULL,
CHANGE COLUMN created_at createdAt DATETIME NOT NULL,
CHANGE COLUMN updated_at updatedAt DATETIME DEFAULT NULL;
