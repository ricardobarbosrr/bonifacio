<?php
/**
 * Classe JsonStorage
 * 
 * Responsável por operações CRUD em arquivos JSON
 * Esta é a classe central para armazenamento de dados no sistema
 */
class JsonStorage {
    private $basePath;
    private $entityCache = [];
    
    /**
     * Construtor
     * 
     * @param string $basePath Diretório base para armazenamento de arquivos JSON
     */
    public function __construct($basePath = null) {
        $this->basePath = $basePath ?: __DIR__ . '/../../data';
        
        // Garantir que o diretório base exista
        if (!is_dir($this->basePath)) {
            if (!mkdir($this->basePath, 0755, true)) {
                throw new Exception("Não foi possível criar o diretório de armazenamento: {$this->basePath}");
            }
        }
    }
    
    /**
     * Obtém o caminho para um arquivo de entidade
     * 
     * @param string $entity Nome da entidade (posts, comments, users, etc)
     * @return string Caminho completo para o arquivo JSON
     */
    private function getFilePath($entity) {
        return $this->basePath . '/' . $entity . '.json';
    }
    
    /**
     * Inicializa entidades definidas na configuração
     * 
     * @return bool true se todas as entidades foram inicializadas com sucesso
     */
    public function initializeEntities() {
        $entities = [
            'users', 'posts', 'comments', 'articles', 'likes', 
            'categories', 'tags', 'notifications'
        ];
        
        $result = true;
        foreach ($entities as $entity) {
            if (!$this->initializeEntity($entity)) {
                $result = false;
            }
        }
        return $result;
    }
    
    /**
     * Inicializa uma entidade específica se ela não existir
     * 
     * @param string $entity Nome da entidade
     * @return bool true se inicializado com sucesso
     */
    public function initializeEntity($entity) {
        $filePath = $this->getFilePath($entity);
        
        if (!file_exists($filePath)) {
            return $this->saveAll($entity, []);
        }
        
        return true;
    }
    
    /**
     * Carrega uma entidade do arquivo JSON para memória
     * 
     * @param string $entity Nome da entidade
     * @return array Dados da entidade
     */
    private function loadEntity($entity) {
        // Verificar se já está em cache
        if (isset($this->entityCache[$entity])) {
            return $this->entityCache[$entity];
        }
        
        $filePath = $this->getFilePath($entity);
        
        // Inicializar arquivo se não existir
        if (!file_exists($filePath)) {
            $this->initializeEntity($entity);
            return [];
        }
        
        // Ler e decodificar o conteúdo do arquivo
        $content = file_get_contents($filePath);
        $data = json_decode($content, true);
        
        // Verificar erro de decodificação
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Erro na decodificação do arquivo {$entity}.json: " . json_last_error_msg());
            return [];
        }
        
        // Armazenar em cache
        $this->entityCache[$entity] = $data ?: [];
        
