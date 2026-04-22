<?php
// routes/uploads.php — Upload de imagens
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

if ($method === 'POST') {
    require_auth();
    if (!isset($_FILES['file'])) respond_error('Nenhum arquivo enviado', 422);

    $file = $_FILES['file'];

    // Verificar se houve erro no upload do PHP
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $phpErrors = [
            UPLOAD_ERR_INI_SIZE   => 'O arquivo excede o limite post_max_size do PHP',
            UPLOAD_ERR_FORM_SIZE  => 'O arquivo excede o limite do formulário',
            UPLOAD_ERR_PARTIAL    => 'O upload foi feito apenas parcialmente',
            UPLOAD_ERR_NO_FILE    => 'Nenhum arquivo enviado',
            UPLOAD_ERR_NO_TMP_DIR => 'Pasta temporária ausente',
            UPLOAD_ERR_CANT_WRITE => 'Falha ao escrever o arquivo no disco',
            UPLOAD_ERR_EXTENSION  => 'Uma extensão do PHP interrompeu o upload'
        ];
        $errMsg = $phpErrors[$file['error']] ?? 'Erro desconhecido no upload do PHP';
        respond_error($errMsg, 500);
    }

    $allowedImages = ['image/jpeg','image/png','image/webp','image/gif'];
    $allowedVideos = ['video/mp4','video/webm','video/quicktime'];
    $allowed = array_merge($allowedImages, $allowedVideos);
    
    $maxSize  = 100 * 1024 * 1024; // 100MB

    if (!in_array($file['type'], $allowed)) {
        respond_error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou vídeos MP4/WebM.', 422);
    }
    
    if ($file['size'] > $maxSize) respond_error('Arquivo muito grande. Máximo: 100MB', 422);

    // Garantir que a pasta existe e é gravável
    if (!is_dir(UPLOAD_DIR)) {
        if (!mkdir(UPLOAD_DIR, 0755, true)) {
            respond_error('Não foi possível criar a pasta de uploads: ' . UPLOAD_DIR, 500);
        }
    }
    
    if (!is_writable(UPLOAD_DIR)) {
        respond_error('A pasta de uploads não tem permissão de escrita: ' . UPLOAD_DIR, 500);
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_', true) . '.' . strtolower($ext);
    $dest     = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        respond_error('Falha ao mover o arquivo para o destino final', 500);
    }

    respond(['url' => UPLOAD_URL . $filename]);
}

if ($method === 'DELETE' && $id) {
    require_auth();
    $file = UPLOAD_DIR . basename($id);
    if (file_exists($file)) unlink($file);
    respond(['message' => 'Arquivo removido']);
}

respond_error('Método não permitido', 405);
