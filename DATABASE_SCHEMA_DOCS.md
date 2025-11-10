# Documentación del Esquema de Base de Datos - PLAYTEST

> Generado automáticamente el 9/11/2025, 17:16:38

---

## Resumen

- **Tablas**: 27
- **Índices**: 51
- **Triggers**: 26
- **Funciones**: 28
- **Vistas**: 4

---

## Tabla de Contenidos

### Tablas

- [admin_assignments](#tabla-admin_assignments)
- [answers](#tabla-answers)
- [blocks](#tabla-blocks)
- [conversation_settings](#tabla-conversation_settings)
- [conversations](#tabla-conversations)
- [direct_messages](#tabla-direct_messages)
- [game_players](#tabla-game_players)
- [game_scores](#tabla-game_scores)
- [games](#tabla-games)
- [incidencias](#tabla-incidencias)
- [message_attachments](#tabla-message_attachments)
- [notifications](#tabla-notifications)
- [questions](#tabla-questions)
- [roles](#tabla-roles)
- [ticket_attachments](#tabla-ticket_attachments)
- [ticket_categories](#tabla-ticket_categories)
- [ticket_messages](#tabla-ticket_messages)
- [ticket_participants](#tabla-ticket_participants)
- [tickets](#tabla-tickets)
- [typing_status](#tabla-typing_status)
- [user_loaded_blocks](#tabla-user_loaded_blocks)
- [user_luminarias](#tabla-user_luminarias)
- [user_online_status](#tabla-user_online_status)
- [user_profiles](#tabla-user_profiles)
- [user_roles](#tabla-user_roles)
- [user_sessions](#tabla-user_sessions)
- [users](#tabla-users)

### Vistas

- [direct_messages_complete](#vista-direct_messages_complete)
- [ticket_complete_info](#vista-ticket_complete_info)
- [unread_message_counts](#vista-unread_message_counts)
- [user_complete_info](#vista-user_complete_info)

### Funciones

- [auto_assign_profesor_creador](#función-auto_assign_profesor_creador)
- [auto_assign_ticket](#función-auto_assign_ticket)
- [auto_assign_ticket_to_group](#función-auto_assign_ticket_to_group)
- [auto_assign_usuario_role](#función-auto_assign_usuario_role)
- [auto_calculate_similarity_hash](#función-auto_calculate_similarity_hash)
- [auto_cleanup_cache](#función-auto_cleanup_cache)
- [auto_generate_ticket_number](#función-auto_generate_ticket_number)
- [auto_group_ticket](#función-auto_group_ticket)
- [calculate_market_metrics](#función-calculate_market_metrics)
- [calculate_student_progress_metrics](#función-calculate_student_progress_metrics)
- [check_admin_principal_registration](#función-check_admin_principal_registration)
- [cleanup_expired_cache](#función-cleanup_expired_cache)
- [cleanup_expired_typing_status](#función-cleanup_expired_typing_status)
- [create_auto_group_for_ticket](#función-create_auto_group_for_ticket)
- [detect_intervention_needs](#función-detect_intervention_needs)
- [detect_market_opportunities](#función-detect_market_opportunities)
- [escalate_tickets](#función-escalate_tickets)
- [generate_class_code](#función-generate_class_code)
- [generate_ticket_number](#función-generate_ticket_number)
- [get_integration_stats](#función-get_integration_stats)
- [get_user_luminarias_balance](#función-get_user_luminarias_balance)
- [get_user_luminarias_stats](#función-get_user_luminarias_stats)
- [notify_direct_message](#función-notify_direct_message)
- [process_automatic_escalations](#función-process_automatic_escalations)
- [update_conversation_last_message](#función-update_conversation_last_message)
- [update_integration_updated_at](#función-update_integration_updated_at)
- [update_ticket_activity](#función-update_ticket_activity)
- [update_updated_at_column](#función-update_updated_at_column)

---

## Detalle de Tablas

### Tabla: `admin_assignments`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `admin_id` | INTEGER | ✅ Sí | `-` | FK → `users.id` ON DELETE CASCADE |
| `assigned_user_id` | INTEGER | ✅ Sí | `-` | FK → `users.id` ON DELETE CASCADE |
| `assigned_by` | INTEGER | ✅ Sí | `-` | FK → `users.id` |

#### Constraints

- UNIQUE(assigned_user_id) -- Un usuario solo puede estar asignado a un admin secundario

#### Índices

- `idx_admin_assignments_admin_id` en columnas: `admin_id`
- `idx_admin_assignments_assigned_user_id` en columnas: `assigned_user_id`

---

### Tabla: `answers`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `question_id` | INTEGER | ✅ Sí | `-` | FK → `questions.id` ON DELETE CASCADE |
| `answer_text` | TEXT | ❌ No | `-` |  |
| `is_correct` | BOOLEAN | ✅ Sí | `false` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

---

### Tabla: `blocks`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `name` | VARCHAR(100) | ❌ No | `-` |  |
| `description` | TEXT | ✅ Sí | `-` |  |
| `creator_id` | INTEGER | ✅ Sí | `-` | FK → `users.id` |
| `is_public` | BOOLEAN | ✅ Sí | `true` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Triggers

- `trigger_auto_assign_profesor_creador` → ejecuta `auto_assign_profesor_creador()`

---

### Tabla: `conversation_settings`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `conversation_id` | INTEGER | ❌ No | `-` | FK → `conversations.id` ON DELETE CASCADE NOT NULL |
| `user_id` | INTEGER | ❌ No | `-` | FK → `users.id` ON DELETE CASCADE NOT NULL |
| `sound_enabled` | BOOLEAN | ✅ Sí | `true` |  |
| `desktop_notifications` | BOOLEAN | ✅ Sí | `true` |  |
| `is_muted` | BOOLEAN | ✅ Sí | `false` |  |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Constraints

- UNIQUE(conversation_id, user_id)

#### Índices

- `idx_conversation_settings_user` en columnas: `user_id`
- `idx_conversation_settings_pinned` en columnas: `is_pinned`

---

### Tabla: `conversations`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `user2_id` | INTEGER | ❌ No | `-` | FK → `users.id` ON DELETE CASCADE NOT NULL |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `last_message_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `is_archived_by_user1` | BOOLEAN | ✅ Sí | `false` |  |
| `is_archived_by_user2` | BOOLEAN | ✅ Sí | `false` |  |

#### Constraints

- CONSTRAINT unique_conversation UNIQUE (

#### Índices

- `idx_conversations_user1` en columnas: `user1_id`
- `idx_conversations_user2` en columnas: `user2_id`
- `idx_conversations_last_message` en columnas: `last_message_at DESC`
- `idx_conversations_context` en columnas: `context_type, context_id`
- `idx_conversations_active` en columnas: `is_active`

---

### Tabla: `direct_messages`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `conversation_id` | INTEGER | ❌ No | `-` | FK → `conversations.id` ON DELETE CASCADE NOT NULL |
| `recipient_id` | INTEGER | ❌ No | `-` | FK → `users.id` ON DELETE CASCADE NOT NULL |
| `message_html` | TEXT | ✅ Sí | `-` |  |
| `edited_at` | TIMESTAMP | ✅ Sí | `-` |  |
| `read_at` | TIMESTAMP | ✅ Sí | `-` |  |
| `deleted_at` | TIMESTAMP | ✅ Sí | `-` |  |

#### Índices

- `idx_direct_messages_conversation` en columnas: `conversation_id, created_at DESC`
- `idx_direct_messages_sender` en columnas: `sender_id`
- `idx_direct_messages_recipient` en columnas: `recipient_id`
- `idx_direct_messages_unread` en columnas: `recipient_id, is_read`
- `idx_direct_messages_created_at` en columnas: `created_at DESC`

#### Triggers

- `trigger_update_conversation_last_message` → ejecuta `update_conversation_last_message()`
- `trigger_notify_direct_message` → ejecuta `notify_direct_message()`

---

### Tabla: `game_players`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `game_id` | INTEGER | ✅ Sí | `-` | FK → `games.id` ON DELETE CASCADE |
| `user_id` | INTEGER | ✅ Sí | `-` | FK → `users.id` |
| `player_index` | INTEGER | ❌ No | `-` |  |
| `nickname` | VARCHAR(50) | ❌ No | `-` |  |
| `joined_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Índices

- `idx_game_players_game_id` en columnas: `game_id`
- `idx_game_players_user_id` en columnas: `user_id`

---

### Tabla: `game_scores`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `game_id` | INTEGER | ✅ Sí | `-` | FK → `games.id` ON DELETE CASCADE |
| `game_type` | VARCHAR(50) | ❌ No | `-` |  |
| `score_data` | JSONB | ❌ No | `-` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

---

### Tabla: `games`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `game_type` | VARCHAR(50) | ❌ No | `-` |  |
| `game_state` | JSONB | ✅ Sí | `'{}'` |  |
| `created_by` | INTEGER | ✅ Sí | `-` | FK → `users.id` |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Índices

- `idx_games_status` en columnas: `status`
- `idx_games_created_by` en columnas: `created_by`

---

### Tabla: `incidencias`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `tipo` | VARCHAR(50) | ❌ No | `-` |  |
| `reportado_por` | INTEGER | ✅ Sí | `-` | FK → `users.id` |
| `asignado_a` | INTEGER | ✅ Sí | `-` | FK → `users.id` |
| `resolved_at` | TIMESTAMP | ✅ Sí | `-` |  |

#### Índices

- `idx_incidencias_asignado_a` en columnas: `asignado_a`
- `idx_incidencias_tipo` en columnas: `tipo`

---

### Tabla: `message_attachments`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `message_id` | INTEGER | ✅ Sí | `-` | FK → `ticket_messages.id` ON DELETE CASCADE |
| `direct_message_id` | INTEGER | ✅ Sí | `-` | FK → `direct_messages.id` ON DELETE CASCADE |
| `upload_date` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `is_image` | BOOLEAN | ✅ Sí | `false` |  |
| `thumbnail_path` | VARCHAR(500) | ✅ Sí | `-` |  |

#### Constraints

- CONSTRAINT check_attachment_reference CHECK (

#### Índices

- `idx_message_attachments_ticket` en columnas: `ticket_id`
- `idx_message_attachments_message` en columnas: `message_id`
- `idx_message_attachments_direct_message` en columnas: `direct_message_id`
- `idx_message_attachments_uploaded_by` en columnas: `uploaded_by`

---

### Tabla: `notifications`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `user_id` | INTEGER | ❌ No | `-` | FK → `users.id` ON DELETE CASCADE NOT NULL |
| `ticket_id` | INTEGER | ✅ Sí | `-` | FK → `tickets.id` ON DELETE CASCADE |
| `message` | TEXT | ❌ No | `-` |  |
| `action_url` | VARCHAR(500) | ✅ Sí | `-` |  |
| `is_push_sent` | BOOLEAN | ✅ Sí | `false` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `read_at` | TIMESTAMP | ✅ Sí | `-` |  |

#### Índices

- `idx_notifications_user_id` en columnas: `user_id`
- `idx_notifications_is_read` en columnas: `is_read`
- `idx_notifications_created_at` en columnas: `created_at DESC`

---

### Tabla: `questions`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `block_id` | INTEGER | ✅ Sí | `-` | FK → `blocks.id` ON DELETE CASCADE |
| `text_question` | TEXT | ❌ No | `-` |  |
| `topic` | VARCHAR(100) | ✅ Sí | `-` |  |
| `difficulty` | INTEGER | ✅ Sí | `1` |  |
| `explanation` | TEXT | ✅ Sí | `-` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Índices

- `idx_questions_block_id` en columnas: `block_id`
- `idx_questions_topic` en columnas: `topic`

---

### Tabla: `roles`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `name` | VARCHAR(50) | ❌ No | `-` | UNIQUE  |
| `description` | TEXT | ✅ Sí | `-` |  |
| `hierarchy_level` | INTEGER | ❌ No | `-` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

---

### Tabla: `ticket_attachments`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `ticket_id` | INTEGER | ✅ Sí | `-` | FK → `tickets.id` ON DELETE CASCADE |
| `message_id` | INTEGER | ✅ Sí | `-` | FK → `ticket_messages.id` ON DELETE CASCADE |
| `original_name` | VARCHAR(255) | ❌ No | `-` |  |
| `file_type` | VARCHAR(100) | ❌ No | `-` |  |
| `file_size` | INTEGER | ❌ No | `-` |  |
| `file_path` | VARCHAR(500) | ❌ No | `-` |  |
| `upload_date` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `is_image` | BOOLEAN | ✅ Sí | `false` |  |
| `thumbnail_path` | VARCHAR(500) | ✅ Sí | `-` |  |

---

### Tabla: `ticket_categories`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `name` | VARCHAR(100) | ❌ No | `-` |  |
| `origin_type` | VARCHAR(20) | ❌ No | `-` |  |
| `description` | TEXT | ✅ Sí | `-` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

---

### Tabla: `ticket_messages`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `ticket_id` | INTEGER | ❌ No | `-` | FK → `tickets.id` ON DELETE CASCADE NOT NULL |
| `sender_id` | INTEGER | ❌ No | `-` | FK → `users.id` |
| `message_html` | TEXT | ✅ Sí | `-` |  |
| `read_by` | JSONB | ✅ Sí | `'{}'` |  |

#### Índices

- `idx_ticket_messages_ticket_id` en columnas: `ticket_id`
- `idx_ticket_messages_sender_id` en columnas: `sender_id`
- `idx_ticket_messages_created_at` en columnas: `created_at DESC`

#### Triggers

- `trigger_update_ticket_activity` → ejecuta `update_ticket_activity()`

---

### Tabla: `ticket_participants`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `ticket_id` | INTEGER | ❌ No | `-` | FK → `tickets.id` ON DELETE CASCADE NOT NULL |
| `user_id` | INTEGER | ❌ No | `-` | FK → `users.id` |
| `role` | VARCHAR(20) | ❌ No | `-` |  |
| `notifications_enabled` | BOOLEAN | ✅ Sí | `true` |  |

#### Constraints

- UNIQUE(ticket_id, user_id)

#### Índices

- `idx_ticket_participants_ticket_id` en columnas: `ticket_id`
- `idx_ticket_participants_user_id` en columnas: `user_id`

---

### Tabla: `tickets`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `ticket_number` | VARCHAR(20) | ❌ No | `-` | UNIQUE  |
| `assigned_to` | INTEGER | ✅ Sí | `-` | FK → `users.id` |
| `description` | TEXT | ❌ No | `-` |  |
| `priority` | VARCHAR(10) | ❌ No | `'media'` |  |
| `cerrado` | tags | ✅ Sí | `'[]'` |  |
| `metadata` | JSONB | ✅ Sí | `'{}'` |  |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `resolved_at` | TIMESTAMP | ✅ Sí | `-` |  |
| `closed_at` | TIMESTAMP | ✅ Sí | `-` |  |
| `last_activity` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `escalate_at` | TIMESTAMP | ✅ Sí | `-` |  |

#### Índices

- `idx_tickets_status` en columnas: `status`
- `idx_tickets_assigned_to` en columnas: `assigned_to`
- `idx_tickets_created_by` en columnas: `created_by`
- `idx_tickets_block_id` en columnas: `block_id`
- `idx_tickets_escalate_at` en columnas: `escalate_at`
- `idx_tickets_last_activity` en columnas: `last_activity DESC`

#### Triggers

- `trigger_auto_ticket_number` → ejecuta `auto_generate_ticket_number()`
- `trigger_auto_assign_ticket` → ejecuta `auto_assign_ticket()`

---

### Tabla: `typing_status`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `conversation_id` | INTEGER | ❌ No | `-` | FK → `conversations.id` ON DELETE CASCADE NOT NULL |
| `user_id` | INTEGER | ❌ No | `-` | FK → `users.id` ON DELETE CASCADE NOT NULL |
| `started_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Constraints

- UNIQUE(conversation_id, user_id)

#### Índices

- `idx_typing_status_conversation` en columnas: `conversation_id`
- `idx_typing_status_expires` en columnas: `expires_at`

---

### Tabla: `user_loaded_blocks`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `user_id` | INTEGER | ✅ Sí | `-` | FK → `users.id` ON DELETE CASCADE |
| `block_id` | INTEGER | ✅ Sí | `-` | FK → `blocks.id` ON DELETE CASCADE |
| `loaded_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Constraints

- UNIQUE(user_id, block_id)

#### Índices

- `idx_user_loaded_blocks_user_id` en columnas: `user_id`
- `idx_user_loaded_blocks_block_id` en columnas: `block_id`

---

### Tabla: `user_luminarias`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `user_id` | INTEGER | ✅ Sí | `-` | UNIQUE FK → `users.id` ON DELETE CASCADE UNIQUE |
| `actuales` | INTEGER | ✅ Sí | `0` |  |
| `ganadas` | INTEGER | ✅ Sí | `0` |  |
| `gastadas` | INTEGER | ✅ Sí | `0` |  |
| `abonadas` | INTEGER | ✅ Sí | `0` |  |
| `compradas` | INTEGER | ✅ Sí | `0` |  |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Índices

- `idx_user_luminarias_user_id` en columnas: `user_id`

#### Triggers

- `update_user_luminarias_updated_at` → ejecuta `update_updated_at_column()`

---

### Tabla: `user_online_status`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `user_id` | INTEGER | ✅ Sí | `-` | PRIMARY KEY FK → `users.id` ON DELETE CASCADE |
| `last_seen` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Índices

- `idx_user_online_status_online` en columnas: `is_online, last_seen DESC`

---

### Tabla: `user_profiles`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `user_id` | INTEGER | ✅ Sí | `-` | FK → `users.id` ON DELETE CASCADE |
| `answer_history` | JSONB | ✅ Sí | `'[]'` |  |
| `stats` | JSONB | ✅ Sí | `'{}'` |  |
| `preferences` | JSONB | ✅ Sí | `'{}'` |  |
| `loaded_blocks` | JSONB | ✅ Sí | `'[]'` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Triggers

- `trigger_auto_assign_usuario` → ejecuta `auto_assign_usuario_role()`

---

### Tabla: `user_roles`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `user_id` | INTEGER | ✅ Sí | `-` | FK → `users.id` ON DELETE CASCADE |
| `role_id` | INTEGER | ✅ Sí | `-` | FK → `roles.id` ON DELETE CASCADE |
| `assigned_by` | INTEGER | ✅ Sí | `-` | FK → `users.id` |
| `auto_assigned` | BOOLEAN | ✅ Sí | `false` |  |

#### Constraints

- UNIQUE(user_id, role_id)

#### Índices

- `idx_user_roles_user_id` en columnas: `user_id`
- `idx_user_roles_role_id` en columnas: `role_id`

---

### Tabla: `user_sessions`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `user_id` | INTEGER | ✅ Sí | `-` | FK → `users.id` ON DELETE CASCADE |
| `session_token` | VARCHAR(255) | ❌ No | `-` | UNIQUE  |
| `expires_at` | TIMESTAMP | ❌ No | `-` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Índices

- `idx_user_sessions_token` en columnas: `session_token`
- `idx_user_sessions_user_id` en columnas: `user_id`

---

### Tabla: `users`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ✅ Sí | `-` | PRIMARY KEY  |
| `nickname` | VARCHAR(50) | ❌ No | `-` | UNIQUE  |
| `email` | VARCHAR(100) | ✅ Sí | `-` |  |
| `password_hash` | VARCHAR(255) | ❌ No | `-` |  |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |
| `updated_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` |  |

#### Índices

- `idx_users_nickname` en columnas: `nickname`

#### Triggers

- `trigger_check_admin_principal` → ejecuta `check_admin_principal_registration()`

---

## Vistas

### Vista: `direct_messages_complete`

```sql
CREATE VIEW direct_messages_complete AS
SELECT
    dm.id,
    dm.conversation_id,
    dm.message_text,
    dm.message_html,
    dm.is_read,
    dm.read_at,
    dm.is_edited,
    dm.edited_at,
    dm.message_type,
    dm.
```

---

### Vista: `ticket_complete_info`

```sql
CREATE VIEW ticket_complete_info AS
SELECT 
    t.id,
    t.ticket_number,
    t.origin_type,
    t.title,
    t.status,
    t.priority,
    t.
```

---

### Vista: `unread_message_counts`

```sql
CREATE VIEW unread_message_counts AS
SELECT
    dm.recipient_id as user_id,
    dm.conversation_id,
    COUNT(*) as unread_count,
    MAX(dm.
```

---

### Vista: `user_complete_info`

```sql
CREATE VIEW user_complete_info AS
SELECT 
    u.id,
    u.nickname,
    u.email,
    u.
```

---

## Funciones y Procedimientos

### Función: `auto_assign_profesor_creador`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION auto_assign_profesor_creador()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si el bloque es público
    IF NEW.is_public = true THEN
        -- Verificar si el usuario ya tiene el rol de profesor_creador
        IF NOT EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = NEW.creator_id AND r.name = 'profesor_creador'
        ) THEN
            -- Asignar rol de profesor_creador
            INSERT INTO user_roles (user_id, role_id, auto_assigned)
            SELECT NEW.creator_id, r.id, true
            FROM roles r
            WHERE r.name = 'profesor_creador';
        END IF;
        
        -- Inicializar luminarias si no existen
        INSERT INTO user_luminarias (user_id)
        VALUES (NEW.creator_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `auto_assign_ticket`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION auto_assign_ticket()
RETURNS TRIGGER AS $$
DECLARE
    assigned_user_id INTEGER;
    admin_id INTEGER;
    creator_id INTEGER;
BEGIN
    -- Si es ticket global (soporte técnico)
    IF NEW.origin_type = 'global' THEN
        -- Buscar usuario con rol 'servicio_tecnico'
        SELECT u.id INTO assigned_user_id
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'servicio_tecnico'
        ORDER BY RANDOM() -- Si hay varios, asignar aleatoriamente
        LIMIT 1;
        
        -- Si no hay servicio técnico, asignar a AdminPrincipal
        IF assigned_user_id IS NULL THEN
            SELECT u.id INTO assigned_user_id
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'administrador_principal'
            LIMIT 1;
        END IF;
        
    -- Si es ticket de bloque específico
    ELSIF NEW.origin_type = 'block' AND NEW.block_id IS NOT NULL THEN
        -- Obtener el creador del bloque
        SELECT creator_id INTO assigned_user_id
        FROM blocks
        WHERE id = NEW.block_id;
        
        -- Si el creador no existe o es el mismo que reporta, asignar al admin del creador
        IF assigned_user_id IS NULL OR assigned_user_id = NEW.created_by THEN
            -- Buscar el admin asignado del creador del bloque
            SELECT b.creator_id INTO creator_id FROM blocks WHERE id = NEW.block_id;
            
            SELECT aa.admin_id INTO admin_id
            FROM admin_assignments aa
            WHERE aa.assigned_user_id = creator_id;
            
            IF admin_id IS NOT NULL THEN
                assigned_user_id := admin_id;
            ELSE
                -- Si no tiene admin asignado, usar AdminPrincipal
                SELECT u.id INTO assigned_user_id
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                JOIN roles r ON ur.role_id = r.id
                WHERE r.name = 'administrador_principal'
                LIMIT 1;
            END IF;
        END IF;
    END IF;
    
    NEW.assigned_to := assigned_user_id;
    
    -- Establecer tiempo de escalado si la categoría lo requiere
    IF EXISTS (SELECT 1 FROM ticket_categories WHERE id = NEW.category_id AND auto_escalate = true) THEN
        NEW.escalate_at := NEW.created_at + INTERVAL '24 hours';
    END IF;
    
    -- Actualizar last_activity
    NEW.last_activity := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `auto_assign_ticket_to_group`

**Parámetros**: `p_ticket_id INTEGER`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION auto_assign_ticket_to_group(p_ticket_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    ticket_hash VARCHAR(64);
    similar_group_id INTEGER;
    ticket_category INTEGER;
    group_found BOOLEAN := false;
BEGIN
    -- Obtener datos del ticket
    SELECT similarity_hash, category_id INTO ticket_hash, ticket_category
    FROM support_tickets WHERE id = p_ticket_id;
    
    -- Buscar grupo con tickets similares
    SELECT tg.id INTO similar_group_id
    FROM support_ticket_groups tg
    JOIN support_tickets t ON t.group_id = tg.id
    WHERE t.similarity_hash = ticket_hash
      AND t.category_id = ticket_category
      AND tg.group_status = 'active'
    GROUP BY tg.id
    HAVING COUNT(*) > 0
    ORDER BY tg.created_at DESC
    LIMIT 1;
    
    -- Si encontramos un grupo similar, asignar el ticket
    IF similar_group_id IS NOT NULL THEN
        UPDATE support_tickets 
        SET group_id = similar_group_id, updated_at = NOW()
        WHERE id = p_ticket_id;
        
        -- Actualizar contador del grupo
        UPDATE support_ticket_groups 
        SET total_tickets = total_tickets + 1,
            users_affected = (
                SELECT COUNT(DISTINCT user_id) 
                FROM support_tickets 
                WHERE group_id = similar_group_id
            ),
            updated_at = NOW()
        WHERE id = similar_group_id;
        
        group_found := true;
    END IF;
    
    RETURN group_found;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `auto_assign_usuario_role`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION auto_assign_usuario_role()
RETURNS TRIGGER AS $$
DECLARE
    block_creator_id INTEGER;
BEGIN
    -- Obtener el creador del bloque
    SELECT creator_id INTO block_creator_id
    FROM blocks
    WHERE id = ANY(NEW.loaded_blocks::int[]);
    
    -- Solo asignar si carga un bloque que no es suyo
    IF block_creator_id != NEW.user_id THEN
        -- Verificar si el usuario ya tiene el rol de usuario
        IF NOT EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = NEW.user_id AND r.name = 'usuario'
        ) THEN
            -- Asignar rol de usuario
            INSERT INTO user_roles (user_id, role_id, auto_assigned)
            SELECT NEW.user_id, r.id, true
            FROM roles r
            WHERE r.name = 'usuario';
        END IF;
        
        -- Inicializar luminarias si no existen
        INSERT INTO user_luminarias (user_id)
        VALUES (NEW.user_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `auto_calculate_similarity_hash`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION auto_calculate_similarity_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.similarity_hash := calculate_ticket_similarity_hash(
        NEW.subject, 
        NEW.description, 
        NEW.category_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `auto_cleanup_cache`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION auto_cleanup_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Ejecutar limpieza cada 100 inserciones
    IF (TG_OP = 'INSERT') AND (NEW.id % 100 = 0) THEN
        PERFORM cleanup_expired_cache();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `auto_generate_ticket_number`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION auto_generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `auto_group_ticket`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION auto_group_ticket()
RETURNS TRIGGER AS $$
BEGIN
    -- Intentar asignar a grupo existente
    IF NOT auto_assign_ticket_to_group(NEW.id) THEN
        -- Si no se encontró grupo similar, buscar otros tickets similares
        -- para crear un nuevo grupo
        IF (SELECT COUNT(*) FROM support_tickets 
            WHERE similarity_hash = NEW.similarity_hash 
              AND category_id = NEW.category_id 
              AND id != NEW.id
              AND group_id IS NULL) > 0 THEN
            
            -- Crear nuevo grupo automáticamente
            PERFORM create_auto_group_for_ticket(NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `calculate_market_metrics`

**Parámetros**: `creator_id_param INTEGER`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION calculate_market_metrics(creator_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    total_creators INTEGER;
    creator_rank INTEGER;
    creator_revenue DECIMAL(10,2);
    market_total_revenue DECIMAL(10,2);
BEGIN
    -- Calcular ranking de mercado
    SELECT COUNT(*) INTO total_creators FROM users WHERE id IN (
        SELECT DISTINCT creator_id FROM blocks WHERE is_public = true
    );
    
    -- Calcular revenue del creador (simulado con luminarias por ahora)
    SELECT COALESCE(actuales, 0) INTO creator_revenue 
    FROM user_luminarias WHERE user_id = creator_id_param;
    
    -- Calcular ranking basado en revenue
    SELECT COUNT(*) + 1 INTO creator_rank
    FROM user_luminarias ul
    JOIN users u ON ul.user_id = u.id
    WHERE ul.actuales > creator_revenue
    AND u.id IN (SELECT DISTINCT creator_id FROM blocks WHERE is_public = true);
    
    -- Insertar o actualizar métricas
    INSERT INTO creator_market_analytics (
        creator_id, market_rank, revenue_current_month, total_blocks, created_at
    ) VALUES (
        creator_id_param, creator_rank, creator_revenue, 
        (SELECT COUNT(*) FROM blocks WHERE creator_id = creator_id_param AND is_public = true),
        NOW()
    ) ON CONFLICT (creator_id, date_recorded) DO UPDATE SET
        market_rank = EXCLUDED.market_rank,
        revenue_current_month = EXCLUDED.revenue_current_month,
        total_blocks = EXCLUDED.total_blocks,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `calculate_student_progress_metrics`

**Parámetros**: `student_id_param INTEGER, class_id_param INTEGER`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION calculate_student_progress_metrics(student_id_param INTEGER, class_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    progress_metrics JSONB;
    attendance_rate DECIMAL(5,2);
    avg_score DECIMAL(5,2);
    completion_rate DECIMAL(5,2);
    engagement_score DECIMAL(5,2);
BEGIN
    -- Calcular tasa de asistencia
    SELECT COALESCE(
        (COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 0
    ) INTO attendance_rate
    FROM attendance_tracking
    WHERE student_id = student_id_param AND class_id = class_id_param
    AND attendance_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Calcular promedio de calificaciones
    SELECT COALESCE(AVG(percentage), 0) INTO avg_score
    FROM academic_progress
    WHERE student_id = student_id_param AND class_id = class_id_param
    AND date_completed >= CURRENT_DATE - INTERVAL '30 days';

    -- Calcular tasa de finalización
    SELECT COALESCE(
        (COUNT(CASE WHEN date_completed IS NOT NULL THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 0
    ) INTO completion_rate
    FROM academic_progress
    WHERE student_id = student_id_param AND class_id = class_id_param
    AND date_started >= CURRENT_DATE - INTERVAL '30 days';

    -- Calcular score de engagement promedio
    SELECT COALESCE(AVG(engagement_score), 0) INTO engagement_score
    FROM attendance_tracking
    WHERE student_id = student_id_param AND class_id = class_id_param
    AND attendance_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Construir JSON de métricas
    progress_metrics := jsonb_build_object(
        'attendance_rate', attendance_rate,
        'average_score', avg_score,
        'completion_rate', completion_rate,
        'engagement_score', engagement_score,
        'calculated_at', NOW()
    );

    RETURN progress_metrics;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `check_admin_principal_registration`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION check_admin_principal_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el nickname es exactamente "AdminPrincipal"
    IF NEW.nickname = 'AdminPrincipal' THEN
        -- Asignar rol de administrador_principal
        INSERT INTO user_roles (user_id, role_id, auto_assigned)
        SELECT NEW.id, r.id, true
        FROM roles r
        WHERE r.name = 'administrador_principal';
        
        -- Inicializar luminarias
        INSERT INTO user_luminarias (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `cleanup_expired_cache`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM external_data_cache 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `cleanup_expired_typing_status`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM typing_status
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `create_auto_group_for_ticket`

**Parámetros**: `p_ticket_id INTEGER`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION create_auto_group_for_ticket(p_ticket_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_group_id INTEGER;
    ticket_rec RECORD;
    group_name TEXT;
BEGIN
    -- Obtener datos del ticket
    SELECT * INTO ticket_rec FROM support_tickets WHERE id = p_ticket_id;
    
    -- Generar nombre descriptivo para el grupo
    group_name := 'Auto: ' || LEFT(ticket_rec.subject, 50) || 
                  CASE WHEN LENGTH(ticket_rec.subject) > 50 THEN '...' ELSE '' END;
    
    -- Crear nuevo grupo
    INSERT INTO support_ticket_groups (
        group_name, 
        group_description,
        common_category_id,
        total_tickets,
        users_affected,
        group_priority
    ) VALUES (
        group_name,
        'Grupo automático basado en similitud de tickets',
        ticket_rec.category_id,
        1,
        1,
        ticket_rec.priority
    ) RETURNING id INTO new_group_id;
    
    -- Asignar ticket al nuevo grupo y marcarlo como master
    UPDATE support_tickets 
    SET group_id = new_group_id, 
        is_group_master = true,
        updated_at = NOW()
    WHERE id = p_ticket_id;
    
    RETURN new_group_id;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `detect_intervention_needs`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION detect_intervention_needs()
RETURNS VOID AS $$
DECLARE
    student_record RECORD;
    intervention_criteria JSONB;
BEGIN
    -- Iterar sobre estudiantes activos
    FOR student_record IN
        SELECT DISTINCT ce.student_id, ce.class_id, tc.teacher_id
        FROM class_enrollments ce
        JOIN teacher_classes tc ON ce.class_id = tc.id
        WHERE ce.enrollment_status = 'active'
        AND tc.is_active = true
    LOOP
        -- Calcular métricas del estudiante
        SELECT calculate_student_progress_metrics(student_record.student_id, student_record.class_id)
        INTO intervention_criteria;

        -- Verificar criterios de intervención
        IF (intervention_criteria->>'attendance_rate')::DECIMAL < 75 OR
           (intervention_criteria->>'average_score')::DECIMAL < 60 OR
           (intervention_criteria->>'completion_rate')::DECIMAL < 50 OR
           (intervention_criteria->>'engagement_score')::DECIMAL < 4 THEN

            -- Crear intervención automática si no existe una activa
            INSERT INTO pedagogical_interventions (
                student_id, teacher_id, class_id, intervention_name, intervention_type,
                urgency_level, identified_issues, intervention_strategy, status
            )
            SELECT 
                student_record.student_id,
                student_record.teacher_id,
                student_record.class_id,
                'Intervención Automática - Bajo Rendimiento',
                'remedial',
                CASE 
                    WHEN (intervention_criteria->>'average_score')::DECIMAL < 40 THEN 'critical'
                    WHEN (intervention_criteria->>'attendance_rate')::DECIMAL < 50 THEN 'high'
                    ELSE 'medium'
                END,
                intervention_criteria,
                jsonb_build_object(
                    'type', 'automated_detection',
                    'recommended_actions', CASE
                        WHEN (intervention_criteria->>'attendance_rate')::DECIMAL < 75 THEN 
                            '["Contactar familia", "Revisar barreras de asistencia", "Plan de recuperación"]'::jsonb
                        WHEN (intervention_criteria->>'average_score')::DECIMAL < 60 THEN
                            '["Tutoría adicional", "Revisión de método de enseñanza", "Evaluación de comprensión"]'::jsonb
                        ELSE
                            '["Seguimiento cercano", "Refuerzo positivo", "Adaptación de estrategias"]'::jsonb
                    END
                ),
                'planned'
            WHERE NOT EXISTS (
                SELECT 1 FROM pedagogical_interventions pi
                WHERE pi.student_id = student_record.student_id
                AND pi.class_id = student_record.class_id
                AND pi.status IN ('planned', 'active')
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `detect_market_opportunities`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION detect_market_opportunities()
RETURNS VOID AS $$
DECLARE
    opportunity_record RECORD;
BEGIN
    -- Detectar nichos con poca competencia
    FOR opportunity_record IN
        SELECT 
            ka.name as area_name,
            COUNT(DISTINCT b.creator_id) as creator_count,
            COUNT(b.id) as block_count,
            AVG(COALESCE(ul.actuales, 0)) as avg_revenue
        FROM knowledge_areas ka
        LEFT JOIN blocks b ON ka.id = b.knowledge_area_id AND b.is_public = true
        LEFT JOIN user_luminarias ul ON b.creator_id = ul.user_id
        GROUP BY ka.id, ka.name
        HAVING COUNT(DISTINCT b.creator_id) < 3 AND COUNT(b.id) < 10
    LOOP
        INSERT INTO market_opportunities (
            creator_id, opportunity_type, title, description, 
            market_size_estimate, competition_level, confidence_score, urgency_level
        ) 
        SELECT 
            u.id, 'niche_gap', 
            'Oportunidad en ' || opportunity_record.area_name,
            'Área con baja competencia y potencial de crecimiento',
            100, 'low', 0.75, 'medium'
        FROM users u
        WHERE u.id IN (SELECT DISTINCT creator_id FROM blocks WHERE is_public = true)
        AND NOT EXISTS (
            SELECT 1 FROM market_opportunities mo 
            WHERE mo.creator_id = u.id 
            AND mo.title LIKE '%' || opportunity_record.area_name || '%'
            AND mo.created_at > NOW() - INTERVAL '30 days'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `escalate_tickets`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION escalate_tickets()
RETURNS INTEGER AS $$
DECLARE
    escalated_count INTEGER := 0;
    ticket_record RECORD;
    admin_id INTEGER;
BEGIN
    -- Buscar tickets que necesitan escalado
    FOR ticket_record IN
        SELECT t.id, t.assigned_to, t.created_by
        FROM tickets t
        WHERE t.escalate_at IS NOT NULL 
        AND t.escalate_at <= NOW()
        AND t.status IN ('abierto', 'en_progreso')
        AND t.escalated_to IS NULL
    LOOP
        -- Encontrar el admin asignado del usuario actual
        SELECT aa.admin_id INTO admin_id
        FROM admin_assignments aa
        WHERE aa.assigned_user_id = ticket_record.assigned_to;
        
        -- Si no tiene admin asignado, escalar al AdminPrincipal
        IF admin_id IS NULL THEN
            SELECT u.id INTO admin_id
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'administrador_principal'
            LIMIT 1;
        END IF;
        
        -- Actualizar el ticket
        UPDATE tickets 
        SET escalated_to = admin_id,
            escalate_at = NOW() + INTERVAL '24 hours' -- Próximo escalado en 24h más
        WHERE id = ticket_record.id;
        
        escalated_count := escalated_count + 1;
        
        -- Crear notificación de escalado
        INSERT INTO notifications (user_id, ticket_id, type, title, message)
        VALUES (
            admin_id,
            ticket_record.id,
            'escalation',
            'Ticket escalado',
            'Se te ha escalado un ticket que requiere atención'
        );
    END LOOP;
    
    RETURN escalated_count;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `generate_class_code`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generar código alfanumérico de 6 caracteres
        new_code := upper(substr(md5(random()::text), 1, 6));
        
        -- Verificar si ya existe
        SELECT EXISTS(SELECT 1 FROM teacher_classes WHERE class_code = new_code) INTO code_exists;
        
        -- Si no existe, retornar el código
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `generate_ticket_number`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_number TEXT;
    ticket_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT LPAD((COALESCE(MAX(
        CASE WHEN ticket_number LIKE 'SPT-' || current_year || '-%'
        THEN SUBSTRING(ticket_number FROM LENGTH('SPT-' || current_year || '-') + 1)::INTEGER
        ELSE 0 END
    ), 0) + 1)::TEXT, 6, '0')
    INTO next_number
    FROM support_tickets;
    
    ticket_number := 'SPT-' || current_year || '-' || next_number;
    
    RETURN ticket_number;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `get_integration_stats`

**Parámetros**: `integration_id_param INTEGER`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION get_integration_stats(integration_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
    total_operations INTEGER;
    successful_operations INTEGER;
    failed_operations INTEGER;
    avg_processing_time DECIMAL;
    last_sync TIMESTAMP;
BEGIN
    -- Calcular estadísticas de operaciones
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END),
        COUNT(CASE WHEN status = 'failed' THEN 1 END),
        AVG(processing_time_ms),
        MAX(completed_at)
    INTO total_operations, successful_operations, failed_operations, avg_processing_time, last_sync
    FROM sync_operations
    WHERE integration_id = integration_id_param
    AND started_at >= NOW() - INTERVAL '30 days';

    -- Construir JSON de estadísticas
    stats := jsonb_build_object(
        'total_operations', COALESCE(total_operations, 0),
        'successful_operations', COALESCE(successful_operations, 0),
        'failed_operations', COALESCE(failed_operations, 0),
        'success_rate', CASE 
            WHEN total_operations > 0 THEN 
                ROUND((successful_operations::DECIMAL / total_operations) * 100, 2)
            ELSE 0 
        END,
        'avg_processing_time_ms', COALESCE(avg_processing_time, 0),
        'last_sync', last_sync,
        'calculated_at', NOW()
    );

    RETURN stats;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `get_user_luminarias_balance`

**Parámetros**: `p_user_id INTEGER`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION get_user_luminarias_balance(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT COALESCE(current_balance, 0) INTO current_balance
    FROM user_luminarias
    WHERE user_id = p_user_id;
    
    IF current_balance IS NULL THEN
        -- Crear registro inicial si no existe
        INSERT INTO user_luminarias (user_id, current_balance, total_earned, lifetime_earnings)
        VALUES (p_user_id, 200, 200, 200);
        RETURN 200;
    END IF;
    
    RETURN current_balance;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `get_user_luminarias_stats`

**Parámetros**: `p_user_id INTEGER`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION get_user_luminarias_stats(p_user_id INTEGER)
RETURNS TABLE (
    current_balance INTEGER,
    total_earned INTEGER,
    total_spent INTEGER,
    lifetime_earnings INTEGER,
    transactions_count BIGINT,
    last_activity TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ul.current_balance,
        ul.total_earned,
        ul.total_spent,
        ul.lifetime_earnings,
        COALESCE(t.transaction_count, 0) as transactions_count,
        ul.last_activity
    FROM user_luminarias ul
    LEFT JOIN (
        SELECT user_id, COUNT(*) as transaction_count
        FROM luminarias_transactions
        WHERE user_id = p_user_id
        GROUP BY user_id
    ) t ON ul.user_id = t.user_id
    WHERE ul.user_id = p_user_id;
    
    -- Si no existe registro, crear uno inicial
    IF NOT FOUND THEN
        INSERT INTO user_luminarias (user_id) VALUES (p_user_id);
        RETURN QUERY
        SELECT 200, 200, 0, 200, 0::BIGINT, CURRENT_TIMESTAMP;
    END IF;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `notify_direct_message`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION notify_direct_message()
RETURNS TRIGGER AS $$
DECLARE
    settings_record RECORD;
    sender_name VARCHAR(100);
BEGIN
    -- Obtener configuración de notificaciones del receptor
    SELECT cs.notifications_enabled, cs.is_muted
    INTO settings_record
    FROM conversation_settings cs
    WHERE cs.conversation_id = NEW.conversation_id
    AND cs.user_id = NEW.recipient_id;

    -- Si no hay configuración, asumir que sí quiere notificaciones
    IF settings_record IS NULL THEN
        settings_record.notifications_enabled := true;
        settings_record.is_muted := false;
    END IF;

    -- Solo crear notificación si está habilitada y no muteada
    IF settings_record.notifications_enabled AND NOT settings_record.is_muted THEN
        -- Obtener nombre del remitente
        SELECT nickname INTO sender_name FROM users WHERE id = NEW.sender_id;

        -- Crear notificación
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            metadata
        ) VALUES (
            NEW.recipient_id,
            'direct_message',
            'Nuevo mensaje de ' || sender_name,
            LEFT(NEW.message_text, 100), -- Primeros 100 caracteres
            '/chat/' || NEW.conversation_id,
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'sender_id', NEW.sender_id,
                'message_id', NEW.id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `process_automatic_escalations`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION process_automatic_escalations()
RETURNS INTEGER AS $$
DECLARE
    escalated_count INTEGER := 0;
    ticket_rec RECORD;
    rule_rec RECORD;
    time_diff INTEGER;
BEGIN
    -- Recorrer tickets activos que pueden necesitar escalación
    FOR ticket_rec IN 
        SELECT * FROM support_tickets 
        WHERE status IN ('open', 'in_progress', 'waiting_user')
          AND escalation_level < 2
    LOOP
        -- Evaluar reglas de escalación
        FOR rule_rec IN 
            SELECT * FROM support_escalation_rules 
            WHERE is_active = true 
            ORDER BY priority DESC
        LOOP
            -- Verificar condición de tiempo
            time_diff := EXTRACT(EPOCH FROM NOW() - ticket_rec.created_at) / 3600;
            
            -- Evaluar si el ticket cumple las condiciones de la regla
            IF (rule_rec.conditions->>'time_hours')::INTEGER <= time_diff
               AND (rule_rec.conditions->'priorities' ? ticket_rec.priority)
            THEN
                -- Ejecutar escalación
                UPDATE support_tickets 
                SET escalation_level = escalation_level + 1,
                    escalated_at = NOW(),
                    escalation_reason = 'Escalación automática: ' || rule_rec.rule_name,
                    updated_at = NOW()
                WHERE id = ticket_rec.id;
                
                -- Registrar escalación
                INSERT INTO support_escalations (
                    ticket_id, escalation_level, escalation_reason, 
                    escalation_type, is_automatic, triggered_by_rule
                ) VALUES (
                    ticket_rec.id, ticket_rec.escalation_level + 1, 
                    'Escalación automática por ' || rule_rec.rule_name,
                    'time_based', true, rule_rec.rule_name
                );
                
                escalated_count := escalated_count + 1;
                EXIT; -- Solo aplicar una regla por ticket
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN escalated_count;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `update_conversation_last_message`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `update_integration_updated_at`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION update_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `update_ticket_activity`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION update_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tickets 
    SET last_activity = NOW(), updated_at = NOW()
    WHERE id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

### Función: `update_updated_at_column`

**Lenguaje**: plpgsql

<details>
<summary>Ver definición completa</summary>

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
```
</details>

---

## Diagrama de Relaciones

### Foreign Keys (Relaciones entre tablas)

```
admin_assignments.admin_id -> users.id [ON DELETE CASCADE]
admin_assignments.assigned_user_id -> users.id [ON DELETE CASCADE]
admin_assignments.assigned_by -> users.id
answers.question_id -> questions.id [ON DELETE CASCADE]
blocks.creator_id -> users.id
conversation_settings.conversation_id -> conversations.id [ON DELETE CASCADE NOT NULL]
conversation_settings.user_id -> users.id [ON DELETE CASCADE NOT NULL]
conversations.user2_id -> users.id [ON DELETE CASCADE NOT NULL]
direct_messages.conversation_id -> conversations.id [ON DELETE CASCADE NOT NULL]
direct_messages.recipient_id -> users.id [ON DELETE CASCADE NOT NULL]
game_players.game_id -> games.id [ON DELETE CASCADE]
game_players.user_id -> users.id
game_scores.game_id -> games.id [ON DELETE CASCADE]
games.created_by -> users.id
incidencias.reportado_por -> users.id
incidencias.asignado_a -> users.id
message_attachments.message_id -> ticket_messages.id [ON DELETE CASCADE]
message_attachments.direct_message_id -> direct_messages.id [ON DELETE CASCADE]
notifications.user_id -> users.id [ON DELETE CASCADE NOT NULL]
notifications.ticket_id -> tickets.id [ON DELETE CASCADE]
questions.block_id -> blocks.id [ON DELETE CASCADE]
ticket_attachments.ticket_id -> tickets.id [ON DELETE CASCADE]
ticket_attachments.message_id -> ticket_messages.id [ON DELETE CASCADE]
ticket_messages.ticket_id -> tickets.id [ON DELETE CASCADE NOT NULL]
ticket_messages.sender_id -> users.id
ticket_participants.ticket_id -> tickets.id [ON DELETE CASCADE NOT NULL]
ticket_participants.user_id -> users.id
tickets.assigned_to -> users.id
typing_status.conversation_id -> conversations.id [ON DELETE CASCADE NOT NULL]
typing_status.user_id -> users.id [ON DELETE CASCADE NOT NULL]
user_loaded_blocks.user_id -> users.id [ON DELETE CASCADE]
user_loaded_blocks.block_id -> blocks.id [ON DELETE CASCADE]
user_luminarias.user_id -> users.id [ON DELETE CASCADE UNIQUE]
user_online_status.user_id -> users.id [ON DELETE CASCADE]
user_profiles.user_id -> users.id [ON DELETE CASCADE]
user_roles.user_id -> users.id [ON DELETE CASCADE]
user_roles.role_id -> roles.id [ON DELETE CASCADE]
user_roles.assigned_by -> users.id
user_sessions.user_id -> users.id [ON DELETE CASCADE]
```

