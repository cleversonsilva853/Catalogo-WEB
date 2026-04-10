<?php
// routes/ingredients.php — Ingredientes (estoque de insumos)
$db = getDB();
function gen_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
}

if ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM ingredients ORDER BY name ASC');
    respond($stmt->fetchAll());
}
if ($method === 'POST') {
    require_auth(); $b = get_body();
    if(empty($b['name'])) respond_error('Nome é obrigatório',422);
    $uuid = gen_uuid();
    $db->prepare('INSERT INTO ingredients (id,name,stock_quantity,min_stock,unit) VALUES (?,?,?,?,?)')
       ->execute([$uuid,$b['name'],$b['stock_quantity']??0,$b['min_stock']??0,$b['unit']??'un']);
    $stmt=$db->prepare('SELECT * FROM ingredients WHERE id=?');$stmt->execute([$uuid]);
    respond($stmt->fetch(),201);
}
if ($method === 'PUT' && $id) {
    require_auth(); $b=get_body();$fields=[];$params=[];
    foreach(['name','stock_quantity','min_stock','unit'] as $f)
        if(array_key_exists($f,$b)){$fields[]="$f=?";$params[]=$b[$f];}
    $params[]=$id;
    $db->prepare('UPDATE ingredients SET '.implode(',',$fields).' WHERE id=?')->execute($params);
    $stmt=$db->prepare('SELECT * FROM ingredients WHERE id=?');$stmt->execute([$id]);respond($stmt->fetch());
}
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM ingredients WHERE id=?')->execute([$id]);
    respond(['message'=>'Ingrediente removido']);
}
respond_error('Método não permitido',405);
