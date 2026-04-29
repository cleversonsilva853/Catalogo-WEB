<?php
// ============================================================
// api/web_push.php — Web Push VAPID (sem Composer, PHP 7.4+)
// Implementa RFC 8291 + RFC 8030 + RFC 7515 (ES256)
// ============================================================

function wp_b64u_encode(string $d): string {
    return rtrim(strtr(base64_encode($d), '+/', '-_'), '=');
}

function wp_b64u_decode(string $d): string {
    $pad = strlen($d) % 4;
    if ($pad) $d .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($d, '-_', '+/'));
}

// HKDF-Extract + HKDF-Expand (RFC 5869, SHA-256)
function wp_hkdf(string $salt, string $ikm, string $info, int $len): string {
    $prk = hash_hmac('sha256', $ikm, $salt, true);
    $t = ''; $okm = '';
    for ($i = 1; strlen($okm) < $len; $i++) {
        $t = hash_hmac('sha256', $t . $info . chr($i), $prk, true);
        $okm .= $t;
    }
    return substr($okm, 0, $len);
}

// DER (ECDSA) → raw R||S (64 bytes para ES256)
function wp_der_to_raw(string $der): string {
    $pos = 2; // pula SEQUENCE tag + length
    $pos++; // INTEGER tag R
    $rl = ord($der[$pos++]);
    $r = substr($der, $pos, $rl); $pos += $rl;
    $pos++; // INTEGER tag S
    $sl = ord($der[$pos++]);
    $s = substr($der, $pos, $sl);
    return str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT)
         . str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);
}

// Chave EC privada raw (32 bytes) + pública (65 bytes) → PEM ECPrivateKey
function wp_private_pem(string $priv, string $pub): string {
    // RFC 5915 ECPrivateKey DER para prime256v1
    // OID prime256v1 = 1.2.840.10045.3.1.7 → 06 08 2a 86 48 ce 3d 03 01 07 (10 bytes)
    // [0] context: a0 0c 30 0a 06 08 2a 86 48 ce 3d 03 01 07 (14 bytes)
    // [1] context: a1 44 03 42 00 [65-byte pub] (70 bytes)
    // Inner: 3 (version) + 34 (priv) + 14 (curve) + 70 (pub) = 121 = 0x79
    $der = "\x30\x79"
         . "\x02\x01\x01"
         . "\x04\x20" . $priv
         . "\xa0\x0c\x30\x0a\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"
         . "\xa1\x44\x03\x42\x00" . $pub;
    return "-----BEGIN EC PRIVATE KEY-----\n"
         . chunk_split(base64_encode($der), 64, "\n")
         . "-----END EC PRIVATE KEY-----\n";
}

// Chave EC pública raw (65 bytes) → PEM SubjectPublicKeyInfo
function wp_public_pem(string $pub): string {
    // SubjectPublicKeyInfo: AlgorithmIdentifier (id-ecPublicKey + prime256v1) + BIT STRING
    // OID id-ecPublicKey = 1.2.840.10045.2.1 → 06 07 2a 86 48 ce 3d 02 01 (9 bytes)
    // OID prime256v1 = 06 08 2a 86 48 ce 3d 03 01 07 (10 bytes)
    // AlgorithmIdentifier: 30 13 [9+10=19 bytes] (21 total)
    // BIT STRING: 03 42 00 [65 bytes] (68 total)
    // Inner: 21 + 68 = 89 = 0x59
    $der = "\x30\x59"
         . "\x30\x13"
         . "\x06\x07\x2a\x86\x48\xce\x3d\x02\x01"
         . "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"
         . "\x03\x42\x00" . $pub;
    return "-----BEGIN PUBLIC KEY-----\n"
         . chunk_split(base64_encode($der), 64, "\n")
         . "-----END PUBLIC KEY-----\n";
}

// Cria JWT VAPID assinado com ES256
function wp_vapid_jwt(string $audience, string $priv_b64, string $pub_b64): string {
    $priv_raw = wp_b64u_decode($priv_b64);
    $pub_raw  = wp_b64u_decode($pub_b64);
    if (strlen($priv_raw) !== 32 || strlen($pub_raw) < 65) return '';

    $header  = wp_b64u_encode('{"typ":"JWT","alg":"ES256"}');
    $payload = wp_b64u_encode(json_encode([
        'aud' => $audience,
        'exp' => time() + 43200,
        'sub' => 'mailto:admin@deliverygrill.com.br',
    ]));
    $signing_input = "$header.$payload";

    $pem  = wp_private_pem($priv_raw, $pub_raw);
    $pkey = openssl_pkey_get_private($pem);
    if (!$pkey) return '';

    openssl_sign($signing_input, $der_sig, $pkey, 'SHA256');
    return $signing_input . '.' . wp_b64u_encode(wp_der_to_raw($der_sig));
}

