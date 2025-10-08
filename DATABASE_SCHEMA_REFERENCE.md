# 🗄️ DATABASE SCHEMA REFERENCE - PLAYTEST
## Complete column structure for all tables

**Database:** PostgreSQL en Aiven
**Última actualización:** 7 de Octubre de 2025 - 16:00
**Total de tablas:** 46

---

## 📊 TABLAS PRINCIPALES DEL SISTEMA

### 🔹 **users** - Usuarios del sistema
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('users_id_seq') | PRIMARY KEY |
| nickname | varchar(50) | NO | | |
| email | varchar(100) | YES | | |
| password_hash | varchar(255) | NO | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |
| first_name | varchar(100) | YES | | |
| last_name | varchar(150) | YES | | |
| luminarias | integer | YES | 0 | |

---

### 🔹 **user_profiles** - Perfiles extendidos de usuarios
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('user_profiles_id_seq') | PRIMARY KEY |
| user_id | integer | YES | | FK → users(id) |
| answer_history | jsonb | YES | '[]'::jsonb | |
| stats | jsonb | YES | '{}'::jsonb | |
| preferences | jsonb | YES | '{}'::jsonb | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |
| loaded_blocks | jsonb | YES | '[]'::jsonb | |

**Importante:**
- `answer_history` es un array JSONB que guarda historial de respuestas
- `stats` contiene estadísticas del usuario (consolidación, aciertos, etc.)
- `loaded_blocks` lista de bloques cargados por el usuario

---

### 🔹 **roles** - Roles del sistema
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('roles_id_seq') | PRIMARY KEY |
| name | varchar(100) | NO | | |
| description | text | YES | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **user_roles** - Asignación de roles a usuarios
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('user_roles_id_seq') | PRIMARY KEY |
| user_id | integer | YES | | FK → users(id) |
| role_id | integer | YES | | FK → roles(id) |
| assigned_at | timestamp | YES | CURRENT_TIMESTAMP | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

## 🎮 TABLAS DE JUEGOS

### 🔹 **games** - Partidas
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('games_id_seq') | PRIMARY KEY |
| game_type | varchar(50) | NO | | |
| status | varchar(20) | YES | 'pending' | |
| config | jsonb | YES | '{}'::jsonb | |
| game_state | jsonb | YES | '{}'::jsonb | |
| created_by | integer | YES | | FK → users(id) |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

**Importante:**
- `game_type`: classic, streak, exam, lives, time_trial, by_levels, marathon, duel, trivial
- `status`: pending, in_progress, completed, cancelled
- `config`: Configuración inicial del juego (bloques seleccionados, dificultad, etc.)
- `game_state`: Estado actual del juego (para partidas activas/guardadas)

---

### 🔹 **game_players** - Jugadores en cada partida
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('game_players_id_seq') | PRIMARY KEY |
| game_id | integer | YES | | FK → games(id) |
| user_id | integer | YES | | FK → users(id) |
| player_index | integer | NO | | |
| nickname | varchar(50) | NO | | |
| joined_at | timestamp | YES | CURRENT_TIMESTAMP | |

**Importante:**
- `player_index`: Orden del jugador (0, 1, 2...) importante para juegos multiplayer
- `nickname`: Snapshot del nickname al momento de unirse

---

### 🔹 **game_scores** - Puntuaciones finales
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('game_scores_id_seq') | PRIMARY KEY |
| game_id | integer | YES | | FK → games(id) |
| game_type | varchar(50) | NO | | |
| score_data | jsonb | NO | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |

**Importante:**
- `score_data`: JSONB con toda la información de puntuación:
  ```json
  {
    "score": 85,
    "totalAnswered": 10,
    "totalQuestions": 10,
    "correct": 8,
    "incorrect": 2,
    "blank": 0,
    "timeElapsed": 120,
    "difficulty": 5,
    "blocks": [1, 2, 3]
  }
  ```

---

