<?php
// routes/admin_users.php — Gerenciar usuários admin
$db = getDB();
function gen_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
}

if ($method === 'GET') {
    require_auth();
    $stmt = $db->query('SELECT id,usuario,acesso_gestao,acesso_operacoes,acesso_sistema,
        perm_dashboard,perm_pedidos,perm_produtos,perm_categorias,perm_acrescimos,perm_configuracoes,
        perm_relatorios,perm_usuarios,perm_horarios,perm_taxas_entrega,perm_cupons,perm_entregadores,
        perm_qrcode,perm_cozinha,perm_pdv,perm_backup,perm_consumir_local,created_at,updated_at
        FROM admin_users ORDER BY usuario ASC');
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    require_auth(); $b = get_body();
    if(empty($b['usuario'])||empty($b['senha'])) respond_error('Usuário e senha são obrigatórios',422);
    if(strlen($b['senha']) < 6) respond_error('A senha deve ter pelo menos 6 caracteres', 422);
    $uuid = gen_uuid();
    $hash = password_hash($b['senha'], PASSWORD_BCRYPT);
    $db->prepare('INSERT INTO admin_users (id,usuario,senha) VALUES (?,?,?)')
       ->execute([$uuid,$b['usuario'],$hash]);
    $stmt=$db->prepare('SELECT id,usuario FROM admin_users WHERE id=?');$stmt->execute([$uuid]);
    respond($stmt->fetch(),201);
}

if ($method === 'PUT' && $id) {
    require_auth(); $b=get_body(); $fields=[];$params=[];
    $permFields = ['acesso_gestao','acesso_operacoes','acesso_sistema','perm_dashboard','perm_pedidos',
                   'perm_produtos','perm_categorias','perm_acrescimos','perm_configuracoes','perm_relatorios',
                   'perm_usuarios','perm_horarios','perm_taxas_entrega','perm_cupons','perm_entregadores',
                   'perm_qrcode','perm_cozinha','perm_pdv','perm_backup','perm_consumir_local'];
    foreach(array_merge(['usuario','login_email'],$permFields) as $f)
        if(array_key_exists($f,$b)){$fields[]="$f=?";$params[]=in_array($f,$permFields)?(int)(bool)$b[$f]:$b[$f];}
    if(!empty($b['nova_senha'])){
        if(strlen($b['nova_senha']) < 6) respond_error('A nova senha deve ter pelo menos 6 caracteres', 422);
        $fields[]='senha=?';$params[]=password_hash($b['nova_senha'],PASSWORD_BCRYPT);
    }
    if(!$fields) respond_error('Nenhum campo para atualizar',422);
    $params[]=$id;
    $db->prepare('UPDATE admin_users SET '.implode(',',$fields).' WHERE id=?')->execute($params);
    $stmt=$db->prepare('SELECT id,usuario FROM admin_users WHERE id=?');$stmt->execute([$id]);
    respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM admin_users WHERE id=?')->execute([$id]);
    respond(['message'=>'Usuário removido']);
}

respond_error('Método não permitido',405);
