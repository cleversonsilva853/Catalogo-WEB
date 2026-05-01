<?php
// api/manifest.php — Gera o manifesto PWA dinamicamente
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db = getDB();
$stmt = $db->query('SELECT name, logo_url, primary_color FROM store_config LIMIT 1');
$cfg = $stmt->fetch();

$type = $_GET['type'] ?? 'customer';
$name = $cfg['name'] ?? 'Cardápio Digital';
$logo = $cfg['logo_url'] ?? 'https://' . $_SERVER['HTTP_HOST'] . '/icon-512.png';
$theme_color = $cfg['primary_color'] ?? '#f59e0b';

// Se for admin, muda o nome
if ($type === 'admin') {
    $name = "Administrativo - " . $name;
    $start_url = "/auth";
} else {
    $start_url = "/";
}

$manifest = [
    "name" => $name,
    "short_name" => $name,
    "description" => "Peça online no " . $name,
    "start_url" => $start_url,
    "display" => "standalone",
    "background_color" => "#ffffff",
    "theme_color" => $theme_color,
    "orientation" => "portrait-primary",
    "icons" => [
        [
            "src" => $logo,
            "sizes" => "192x192",
            "type" => "image/png",
            "purpose" => "any"
        ],
        [
            "src" => $logo,
            "sizes" => "512x512",
            "type" => "image/png",
            "purpose" => "any maskable"
        ]
    ],
    "categories" => ["food", "shopping"],
    "lang" => "pt-BR"
];

echo json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