### 🔹 **user_game_configurations** - Configuraciones guardadas (Active Games)
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('user_game_configurations_id_seq') | PRIMARY KEY |
| user_id | integer | YES | | FK → users(id) |
| game_type | varchar(50) | NO | | |
| config | jsonb | NO | | |
| metadata | jsonb | YES | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| last_used | timestamp | YES | CURRENT_TIMESTAMP | |
| use_count | integer | YES | 1 | |

**Importante:**
- Permite guardar configuraciones de juego para reutilizar
- `use_count` incrementa cada vez que se usa la configuración

---

## 📚 TABLAS DE CONTENIDO

### 🔹 **blocks** - Bloques de preguntas
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('blocks_id_seq') | PRIMARY KEY |
| name | varchar(100) | NO | | |
| description | text | YES | | |
| is_public | boolean | YES | true | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |
| image_url | text | YES | | |
| observaciones | text | YES | | |
| user_role_id | integer | YES | | FK → user_roles(id) |
| estado_id | integer | YES | | FK → block_states(id) |
| tipo_id | integer | YES | | FK → block_types(id) |
| nivel_id | integer | YES | | FK → block_levels(id) |
| price_luminarias | integer | YES | 0 | |

---

### 🔹 **questions** - Preguntas de los bloques
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('questions_id_seq') | PRIMARY KEY |
| block_id | integer | YES | | FK → blocks(id) |
| text_question | text | NO | | |
| topic | varchar(100) | YES | | |
| difficulty | integer | YES | 1 | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |
| explanation | text | YES | | |

---

### 🔹 **answers** - Respuestas de las preguntas
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('answers_id_seq') | PRIMARY KEY |
| question_id | integer | YES | | FK → questions(id) |
| answer_text | text | NO | | |
| is_correct | boolean | YES | false | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

## 🎫 SISTEMA DE SOPORTE TÉCNICO

### 🔹 **support_tickets** - Tickets de soporte
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('support_tickets_id_seq') | PRIMARY KEY |
| user_id | integer | YES | | FK → users(id) |
| title | varchar(255) | NO | | |
| description | text | NO | | |
| status | varchar(50) | YES | 'open' | |
| priority | varchar(20) | YES | 'medium' | |
| category | varchar(100) | YES | 'general' | |
| assigned_to | integer | YES | | FK → users(id) |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |
| resolved_at | timestamp | YES | | |
| tags | ARRAY | YES | '{}' | |
| metadata | jsonb | YES | '{}' | |
| similarity_hash | varchar(32) | YES | | |
| group_id | integer | YES | | FK → support_ticket_groups(id) |
| escalated_at | timestamp | YES | | |
| escalation_reason | text | YES | | |
| assigned_agent_id | integer | YES | | |
| ticket_number | varchar(20) | YES | | |

---

### 🔹 **support_messages** - Mensajes de tickets
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('support_messages_id_seq') | PRIMARY KEY |
| ticket_id | integer | NO | | FK → support_tickets(id) |
| sender_type | varchar(10) | NO | | |
| sender_id | integer | YES | | |
| message_text | text | NO | | |
| message_type | varchar(20) | YES | 'reply' | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **support_categories** - Categorías de soporte
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('support_categories_id_seq') | PRIMARY KEY |
| name | varchar(100) | NO | | |
| description | text | YES | | |
| color | varchar(7) | YES | '#007bff' | |
| icon | varchar(50) | YES | | |
| is_active | boolean | YES | true | |
| auto_assign_to | integer | YES | | FK → users(id) |
| sla_hours | integer | YES | 24 | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **support_templates** - Plantillas de respuesta
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('support_templates_id_seq') | PRIMARY KEY |
| name | varchar(100) | NO | | |
| subject | varchar(255) | YES | | |
| content | text | NO | | |
| template_type | varchar(20) | YES | 'quick_response' | |
| is_active | boolean | YES | true | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

## 💡 SISTEMA DE LUMINARIAS (Recompensas)

