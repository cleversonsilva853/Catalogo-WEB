<?php
// routes/uploads.php — Upload de imagens
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

if ($method === 'POST') {
    require_auth();
    if (!isset($_FILES['file'])) respond_error('Nenhum arquivo enviado', 422);

    $file     = $_FILES['file'];
    $allowed  = ['image/jpeg','image/png','image/webp','image/gif'];
    $maxSize  = 5 * 1024 * 1024; // 5MB

    if (!in_array($file['type'], $allowed)) respond_error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP.', 422);
    if ($file['size'] > $maxSize) respond_error('Arquivo muito grande. Máximo: 5MB', 422);

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_', true) . '.' . strtolower($ext);
    $dest     = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        respond_error('Falha ao salvar o arquivo', 500);
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
