# Instruções de Deploy Automático para Corpmonar

Este documento contém instruções para configurar o sistema de deploy automático do projeto Corpmonar na Hostinger.

## Arquivos de Deploy

O sistema de deploy automático consiste em três arquivos principais:

1. **deploy.php**: Webhook que recebe notificações do GitHub e inicia o processo de deploy
2. **deploy.sh**: Script Bash que executa as etapas de deploy
3. **.env**: Arquivo de configuração com variáveis de ambiente

## Configuração no Servidor Hostinger

### 1. Preparação dos Arquivos

1. Faça upload dos arquivos `deploy.php`, `deploy.sh` e `.env` para a raiz do seu site na Hostinger
2. Certifique-se de que o arquivo `deploy.sh` tenha permissões de execução:
   ```
   chmod +x deploy.sh
   ```

### 2. Configuração do Arquivo .env

O sistema de deploy usa variáveis de ambiente definidas no arquivo `.env`. Certifique-se de configurar as seguintes variáveis:

```
# Deploy configuration
DEPLOY_SECRET_KEY=sua_chave_secreta_do_github
DEPLOY_BRANCH=main
DEPLOY_LOG_FILE=deploy-log.txt
DEPLOY_SCRIPT=deploy.sh
PUBLIC_HTML_DIR=public_html
DIST_DIR=dist
NODE_ENV=production
```

Você pode personalizar estas configurações de acordo com suas necessidades:

- `DEPLOY_SECRET_KEY`: Chave secreta para validar o webhook do GitHub
- `DEPLOY_BRANCH`: Branch que será usada para deploy (geralmente "main" ou "master")
- `DEPLOY_LOG_FILE`: Nome do arquivo de log
- `DEPLOY_SCRIPT`: Nome do script de deploy
- `PUBLIC_HTML_DIR`: Diretório público do site
- `DIST_DIR`: Diretório onde os arquivos compilados são gerados
- `NODE_ENV`: Ambiente Node.js (geralmente "production" para deploy)

### 3. Configuração do Webhook no GitHub

1. Acesse seu repositório no GitHub
2. Vá para **Settings** > **Webhooks** > **Add webhook**
3. Configure o webhook:
   - **Payload URL**: `https://corpbonifacio.com.br/deploy.php`
   - **Content type**: `application/json`
   - **Secret**: Use o mesmo valor definido em `DEPLOY_SECRET_KEY` no arquivo `.env`
   - **Events**: Selecione apenas `Push events`
   - **Active**: Marque esta opção

4. Após configurar o webhook, descomente as linhas de verificação de assinatura no arquivo `deploy.php` (linhas 38-43)

### 4. Estrutura de Diretórios

O script de deploy assume a seguinte estrutura de diretórios:

```
/
├── deploy.php
├── deploy.sh
├── .env
├── deploy-log.txt (será criado automaticamente)
├── public_html/ (diretório público do site)
└── dist/ (diretório de build)
```

### 5. Testando o Deploy

1. Faça um commit e push para a branch definida em `DEPLOY_BRANCH` no seu repositório
2. Verifique o arquivo definido em `DEPLOY_LOG_FILE` no servidor para confirmar que o deploy foi executado
3. Se houver erros, verifique as permissões dos arquivos e diretórios

## Personalização

Você pode personalizar o processo de deploy editando o arquivo `deploy.sh` e ajustando as variáveis no arquivo `.env`. Algumas possíveis personalizações:

- Ajustar o diretório de destino dos arquivos compilados
- Adicionar etapas de migração de banco de dados
- Configurar notificações por e-mail após o deploy
- Adicionar etapas de teste antes do deploy

## Solução de Problemas

Se o deploy automático não estiver funcionando:

1. Verifique se o webhook está configurado corretamente no GitHub
2. Verifique se os arquivos `deploy.php` e `deploy.sh` têm as permissões corretas
3. Consulte o arquivo de log para ver mensagens de erro detalhadas
4. Verifique se o servidor tem o Git instalado e configurado corretamente
5. Verifique se as variáveis de ambiente no arquivo `.env` estão configuradas corretamente

## Segurança

Para maior segurança:

1. Use uma chave secreta forte no webhook e no arquivo `.env`
2. Considere mover o arquivo `deploy.php` para um subdiretório não óbvio
3. Restrinja o acesso ao arquivo de log usando regras no `.htaccess`
4. Configure o firewall do servidor para permitir apenas conexões do GitHub
5. Certifique-se de que o arquivo `.env` não seja acessível publicamente
