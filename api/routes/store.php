<?php
// routes/store.php — Configurações da loja
$db = getDB();

if ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM store_config LIMIT 1');
    $cfg  = $stmt->fetch();
    if (!$cfg) {
        // Criar config padrão se não existir
        $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
            mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
            mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
        $db->prepare('INSERT INTO store_config (id) VALUES (?)')->execute([$uuid]);
        $stmt = $db->query('SELECT * FROM store_config LIMIT 1');
        $cfg  = $stmt->fetch();
    }
    respond($cfg);
}

if ($method === 'PUT') {
    require_auth();
    $b = get_body();
    $allowed = ['name','phone_whatsapp','pix_key','pix_key_type','logo_url','cover_url',
                'address','is_open','delivery_fee','min_order_value','delivery_time_min',
                'delivery_time_max','primary_color','secondary_color','accent_color',
                'pwa_name','pwa_short_name','pix_message','delivery_fee_mode',
                'checkout_whatsapp_message','consume_on_site_enabled'];
    $fields = []; $params = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            $params[] = in_array($f,['is_open','consume_on_site_enabled']) ? (int)(bool)$b[$f] : $b[$f];
        }
    }
    if (!$fields) respond_error('Nenhum campo para atualizar', 422);
    $db->prepare('UPDATE store_config SET ' . implode(', ', $fields))->execute($params);
    $stmt = $db->query('SELECT * FROM store_config LIMIT 1');
    respond($stmt->fetch());
}

respond_error('Método não permitido', 405);
