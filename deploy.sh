#!/bin/bash
# Script de deploy automático para o projeto Corpmonar na Hostinger

# Carrega variáveis de ambiente do arquivo .env
load_env() {
  if [ -f "$1" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      # Ignora linhas vazias e comentários
      if [[ $line =~ ^[[:space:]]*$ ]] || [[ $line =~ ^[[:space:]]*# ]]; then
        continue
      fi
      
      # Extrai nome e valor da variável
      if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        # Remove aspas se existirem
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        # Exporta a variável
        export "$key=$value"
      fi
    done < "$1"
    return 0
  else
    return 1
  fi
}

# Função para obter variáveis de ambiente com valor padrão
env_var() {
  local var_name="$1"
  local default_value="$2"
  local value="${!var_name}"
  
  if [ -z "$value" ]; then
    echo "$default_value"
  else
    echo "$value"
  fi
}

# Configurações
SITE_PATH=$(dirname "$0")
load_env "$SITE_PATH/.env"

# Variáveis configuráveis via .env
LOG_FILE="$SITE_PATH/$(env_var DEPLOY_LOG_FILE "deploy-log.txt")"
GIT_BRANCH="$(env_var DEPLOY_BRANCH "main")"
PUBLIC_DIR="$(env_var PUBLIC_HTML_DIR "public_html")"
DIST_DIR="$(env_var DIST_DIR "dist")"
NODE_ENV="$(env_var NODE_ENV "production")"

TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Função para registrar mensagens no log
log_message() {
  echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
  echo "$1"
}

# Inicia o deploy
log_message " Iniciando deploy automático..."
log_message " Diretório do site: $SITE_PATH"
log_message " Branch: $GIT_BRANCH"
log_message " Diretório público: $PUBLIC_DIR"

# Navega até o diretório do projeto
cd "$SITE_PATH" || {
  log_message " Erro: Não foi possível acessar o diretório $SITE_PATH"
  exit 1
}

# Atualiza o código do repositório
log_message " Atualizando código do repositório..."
git pull origin "$GIT_BRANCH" || {
  log_message " Erro ao atualizar o código do repositório"
  exit 1
}

# Instala dependências (se necessário)
if [ -f "package.json" ]; then
  log_message " Instalando dependências..."
  NODE_ENV="$NODE_ENV" npm ci --production || {
    log_message " Erro ao instalar dependências"
    exit 1
  }
fi

# Compila o projeto (se necessário)
if [ -f "package.json" ] && grep -q "\"build\"" "package.json"; then
  log_message " Compilando o projeto..."
  NODE_ENV="$NODE_ENV" npm run build || {
    log_message " Erro ao compilar o projeto"
    exit 1
  }
fi

# Copia os arquivos compilados para o diretório público (se aplicável)
if [ -d "$DIST_DIR" ]; then
  log_message " Copiando arquivos compilados para o diretório público..."
  
  # Cria o diretório público se não existir
  if [ ! -d "$PUBLIC_DIR" ]; then
    mkdir -p "$PUBLIC_DIR"
  fi
  
  cp -R "$DIST_DIR"/* "$PUBLIC_DIR"/ || {
    log_message " Erro ao copiar arquivos compilados"
    exit 1
  }
fi

# Limpa cache (se necessário)
if [ -d "$PUBLIC_DIR/cache" ]; then
  log_message " Limpando cache..."
  rm -rf "$PUBLIC_DIR/cache"/*
fi

# Verifica se há atualizações no banco de dados (exemplo)
if [ -d "migrations" ]; then
  log_message " Verificando atualizações no banco de dados..."
  # Adicione aqui comandos para executar migrações, se necessário
fi

# Restaura permissões (importante para segurança)
log_message " Restaurando permissões..."
find "$PUBLIC_DIR" -type d -exec chmod 755 {} \;
find "$PUBLIC_DIR" -type f -exec chmod 644 {} \;

# Finaliza o deploy
log_message " Deploy concluído com sucesso em: $(date "+%Y-%m-%d %H:%M:%S")"
exit 0