// Cifra o payload com AES-128-GCM (RFC 8291 / aes128gcm)
function wp_encrypt(string $payload, string $p256dh_b64, string $auth_b64): ?string {
    $recv_pub = wp_b64u_decode($p256dh_b64); // 65 bytes
    $auth     = wp_b64u_decode($auth_b64);   // 16 bytes

    // Gera par de chaves efêmeras
    $eph = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    if (!$eph) return null;
    $det = openssl_pkey_get_details($eph);
    $x   = str_pad($det['ec']['x'], 32, "\x00", STR_PAD_LEFT);
    $y   = str_pad($det['ec']['y'], 32, "\x00", STR_PAD_LEFT);
    $send_pub = "\x04" . $x . $y; // 65 bytes

    // Carrega chave pública do assinante
    $recv_pem = wp_public_pem($recv_pub);
    $recv_key = openssl_pkey_get_public($recv_pem);
    if (!$recv_key) return null;

    // ECDH
    $shared = openssl_pkey_derive($recv_key, $eph);
    if (!$shared) return null;

    $salt = random_bytes(16);

    // Derivação de chaves (RFC 8291)
    $key_info = "WebPush: info\x00" . $recv_pub . $send_pub;
    $ikm      = wp_hkdf($auth, $shared, $key_info, 32);
    $cek      = wp_hkdf($salt, $ikm, "Content-Encoding: aes128gcm\x00", 16);
    $nonce    = wp_hkdf($salt, $ikm, "Content-Encoding: nonce\x00", 12);

    // Cifra com tag de 16 bytes
    $tag = '';
    $ct  = openssl_encrypt($payload . "\x02", 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag, '', 16);
    if ($ct === false) return null;

    // Record: salt(16) + rs(4) + idlen(1) + sender_pub(65) + ciphertext + tag(16)
    return $salt . pack('N', 4096) . chr(65) . $send_pub . $ct . $tag;
}

/**
 * Envia Web Push para uma subscription individual.
 * Retorna o HTTP status code (201 = sucesso, 410 = subscription expirada, etc.)
 */
function send_web_push(string $endpoint, string $p256dh, string $auth_key, array $notification): int {
    // Valida chaves VAPID
    $priv_raw = wp_b64u_decode(VAPID_PRIVATE_KEY);
    if (strlen($priv_raw) !== 32) {
        error_log('[WebPush] Chave VAPID inválida ou placeholder. Configure VAPID_PRIVATE no servidor.');
        return 0;
    }

    $body = wp_encrypt(json_encode($notification), $p256dh, $auth_key);
    if ($body === null) {
        error_log('[WebPush] Falha ao criptografar o payload.');
        return 0;
    }

    $parsed   = parse_url($endpoint);
    $audience = $parsed['scheme'] . '://' . $parsed['host'];
    $jwt      = wp_vapid_jwt($audience, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY);
    if (!$jwt) {
        error_log('[WebPush] Falha ao gerar JWT VAPID.');
        return 0;
    }

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => [
            'TTL: 86400',
            'Content-Type: application/octet-stream',
            'Content-Encoding: aes128gcm',
            'Authorization: vapid t=' . $jwt . ',k=' . VAPID_PUBLIC_KEY,
        ],
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err      = curl_error($ch);
    curl_close($ch);

    if ($err) error_log("[WebPush] cURL error para $endpoint: $err");
    if ($code && $code !== 201 && $code !== 200) {
        error_log("[WebPush] HTTP $code para $endpoint — resposta: " . substr($response, 0, 200));
    }

    return $code;
}

/**
 * Envia para TODAS as push_subscriptions cadastradas.
 * Remove automaticamente subscriptions expiradas (HTTP 410).
 * Retorna o número de envios bem-sucedidos.
 */
function send_push_to_all(string $title, string $body_text, string $url = '/', string $icon = ''): int {
    $db   = getDB();
    $subs = $db->query('SELECT * FROM push_subscriptions')->fetchAll();
    $sent = 0;
    $expired = [];

    $payload = [
        'title' => $title,
        'body'  => $body_text,
        'url'   => $url,
        'icon'  => $icon ?: (defined('BASE_URL') ? BASE_URL . '/icon-192.png' : '/icon-192.png'),
        'badge' => defined('BASE_URL') ? BASE_URL . '/icon-192.png' : '/icon-192.png',
    ];

    foreach ($subs as $sub) {
        $code = send_web_push($sub['endpoint'], $sub['p256dh'], $sub['auth_key'], $payload);

        if ($code >= 200 && $code < 300) {
            $sent++;
        } elseif ($code === 410 || $code === 404) {
            // 410 Gone = subscription expirada/cancelada pelo usuário — remove do banco
            $expired[] = $sub['id'];
            error_log("[WebPush] Subscription expirada removida: {$sub['endpoint']}");
        }
        // Outros erros (429 rate limit, 5xx servidor): mantém para tentar depois
    }

    // Remove subscriptions expiradas em lote
    if (!empty($expired)) {
        $placeholders = implode(',', array_fill(0, count($expired), '?'));
        $db->prepare("DELETE FROM push_subscriptions WHERE id IN ($placeholders)")->execute($expired);
    }

    return $sent;
}