        return $this->entityCache[$entity];
    }
    
    /**
     * Obtém todos os registros de uma entidade
     * 
     * @param string $entity Nome da entidade
     * @return array Todos os registros
     */
    public function getAll($entity) {
        return $this->loadEntity($entity);
    }
    
    /**
     * Salva todos os registros de uma entidade
     * 
     * @param string $entity Nome da entidade
     * @param array $data Dados a serem salvos
     * @return bool true se salvo com sucesso
     */
    public function saveAll($entity, $data) {
        $filePath = $this->getFilePath($entity);
        
        // Formatar JSON para melhor legibilidade
        $content = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        
        if ($content === false) {
            error_log("Erro na codificação de dados para JSON: " . json_last_error_msg());
            return false;
        }
        
        // Criar o diretório se não existir
        $dir = dirname($filePath);
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            error_log("Não foi possível criar o diretório: {$dir}");
            return false;
        }
        
        // Salvar no arquivo
        $success = file_put_contents($filePath, $content);
        
        if ($success === false) {
            error_log("Erro ao salvar arquivo {$entity}.json");
            return false;
        }
        
        // Atualizar cache
        $this->entityCache[$entity] = $data;
        
        return true;
    }
    
    /**
     * Obtém um registro específico pelo ID
     * 
     * @param string $entity Nome da entidade
     * @param string $id ID do registro
     * @return array|null Registro encontrado ou null
     */
    public function getById($entity, $id) {
        $items = $this->getAll($entity);
        
        foreach ($items as $item) {
            if (isset($item['id']) && $item['id'] === $id) {
                return $item;
            }
        }
        
        return null;
    }
    
    /**
     * Adiciona um novo registro
     * 
     * @param string $entity Nome da entidade
     * @param array $item Dados do registro
     * @return bool true se adicionado com sucesso
     */
    public function add($entity, $item) {
        // Garantir que há um ID
        if (!isset($item['id'])) {
            $item['id'] = $this->generateUniqueId();
        }
        
        // Adicionar timestamp se não existir
        if (!isset($item['created_at'])) {
            $item['created_at'] = date('Y-m-d H:i:s');
        }
        
        $items = $this->getAll($entity);
        
        // Verificar duplicidade de ID
        foreach ($items as $existingItem) {
            if (isset($existingItem['id']) && $existingItem['id'] === $item['id']) {
                error_log("Tentativa de adicionar item com ID duplicado: {$item['id']}");
                return false;
            }
        }
        
        // Adicionar novo item
        $items[] = $item;
        
        return $this->saveAll($entity, $items);
    }
    
    /**
     * Atualiza um registro existente
     * 
     * @param string $entity Nome da entidade
     * @param string $id ID do registro
     * @param array $item Novos dados do registro
     * @return bool true se atualizado com sucesso
     */
    public function update($entity, $id, $item) {
        $items = $this->getAll($entity);
        $updated = false;
        
        // Garantir que o ID não seja alterado
        $item['id'] = $id;
        
        // Adicionar timestamp de atualização
        if (!isset($item['updated_at'])) {
            $item['updated_at'] = date('Y-m-d H:i:s');
        }
        
        foreach ($items as $key => $existingItem) {
            if (isset($existingItem['id']) && $existingItem['id'] === $id) {
                $items[$key] = $item;
                $updated = true;
                break;
            }
        }
        
        if (!$updated) {
            error_log("Tentativa de atualizar item inexistente: {$id}");
            return false;
        }
        
        return $this->saveAll($entity, $items);
    }
    
    /**
     * Remove um registro
     * 
     * @param string $entity Nome da entidade
     * @param string $id ID do registro
     * @return bool true se removido com sucesso
     */
    public function delete($entity, $id) {
        $items = $this->getAll($entity);
        $initialCount = count($items);
        
        // Filtrar para remover o item
        $items = array_filter($items, function($item) use ($id) {
            return !isset($item['id']) || $item['id'] !== $id;
        });
        
        // Verificar se algo foi removido
        if (count($items) === $initialCount) {
            error_log("Tentativa de excluir item inexistente: {$id}");
            return false;
        }
        
        // Reindexar o array para evitar problemas
        $items = array_values($items);
        
        return $this->saveAll($entity, $items);
    }
    
    /**
     * Busca registros conforme critérios
     * 
     * @param string $entity Nome da entidade
     * @param array $criteria Critérios de busca (campo => valor)
     * @return array Registros encontrados
     */
    public function findBy($entity, $criteria) {
        $items = $this->getAll($entity);
        $results = [];
        
        foreach ($items as $item) {
            $match = true;
            
            foreach ($criteria as $field => $value) {
                // Se o critério for um array, verifica se o valor está no array
                if (is_array($value)) {
                    if (!isset($item[$field]) || !in_array($item[$field], $value)) {
                        $match = false;
                        break;
                    }
                } else {
                    // Caso contrário, compara diretamente
                    if (!isset($item[$field]) || $item[$field] !== $value) {
                        $match = false;
                        break;
                    }
                }
            }
            
            if ($match) {
                $results[] = $item;
            }
        }
        
        return $results;
    }
    
    /**
     * Conta o número de registros conforme critérios
     * 
     * @param string $entity Nome da entidade
     * @param array $criteria Critérios de busca (opcional)
     * @return int Número de registros
     */
    public function count($entity, $criteria = []) {
        if (empty($criteria)) {
            return count($this->getAll($entity));
        }
        
        return count($this->findBy($entity, $criteria));
    }
    
    /**
     * Busca com paginação
     * 
     * @param string $entity Nome da entidade
     * @param array $criteria Critérios de busca
     * @param int $page Número da página
     * @param int $limit Registros por página
     * @param string $orderBy Campo para ordenação
     * @param string $direction Direção da ordenação (asc|desc)
     * @return array Dados paginados e metadados
     */
    public function paginate($entity, $criteria = [], $page = 1, $limit = 10, $orderBy = 'created_at', $direction = 'desc') {
        $items = empty($criteria) ? $this->getAll($entity) : $this->findBy($entity, $criteria);
        
        // Ordenação
        usort($items, function($a, $b) use ($orderBy, $direction) {
            // Verificar se o campo existe
            if (!isset($a[$orderBy]) || !isset($b[$orderBy])) {
                return 0;
            }
            
            // Comparação específica para timestamps
            if (strtotime($a[$orderBy]) && strtotime($b[$orderBy])) {
                $comparison = strtotime($a[$orderBy]) <=> strtotime($b[$orderBy]);
            } else {
                $comparison = $a[$orderBy] <=> $b[$orderBy];
            }
            
            // Inverter para ordem decrescente
            return $direction === 'desc' ? -$comparison : $comparison;
        });
        
        // Cálculos para paginação
        $total = count($items);
        $offset = ($page - 1) * $limit;
        $pageCount = ceil($total / $limit);
        
        // Extrair registros da página atual
        $items = array_slice($items, $offset, $limit);
        
        return [
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => (int)$page,
                'limit' => (int)$limit,
                'page_count' => $pageCount,
                'has_more' => $page < $pageCount
            ]
        ];
    }
    
    /**
     * Limpa o cache da entidade
     * 
     * @param string|null $entity Nome da entidade ou null para limpar tudo
     */
    public function clearCache($entity = null) {
        if ($entity === null) {
            $this->entityCache = [];
        } else if (isset($this->entityCache[$entity])) {
            unset($this->entityCache[$entity]);
        }
    }
    
    /**
     * Realiza backup de todas as entidades
     * 
     * @return bool true se backup realizado com sucesso
     */
    public function backup() {
        $backupDir = $this->basePath . '/backups/' . date('Y-m-d_His');
        
        if (!is_dir($backupDir) && !mkdir($backupDir, 0755, true)) {
            error_log("Não foi possível criar o diretório de backup: {$backupDir}");
            return false;
        }
        
        $entities = [
            'users', 'posts', 'comments', 'articles', 'likes', 
            'categories', 'tags', 'notifications'
        ];
        
        $success = true;
        foreach ($entities as $entity) {
            $sourceFile = $this->getFilePath($entity);
            if (file_exists($sourceFile)) {
                $destFile = $backupDir . '/' . $entity . '.json';
                if (!copy($sourceFile, $destFile)) {
                    error_log("Falha ao fazer backup de {$entity}.json");
                    $success = false;
                }
            }
        }
        
        return $success;
    }
    
    /**
     * Gera um ID único para registros
     * 
     * @return string ID único
     */
    public function generateUniqueId() {
        return bin2hex(random_bytes(8));
    }
}
