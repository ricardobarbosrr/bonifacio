-- Criar a tabela de anúncios
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    important TINYINT(1) DEFAULT 0,
    background_color VARCHAR(50) DEFAULT NULL,
    text_color VARCHAR(50) DEFAULT NULL,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    read_by JSON DEFAULT ('[]'),
    FOREIGN KEY (created_by) REFERENCES users(uid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar índices para melhorar a performance
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_announcements_important ON announcements(important);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);
