# Corporação Monárquica

Aplicação web para gerenciamento de posts, comentários e documentos para a Corporação Monárquica.

## Tecnologias Utilizadas

- React 18
- TypeScript
- Vite
- Firebase (Autenticação, Firestore, Storage)
- Tailwind CSS
- React Router DOM
- React Icons

## Funcionalidades

- Autenticação de usuários (login, registro, recuperação de senha)
- Criação, edição e exclusão de posts
- Comentários em posts
- Sistema de likes
- Upload de imagens
- Modo escuro/claro
- Painel administrativo
- Gerenciamento de documentos oficiais
- Sistema de anúncios

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_FIREBASE_API_KEY=seu-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-auth-domain
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-messaging-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
VITE_FIREBASE_MEASUREMENT_ID=seu-measurement-id
```

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Visualizar build de produção
npm run preview
```

## Estrutura do Projeto

- `/src`: Código fonte da aplicação
  - `/components`: Componentes reutilizáveis
  - `/contexts`: Contextos React para gerenciamento de estado
  - `/pages`: Páginas principais da aplicação
  - `/utils`: Funções utilitárias
  - `/styles`: Estilos globais e temas

## Notas de Desenvolvimento

- A aplicação utiliza o Firebase para autenticação, armazenamento de dados e upload de arquivos.
- O sistema de autenticação suporta login com email/senha e Google.
- Os administradores têm permissões especiais para editar e excluir posts de qualquer usuário.
- O modo escuro/claro é persistido no localStorage.

## Atualizações Recentes

- Corrigido problema de renderização do Navbar
- Atualizado Firebase para a versão 11.6.0
- Adicionado suporte para Google Analytics
- Simplificado sistema de autenticação e permissões
- Melhorado tratamento de erros e validações