### 🔹 **user_luminarias** - Balance de luminarias
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('user_luminarias_id_seq') | PRIMARY KEY |
| user_id | integer | NO | | FK → users(id) |
| current_balance | integer | YES | 200 | |
| total_earned | integer | YES | 200 | |
| total_spent | integer | YES | 0 | |
| lifetime_earnings | integer | YES | 200 | |
| last_activity | timestamp | YES | CURRENT_TIMESTAMP | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **luminarias_transactions** - Transacciones de luminarias
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('luminarias_transactions_id_seq') | PRIMARY KEY |
| user_id | integer | NO | | FK → users(id) |
| transaction_type | varchar(20) | NO | | |
| amount | integer | NO | | |
| balance_before | integer | NO | | |
| balance_after | integer | NO | | |
| user_role | varchar(20) | NO | | |
| category | varchar(50) | NO | | |
| subcategory | varchar(50) | YES | | |
| action_type | varchar(100) | NO | | |
| description | text | NO | | |
| reference_id | integer | YES | | |
| reference_type | varchar(50) | YES | | |
| metadata | jsonb | YES | '{}' | |
| from_user_id | integer | YES | | FK → users(id) |
| to_user_id | integer | YES | | FK → users(id) |
| is_validated | boolean | YES | true | |
| validated_by | integer | YES | | FK → users(id) |
| validated_at | timestamp | YES | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **luminarias_config** - Configuración del sistema
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('luminarias_config_id_seq') | PRIMARY KEY |
| category | varchar(50) | NO | | |
| subcategory | varchar(50) | NO | | |
| action_type | varchar(100) | NO | | |
| min_amount | integer | NO | 0 | |
| max_amount | integer | NO | 0 | |
| description | text | YES | | |
| is_active | boolean | YES | true | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **user_wallets** - Billeteras de usuarios
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('user_wallets_id_seq') | PRIMARY KEY |
| user_id | integer | NO | | FK → users(id) |
| balance | bigint | NO | 0 | |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP | |

---

### 🔹 **wallet_transactions** - Transacciones de billetera
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('wallet_transactions_id_seq') | PRIMARY KEY |
| user_id | integer | NO | | FK → users(id) |
| amount | bigint | NO | | |
| type | varchar(50) | NO | | |
| description | text | YES | | |
| created_at | timestamp | NO | CURRENT_TIMESTAMP | |

---

## 🏅 SISTEMA DE BADGES Y NIVELES

### 🔹 **badge_definitions** - Definiciones de insignias
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('badge_definitions_id_seq') | PRIMARY KEY |
| name | varchar(100) | NO | | |
| description | text | NO | | |
| icon | varchar(100) | YES | | |
| rarity | varchar(20) | YES | 'common' | |
| category | varchar(50) | YES | 'achievement' | |
| requirements | jsonb | YES | '{}' | |
| rewards | jsonb | YES | '{}' | |
| is_active | boolean | YES | true | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **user_badges** - Insignias de usuarios
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('user_badges_id_seq') | PRIMARY KEY |
| user_id | integer | YES | | FK → users(id) |
| badge_id | integer | YES | | FK → badge_definitions(id) |
| earned_at | timestamp | YES | CURRENT_TIMESTAMP | |
| progress | jsonb | YES | '{}' | |

---

### 🔹 **level_definitions** - Definiciones de niveles
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('level_definitions_id_seq') | PRIMARY KEY |
| level | integer | NO | | |
| name | varchar(100) | NO | | |
| description | text | YES | | |
| min_luminarias | integer | YES | 0 | |
| max_luminarias | integer | YES | | |
| benefits | jsonb | YES | '{}' | |
| icon | varchar(100) | YES | | |
| color | varchar(7) | YES | '#007bff' | |
| is_active | boolean | YES | true | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **user_levels** - Niveles de usuarios
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('user_levels_id_seq') | PRIMARY KEY |
| user_id | integer | YES | | FK → users(id) |
| current_level | integer | YES | 1 | |
| current_luminarias | integer | YES | 0 | |
| total_earned | integer | YES | 0 | |
| last_level_change | timestamp | YES | CURRENT_TIMESTAMP | |
| next_level_luminarias | integer | YES | 100 | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

