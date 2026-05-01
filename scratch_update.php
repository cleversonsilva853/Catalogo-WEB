<?php
$content = file_get_contents('api/web_push.php');

$target1 = "function send_push_to_all(string \$title, string \$body_text, string \$url = '/', string \$icon = ''): int {\n    \$db   = getDB();\n    \$subs = \$db->query('SELECT * FROM push_subscriptions')->fetchAll();";
$target2 = "function send_push_to_all(string \$title, string \$body_text, string \$url = '/', string \$icon = ''): int {\r\n    \$db   = getDB();\r\n    \$subs = \$db->query('SELECT * FROM push_subscriptions')->fetchAll();";

$replacement = "function send_push_to_all(string \$title, string \$body_text, string \$url = '/', string \$icon = '', ?string \$user_type = null): int {\n    \$db   = getDB();\n    if (\$user_type) {\n        \$stmt = \$db->prepare('SELECT * FROM push_subscriptions WHERE user_type = ?');\n        \$stmt->execute([\$user_type]);\n        \$subs = \$stmt->fetchAll();\n    } else {\n        \$subs = \$db->query('SELECT * FROM push_subscriptions')->fetchAll();\n    }";

$content = str_replace($target1, $replacement, $content);
$content = str_replace($target2, $replacement, $content);

file_put_contents('api/web_push.php', $content);
echo "web_push.php modified\n";

$content2 = file_get_contents('api/routes/push.php');

$target3 = "    if (\$existing) {\n        // Atualiza p256dh e auth_key caso o browser tenha renovado\n        \$db->prepare('UPDATE push_subscriptions SET p256dh = ?, auth_key = ? WHERE endpoint = ?')\n           ->execute([\$b['p256dh'], \$b['auth'], \$b['endpoint']]);\n        respond(['message' => 'Subscription atualizada', 'id' => \$existing['id']]);\n    }\n\n    \$uuid = push_uuid();\n    \$db->prepare('INSERT INTO push_subscriptions (id, endpoint, p256dh, auth_key) VALUES (?,?,?,?)')\n       ->execute([\$uuid, \$b['endpoint'], \$b['p256dh'], \$b['auth']]);";
$target4 = "    if (\$existing) {\r\n        // Atualiza p256dh e auth_key caso o browser tenha renovado\r\n        \$db->prepare('UPDATE push_subscriptions SET p256dh = ?, auth_key = ? WHERE endpoint = ?')\r\n           ->execute([\$b['p256dh'], \$b['auth'], \$b['endpoint']]);\r\n        respond(['message' => 'Subscription atualizada', 'id' => \$existing['id']]);\r\n    }\r\n\r\n    \$uuid = push_uuid();\r\n    \$db->prepare('INSERT INTO push_subscriptions (id, endpoint, p256dh, auth_key) VALUES (?,?,?,?)')\r\n       ->execute([\$uuid, \$b['endpoint'], \$b['p256dh'], \$b['auth']]);";

$replacement2 = "    if (\$existing) {\n        // Atualiza p256dh, auth_key e user_type caso o browser tenha renovado\n        \$db->prepare('UPDATE push_subscriptions SET p256dh = ?, auth_key = ?, user_type = ?, user_identifier = ? WHERE endpoint = ?')\n           ->execute([\$b['p256dh'], \$b['auth'], \$b['user_type'] ?? 'customer', \$b['user_identifier'] ?? null, \$b['endpoint']]);\n        respond(['message' => 'Subscription atualizada', 'id' => \$existing['id']]);\n    }\n\n    \$uuid = push_uuid();\n    \$db->prepare('INSERT INTO push_subscriptions (id, endpoint, p256dh, auth_key, user_type, user_identifier) VALUES (?,?,?,?,?,?)')\n       ->execute([\$uuid, \$b['endpoint'], \$b['p256dh'], \$b['auth'], \$b['user_type'] ?? 'customer', \$b['user_identifier'] ?? null]);";

$content2 = str_replace($target3, $replacement2, $content2);
$content2 = str_replace($target4, $replacement2, $content2);

file_put_contents('api/routes/push.php', $content2);
echo "push.php modified\n";

$content3 = file_get_contents('api/routes/stories.php');
$target5 = "        send_push_to_all(\n            title: \$story['title'] ?? 'Nova Novidade!',\n            body: \$story['description'] ?? 'Venha conferir nossa nova publicação.',\n            url: '/?story=' . \$story_id,\n            icon: \$story['media_url'] ?? null\n        );";
$target6 = "        send_push_to_all(\r\n            title: \$story['title'] ?? 'Nova Novidade!',\r\n            body: \$story['description'] ?? 'Venha conferir nossa nova publicação.',\r\n            url: '/?story=' . \$story_id,\r\n            icon: \$story['media_url'] ?? null\r\n        );";
$replacement3 = "        send_push_to_all(\n            title: \$story['title'] ?? 'Nova Novidade!',\n            body: \$story['description'] ?? 'Venha conferir nossa nova publicação.',\n            url: '/?story=' . \$story_id,\n            icon: \$story['media_url'] ?? null,\n            user_type: 'customer'\n        );";

$content3 = str_replace($target5, $replacement3, $content3);
$content3 = str_replace($target6, $replacement3, $content3);

file_put_contents('api/routes/stories.php', $content3);
echo "stories.php modified\n";
