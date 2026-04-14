-- ============================================================
-- CATALOGO WEB — Schema MySQL
-- Execute este arquivo no phpMyAdmin da HostGator
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- 1. CONFIGURAÇÕES DA LOJA
-- ============================================================
CREATE TABLE IF NOT EXISTS store_config (
  id          CHAR(36)       NOT NULL DEFAULT (UUID()),
  name        VARCHAR(255)   NOT NULL DEFAULT 'Meu Restaurante',
  phone_whatsapp VARCHAR(30) DEFAULT NULL,
  pix_key     VARCHAR(255)   DEFAULT NULL,
  pix_key_type VARCHAR(50)   DEFAULT 'Telefone',
  logo_url    TEXT           DEFAULT NULL,
  cover_url   TEXT           DEFAULT NULL,
  address     TEXT           DEFAULT NULL,
  is_open     TINYINT(1)     NOT NULL DEFAULT 1,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  min_order_value DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  delivery_time_min INT      DEFAULT 30,
  delivery_time_max INT      DEFAULT 45,
  primary_color   VARCHAR(50) DEFAULT '45 100% 51%',
  secondary_color VARCHAR(50) DEFAULT '142 76% 49%',
  accent_color    VARCHAR(50) DEFAULT '45 100% 95%',
  pwa_name        VARCHAR(100) DEFAULT 'Cardápio',
  pwa_short_name  VARCHAR(50)  DEFAULT 'Cardápio',
  pix_message     TEXT DEFAULT NULL,
  delivery_fee_mode VARCHAR(20) DEFAULT 'fixed',
  checkout_whatsapp_message TEXT DEFAULT NULL,
  consume_on_site_enabled TINYINT(1) DEFAULT 0,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. USUÁRIOS ADMIN
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id           CHAR(36)      NOT NULL DEFAULT (UUID()),
  usuario      VARCHAR(100)  NOT NULL,
  senha        VARCHAR(255)  NOT NULL,
  acesso_gestao    TINYINT(1) NOT NULL DEFAULT 1,
  acesso_operacoes TINYINT(1) NOT NULL DEFAULT 1,
  acesso_sistema   TINYINT(1) NOT NULL DEFAULT 1,
  perm_dashboard    TINYINT(1) NOT NULL DEFAULT 1,
  perm_pedidos      TINYINT(1) NOT NULL DEFAULT 1,
  perm_produtos     TINYINT(1) NOT NULL DEFAULT 1,
  perm_categorias   TINYINT(1) NOT NULL DEFAULT 1,
  perm_acrescimos   TINYINT(1) NOT NULL DEFAULT 1,
  perm_configuracoes TINYINT(1) NOT NULL DEFAULT 1,
  perm_relatorios   TINYINT(1) NOT NULL DEFAULT 1,
  perm_usuarios     TINYINT(1) NOT NULL DEFAULT 1,
  perm_horarios     TINYINT(1) NOT NULL DEFAULT 1,
  perm_taxas_entrega TINYINT(1) NOT NULL DEFAULT 1,
  perm_cupons       TINYINT(1) NOT NULL DEFAULT 1,
  perm_entregadores TINYINT(1) NOT NULL DEFAULT 1,
  perm_qrcode       TINYINT(1) NOT NULL DEFAULT 1,
  perm_cozinha      TINYINT(1) NOT NULL DEFAULT 1,
  perm_pdv          TINYINT(1) NOT NULL DEFAULT 1,
  perm_backup       TINYINT(1) NOT NULL DEFAULT 1,
  perm_consumir_local TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuário admin padrão (senha: admin123 — troque após o primeiro acesso!)
INSERT IGNORE INTO admin_users (id, usuario, senha)
VALUES (UUID(), 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ============================================================
-- 3. CATEGORIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  name       VARCHAR(255) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  image_url  TEXT         DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. INGREDIENTES (estoque de insumos)
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  name           VARCHAR(255) NOT NULL,
  stock_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  min_stock      DECIMAL(10,3) NOT NULL DEFAULT 0,
  unit           VARCHAR(20)  NOT NULL DEFAULT 'un',
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. PRODUTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id             CHAR(36)      NOT NULL DEFAULT (UUID()),
  category_id    CHAR(36)      DEFAULT NULL,
  name           VARCHAR(255)  NOT NULL,
  description    TEXT          DEFAULT NULL,
  price          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  image_url      TEXT          DEFAULT NULL,
  is_available   TINYINT(1)    NOT NULL DEFAULT 1,
  stock_type     VARCHAR(20)   DEFAULT 'unit',
  unit           VARCHAR(20)   DEFAULT 'un',
  stock_quantity DECIMAL(10,3) DEFAULT 0,
  min_stock      DECIMAL(10,3) DEFAULT 0,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. INGREDIENTES POR PRODUTO
-- ============================================================
CREATE TABLE IF NOT EXISTS product_ingredients (
  id             CHAR(36)      NOT NULL DEFAULT (UUID()),
  product_id     CHAR(36)      NOT NULL,
  ingredient_id  CHAR(36)      NOT NULL,
  quantity_used  DECIMAL(10,3) NOT NULL,
  unit           VARCHAR(20)   DEFAULT NULL,
  created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pi_product    FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE CASCADE,
  CONSTRAINT fk_pi_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. GRUPOS DE ACRÉSCIMOS (addons)
-- ============================================================
CREATE TABLE IF NOT EXISTS addon_groups (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  name           VARCHAR(255) NOT NULL,
  title          VARCHAR(255) NOT NULL,
  subtitle       VARCHAR(255) DEFAULT NULL,
  is_required    TINYINT(1)   NOT NULL DEFAULT 0,
  max_selections INT          NOT NULL DEFAULT 1,
  sort_order     INT          NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. OPÇÕES DE ACRÉSCIMOS
-- ============================================================
CREATE TABLE IF NOT EXISTS addon_options (
  id           CHAR(36)      NOT NULL DEFAULT (UUID()),
  group_id     CHAR(36)      NOT NULL,
  name         VARCHAR(255)  NOT NULL,
  price        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_available TINYINT(1)    NOT NULL DEFAULT 1,
  sort_order   INT           NOT NULL DEFAULT 0,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ao_group FOREIGN KEY (group_id) REFERENCES addon_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. ACRÉSCIMOS POR PRODUTO (relacionamento N:N)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_addon_groups (
  id             CHAR(36) NOT NULL DEFAULT (UUID()),
  product_id     CHAR(36) NOT NULL,
  addon_group_id CHAR(36) NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pag (product_id, addon_group_id),
  CONSTRAINT fk_pag_product FOREIGN KEY (product_id)     REFERENCES products(id)     ON DELETE CASCADE,
  CONSTRAINT fk_pag_group   FOREIGN KEY (addon_group_id) REFERENCES addon_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. PEDIDOS (DELIVERY)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                   INT           NOT NULL AUTO_INCREMENT,
  customer_name        VARCHAR(255)  NOT NULL,
  customer_phone       VARCHAR(30)   NOT NULL,
  address_street       VARCHAR(255)  NOT NULL,
  address_number       VARCHAR(20)   NOT NULL,
  address_neighborhood VARCHAR(255)  NOT NULL,
  address_complement   VARCHAR(255)  DEFAULT NULL,
  address_reference    VARCHAR(255)  DEFAULT NULL,
  total_amount         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status               VARCHAR(20)   NOT NULL DEFAULT 'pending',
  payment_method       VARCHAR(20)   NOT NULL,
  change_for           DECIMAL(10,2) DEFAULT NULL,
  driver_id            CHAR(36)      DEFAULT NULL,
  driver_name          VARCHAR(255)  DEFAULT NULL,
  latitude             DECIMAL(10,8) DEFAULT NULL,
  longitude            DECIMAL(11,8) DEFAULT NULL,
  delivery_zone_id     CHAR(36)      DEFAULT NULL,
  delivery_fee         DECIMAL(10,2) DEFAULT 0.00,
  coupon_code          VARCHAR(50)   DEFAULT NULL,
  discount_amount      DECIMAL(10,2) DEFAULT 0.00,
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. ITENS DO PEDIDO
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id           CHAR(36)      NOT NULL DEFAULT (UUID()),
  order_id     INT           DEFAULT NULL,
  product_id   CHAR(36)      DEFAULT NULL,
  product_name VARCHAR(255)  NOT NULL,
  quantity     INT           NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observation  TEXT          DEFAULT NULL,
  addons       JSON          DEFAULT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. ENTREGADORES
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()),
  name                  VARCHAR(255) NOT NULL,
  phone                 VARCHAR(30)  DEFAULT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  is_active             TINYINT(1)   NOT NULL DEFAULT 1,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. ZONAS DE ENTREGA
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  name            VARCHAR(255)  NOT NULL,
  fee             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order_value DECIMAL(10,2) DEFAULT NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  sort_order      INT           NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. HORÁRIOS DE FUNCIONAMENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS business_hours (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  day_of_week INT         NOT NULL,
  open_time   TIME        NOT NULL,
  close_time  TIME        NOT NULL,
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CHECK (day_of_week >= 0 AND day_of_week <= 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir horários padrão (seg-dom 18h-23h)
INSERT IGNORE INTO business_hours (id, day_of_week, open_time, close_time, is_active) VALUES
  (UUID(), 0, '18:00:00', '23:00:00', 1),
  (UUID(), 1, '18:00:00', '23:00:00', 1),
  (UUID(), 2, '18:00:00', '23:00:00', 1),
  (UUID(), 3, '18:00:00', '23:00:00', 1),
  (UUID(), 4, '18:00:00', '23:00:00', 1),
  (UUID(), 5, '18:00:00', '23:00:00', 1),
  (UUID(), 6, '18:00:00', '23:00:00', 1);

-- ============================================================
-- 15. CUPONS DE DESCONTO
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  code            VARCHAR(50)   NOT NULL,
  discount_type   VARCHAR(20)   NOT NULL DEFAULT 'percentage',
  discount_value  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order_value DECIMAL(10,2) DEFAULT NULL,
  max_uses        INT           DEFAULT NULL,
  current_uses    INT           NOT NULL DEFAULT 0,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  expires_at      DATETIME      DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_coupon_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. ENDEREÇOS DE CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  customer_phone VARCHAR(30)  NOT NULL,
  label          VARCHAR(100) NOT NULL DEFAULT 'Casa',
  street         VARCHAR(255) NOT NULL,
  number         VARCHAR(20)  NOT NULL,
  neighborhood   VARCHAR(255) NOT NULL,
  complement     VARCHAR(255) DEFAULT NULL,
  reference      VARCHAR(255) DEFAULT NULL,
  is_default     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_ca_phone (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. CAIXA — SESSÕES
-- ============================================================
CREATE TABLE IF NOT EXISTS caixa_sessions (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  initial_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status          VARCHAR(20)   DEFAULT 'open',
  opened_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
  closed_at       DATETIME      DEFAULT NULL,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. CAIXA — MOVIMENTAÇÕES
-- ============================================================
CREATE TABLE IF NOT EXISTS caixa_movimentacoes (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()),
  session_id  CHAR(36)      DEFAULT NULL,
  type        VARCHAR(20)   NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  description TEXT          DEFAULT NULL,
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES caixa_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. COMANDAS (consumo local)
-- ============================================================
CREATE TABLE IF NOT EXISTS comandas (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  numero_comanda  INT          NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'open',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. PEDIDOS DA COMANDA
-- ============================================================
CREATE TABLE IF NOT EXISTS comanda_pedidos (
  id         CHAR(36) NOT NULL DEFAULT (UUID()),
  comanda_id CHAR(36) NOT NULL,
  pedido_id  INT      NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cp_comanda FOREIGN KEY (comanda_id) REFERENCES comandas(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_pedido  FOREIGN KEY (pedido_id)  REFERENCES orders(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. VENDAS DA COMANDA
-- ============================================================
CREATE TABLE IF NOT EXISTS comanda_vendas (
  id               CHAR(36)      NOT NULL DEFAULT (UUID()),
  comanda_id       CHAR(36)      DEFAULT NULL,
  forma_pagamento  VARCHAR(50)   NOT NULL,
  valor_total      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  data_venda       DATE          NOT NULL DEFAULT (CURDATE()),
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cv_comanda FOREIGN KEY (comanda_id) REFERENCES comandas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. MESAS (consumo local)
-- ============================================================
CREATE TABLE IF NOT EXISTS tables_list (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()),
  number           INT          NOT NULL,
  name             VARCHAR(100) DEFAULT NULL,
  capacity         INT          DEFAULT 4,
  status           VARCHAR(30)  NOT NULL DEFAULT 'available',
  current_order_id BIGINT       DEFAULT NULL,
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_table_number (number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. PUSH SUBSCRIPTIONS (notificações web)
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  endpoint   TEXT         NOT NULL,
  p256dh     TEXT         NOT NULL,
  auth_key   TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. CONFIGURAÇÕES DO SISTEMA
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  setting_key   VARCHAR(100) NOT NULL,
  setting_value TEXT         DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. CONFIGURAÇÕES PWA
-- ============================================================
CREATE TABLE IF NOT EXISTS pwa_config (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  setting_key  VARCHAR(100) NOT NULL,
  setting_value TEXT        DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pwa_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- FIM DO SCHEMA
-- Após executar, acesse o painel admin e configure sua loja!
-- ============================================================