## 📞 SISTEMA DE COMUNICACIONES

### 🔹 **communications** - Comunicaciones del sistema
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('communications_id_seq') | PRIMARY KEY |
| from_user_id | integer | YES | | FK → users(id) |
| to_user_id | integer | YES | | FK → users(id) |
| subject | varchar(255) | YES | | |
| message | text | NO | | |
| is_read | boolean | YES | false | |
| priority | varchar(20) | YES | 'normal' | |
| category | varchar(50) | YES | 'general' | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| read_at | timestamp | YES | | |

---

## 🔧 TABLAS AUXILIARES

### 🔹 **user_sessions** - Sesiones de usuario
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('user_sessions_id_seq') | PRIMARY KEY |
| user_id | integer | YES | | FK → users(id) |
| session_token | varchar(255) | NO | | |
| expires_at | timestamp | NO | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **admin_assignments** - Asignaciones de administradores
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('admin_assignments_id_seq') | PRIMARY KEY |
| admin_id | integer | YES | | FK → users(id) |
| assigned_user_id | integer | YES | | FK → users(id) |
| assigned_by | integer | YES | | FK → users(id) |
| assigned_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **feature_flags** - Flags de características
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| group_name | varchar(100) | NO | | |
| feature_key | varchar(150) | NO | | |
| enabled | boolean | NO | false | |
| dependencies | ARRAY | YES | '{}' | |
| rollout_percentage | integer | YES | 0 | |
| user_segments | ARRAY | YES | '{}' | |
| environment | varchar(50) | NO | 'development' | |
| scheduled_activation | timestamp with tz | YES | | |
| scheduled_deactivation | timestamp with tz | YES | | |
| created_at | timestamp with tz | NO | now() | |
| updated_at | timestamp with tz | NO | now() | |
| updated_by | uuid | YES | | |
| rollback_config | jsonb | YES | '{}' | |
| ab_test_config | jsonb | YES | '{}' | |

---

### 🔹 **system_logs** - Logs del sistema
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('system_logs_id_seq') | PRIMARY KEY |
| level | varchar(20) | YES | 'info' | |
| message | text | NO | | |
| context | jsonb | YES | '{}' | |
| user_id | integer | YES | | FK → users(id) |
| ip_address | inet | YES | | |
| user_agent | text | YES | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

### 🔹 **faq_articles** - Artículos de FAQ
| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | nextval('faq_articles_id_seq') | PRIMARY KEY |
| title | varchar(255) | NO | | |
| content | text | NO | | |
| category | varchar(100) | YES | | |
| tags | ARRAY | YES | '{}' | |
| is_published | boolean | YES | true | |
| view_count | integer | YES | 0 | |
| helpful_count | integer | YES | 0 | |
| not_helpful_count | integer | YES | 0 | |
| created_by | integer | YES | | FK → users(id) |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | |

---

## 📝 NOTAS IMPORTANTES

### Campos JSONB más usados:

**user_profiles.answer_history:**
```json
[
  {
    "questionId": 123,
    "answerId": 456,
    "isCorrect": true,
    "timestamp": "2025-10-07T15:30:00Z",
    "gameId": 789,
    "blockId": 1
  }
]
```

**user_profiles.stats:**
```json
{
  "consolidation": {
    "byBlock": {
      "1": 0.85,
      "2": 0.60
    },
    "byTopic": {
      "Matemáticas": 0.75
    }
  },
  "totalGames": 50,
  "totalScore": 4250
}
```

**games.config:**
```json
{
  "blocks": [1, 2, 3],
  "difficulty": 5,
  "timeLimit": 300,
  "questionsPerBlock": 10
}
```

**games.game_state:**
```json
{
  "currentQuestionIndex": 5,
  "answeredQuestions": [1, 2, 3, 4, 5],
  "timeElapsed": 120,
  "score": 40
}
```

---

**Fin del documento de referencia de esquema de base de datos**
