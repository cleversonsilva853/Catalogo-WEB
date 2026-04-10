<?php
// routes/delivery_zones.php — Zonas de entrega
$db = getDB();
function gen_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
}

if ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM delivery_zones ORDER BY sort_order ASC');
    respond($stmt->fetchAll());
}
if ($method === 'POST') {
    require_auth(); $b = get_body();
    if (empty($b['name'])) respond_error('Nome é obrigatório', 422);
    $uuid = gen_uuid();
    $db->prepare('INSERT INTO delivery_zones (id,name,fee,min_order_value,is_active,sort_order) VALUES (?,?,?,?,?,?)')
       ->execute([$uuid,$b['name'],$b['fee']??0,$b['min_order_value']??null,
                  isset($b['is_active'])?(int)(bool)$b['is_active']:1,$b['sort_order']??0]);
    $stmt=$db->prepare('SELECT * FROM delivery_zones WHERE id=?');$stmt->execute([$uuid]);
    respond($stmt->fetch(),201);
}
if ($method === 'PUT' && $id) {
    require_auth(); $b=get_body(); $fields=[];$params=[];
    foreach(['name','fee','min_order_value','is_active','sort_order'] as $f)
        if(array_key_exists($f,$b)){$fields[]="$f=?";$params[]=$f==='is_active'?(int)(bool)$b[$f]:$b[$f];}
    $params[]=$id;
    $db->prepare('UPDATE delivery_zones SET '.implode(',',$fields).' WHERE id=?')->execute($params);
    $stmt=$db->prepare('SELECT * FROM delivery_zones WHERE id=?');$stmt->execute([$id]);respond($stmt->fetch());
}
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM delivery_zones WHERE id=?')->execute([$id]);
    respond(['message'=>'Zona removida']);
}
respond_error('Método não permitido',405);
