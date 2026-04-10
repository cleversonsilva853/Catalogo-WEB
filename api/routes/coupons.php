<?php
// routes/coupons.php — Cupons de desconto
$db = getDB();
function gen_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
}

// GET /coupons  |  GET /coupons/validate?code=XXXX
if ($method === 'GET') {
    if ($id === 'validate') {
        $code = $_GET['code'] ?? '';
        $stmt = $db->prepare('SELECT * FROM coupons WHERE code=? AND is_active=1 LIMIT 1');
        $stmt->execute([$code]);
        $coupon = $stmt->fetch();
        if (!$coupon) respond_error('Cupom não encontrado ou inativo', 404);
        if ($coupon['expires_at'] && strtotime($coupon['expires_at']) < time()) respond_error('Cupom expirado',400);
        if ($coupon['max_uses'] && $coupon['current_uses'] >= $coupon['max_uses']) respond_error('Cupom esgotado',400);
        respond($coupon);
    }
    $stmt = $db->query('SELECT * FROM coupons ORDER BY created_at DESC');
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    require_auth(); $b = get_body();
    if(empty($b['code'])) respond_error('Código é obrigatório',422);
    $uuid = gen_uuid();
    $db->prepare('INSERT INTO coupons (id,code,discount_type,discount_value,min_order_value,max_uses,is_active,expires_at) VALUES (?,?,?,?,?,?,?,?)')
       ->execute([$uuid,$b['code'],$b['discount_type']??'percentage',$b['discount_value']??0,
                  $b['min_order_value']??null,$b['max_uses']??null,
                  isset($b['is_active'])?(int)(bool)$b['is_active']:1,$b['expires_at']??null]);
    $stmt=$db->prepare('SELECT * FROM coupons WHERE id=?');$stmt->execute([$uuid]);
    respond($stmt->fetch(),201);
}

if ($method === 'PUT' && $id) {
    require_auth(); $b=get_body(); $fields=[];$params=[];
    foreach(['code','discount_type','discount_value','min_order_value','max_uses','is_active','expires_at'] as $f)
        if(array_key_exists($f,$b)){$fields[]="$f=?";$params[]=$f==='is_active'?(int)(bool)$b[$f]:$b[$f];}
    $params[]=$id;
    $db->prepare('UPDATE coupons SET '.implode(',',$fields).' WHERE id=?')->execute($params);
    $stmt=$db->prepare('SELECT * FROM coupons WHERE id=?');$stmt->execute([$id]);respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM coupons WHERE id=?')->execute([$id]);
    respond(['message'=>'Cupom removido']);
}

respond_error('Método não permitido',405);
