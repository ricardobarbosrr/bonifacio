-- Tabela de usuários
CREATE TABLE users (
    uid VARCHAR(24) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    photo_url VARCHAR(255),
    is_admin TINYINT(1) DEFAULT 0,
    auth_token VARCHAR(64),
    created_at DATETIME NOT NULL,
    last_login DATETIME
);

-- Tabela de posts
CREATE TABLE posts (
    id VARCHAR(24) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(24) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (author_id) REFERENCES users(uid)
);

-- Tabela de comentários
CREATE TABLE comments (
    id VARCHAR(24) PRIMARY KEY,
    post_id VARCHAR(24) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(24) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(uid)
);

-- Tabela de documentos
CREATE TABLE documents (
    id VARCHAR(24) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(255) NOT NULL,
    author_id VARCHAR(24) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(uid)
);

-- Tabela de anúncios
CREATE TABLE announcements (
    id VARCHAR(24) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(24) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(uid)
);

-- Tabela para rastrear anúncios lidos
CREATE TABLE announcement_reads (
    announcement_id VARCHAR(24) NOT NULL,
    user_id VARCHAR(24) NOT NULL,
    read_at DATETIME NOT NULL,
    PRIMARY KEY (announcement_id, user_id),
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(uid)
);

-- Inserir um usuário administrador padrão (senha: admin123)
INSERT INTO users (uid, email, password, display_name, is_admin, created_at)
VALUES (
    'admin123456789012',
    'admin@corpbonifacio.com.br',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Administrador',
    1,
    NOW()
);
