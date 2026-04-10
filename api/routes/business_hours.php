<?php
// routes/business_hours.php — Horários de funcionamento
$db = getDB();

if ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM business_hours ORDER BY day_of_week ASC');
    respond($stmt->fetchAll());
}

if ($method === 'PUT') {
    require_auth();
    $b = get_body();
    // Aceita array de horários [{id, day_of_week, open_time, close_time, is_active}]
    if (isset($b[0])) {
        $db->beginTransaction();
        foreach ($b as $hour) {
            $db->prepare('UPDATE business_hours SET open_time=?,close_time=?,is_active=? WHERE id=?')
               ->execute([$hour['open_time'],$hour['close_time'],(int)(bool)$hour['is_active'],$hour['id']]);
        }
        $db->commit();
        $stmt = $db->query('SELECT * FROM business_hours ORDER BY day_of_week ASC');
        respond($stmt->fetchAll());
    }
    // Atualizar um único horário
    if ($id) {
        $fields=[];$params=[];
        foreach(['open_time','close_time','is_active'] as $f)
            if(array_key_exists($f,$b)){$fields[]="$f=?";$params[]=$f==='is_active'?(int)(bool)$b[$f]:$b[$f];}
        $params[]=$id;
        $db->prepare('UPDATE business_hours SET '.implode(',',$fields).' WHERE id=?')->execute($params);
        $stmt=$db->prepare('SELECT * FROM business_hours WHERE id=?');$stmt->execute([$id]);
        respond($stmt->fetch());
    }
}

respond_error('Método não permitido',405);
