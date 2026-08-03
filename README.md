# 🏢 Bodeg-IA — Arquitectura de Negocio, Roles, Matriz RBAC y Árbol de Menús (Sidebar)

Documento maestro de especificación de negocio, niveles de acceso, flujo de solicitudes de despacho 3PL, notificaciones por Telegram, seguridad y estructura detallada del menú lateral (Sidebar) para la plataforma **Bodeg-IA**.

---

## 👥 Clasificación Formal de los 6 Perfiles de Usuario (RBAC)

La plataforma distingue tres categorías de usuarios: **Internos de Plataforma**, **Externos Operativos/Empresa** y **Clientes 3PL Propietarios de Mercancía**.

```
                           ┌─────────────────────────────────────────┐
                           │      NIVELES DE ACCESO EN BODEG-IA       │
                           └────────────────────┬────────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
🔒 INTERNOS (Plataforma)             🏢 EXTERNOS (Empresa Cliente)             🛒 EXTERNOS (Cliente 3PL)
 ├─ 👑 SUPER_ADMIN                    ├─ 🏢 COMPANY_ADMIN                       └─ 👁️ CLIENT_VIEWER
 └─ 💼 PLATFORM_ADMIN                 ├─ 🏭 WAREHOUSE_MANAGER
                                      ├─ 👷 WAREHOUSE_OPERATOR
                                      └─ 📊 COMMERCIAL_MANAGEMENT
```

### 🔒 1. Usuarios Internos (Plataforma Bodeg-IA)
1. **Super Admin (`SUPER_ADMIN`)**: Control absoluto sobre la plataforma SaaS multi-tenant, facturación global, empresas clientes, auditoría de accesos a datos sensibles y Bot de Telegram.
2. **Ejecutivo de Plataforma (`PLATFORM_ADMIN`)**: Ejecutivo comercial de la plataforma (estilo ejecutivo bancario). Administra únicamente su cartola de clientes asignados (`user_company_access`).

### 🏢 2. Usuarios Externos (Empresa Cliente / Operador Logístico)
3. **Administrador de Empresa (`COMPANY_ADMIN`)**: Administrador principal de una empresa cliente. Controla la configuración de su empresa, sucursales, bodegas, tarifarios AST, usuarios internos, catálogo y clientes 3PL.
4. **Jefe de Bodega (`WAREHOUSE_MANAGER`)**: Responsable operativo y de supervisión de sus bodegas asignadas (`user_warehouse_assignments`). Aprueba solicitudes de despacho 3PL, **supervisa ex-post** las reubicaciones de stock de los bodegueros, administra casilleros y consulta tarifarios locales. No gestiona facturación de la empresa ni usuarios fuera de sus bodegas.
5. **Bodeguero / Operador (`WAREHOUSE_OPERATOR`)**: Usuario operativo en terreno. Accede al mapa 2D, ejecuta recepción (Inbound), reubicación directa (Relocate) y despachos aprobados (Outbound). **Strictly No-Financial**: No accede a costos ni tarifas.
6. **Gestión / Comercial (`COMMERCIAL_MANAGEMENT`)**: Usuario comercial y financiero. Administra tarifarios de costo de almacenamiento, volumen $m^3$, liquidaciones de cobro a clientes 3PL, simuladores de cotización en memoria y onboarding de clientes 3PL. No realiza movimientos físicos de stock.

### 🛒 3. Usuarios Externos (Propietarios de Mercancía / Cliente 3PL Final)
7. **Portal Cliente 3PL (`CLIENT_VIEWER`)**: Dueño real de la mercancía almacenada (`client_owner_id`). Portal de autoservicio para consultar su stock en custodia, volumen ocupado en $m^3$, **emitir Solicitudes de Despacho (`dispatch_requests`)**, revisar el Kardex de sus productos y descargar detalles de su facturación por almacenaje.

---

## 📦 Flujo de Solicitudes de Despacho 3PL & Notificaciones Push

```
┌─────────────────────────┐      1. Solicita Despacho      ┌──────────────────────────┐
│  CLIENT_VIEWER (3PL)    ├───────────────────────────────►│    dispatch_requests     │
└─────────────────────────┘                                │    (Status: PENDING)     │
                                                           └────────────┬─────────────┘
                                                                        │
                                                               2. Alerta Push Telegram + Badge
                                                                        │
                                                                        ▼
┌─────────────────────────┐      3. Revisa y Aprueba       ┌──────────────────────────┐
│ WAREHOUSE_MANAGER /     ├───────────────────────────────►│    dispatch_requests     │
│ COMPANY_ADMIN           │                                │    (Status: APPROVED)    │
└─────────────────────────┘                                └────────────┬─────────────┘
                                                                        │
                                                               4. Orden de Despacho
                                                                        │
                                                                        ▼
┌─────────────────────────┐      5. Ejecuta Salida Física  ┌──────────────────────────┐
│ WAREHOUSE_OPERATOR      ├───────────────────────────────►│   inventory_movements    │
│ (Bodeguero en Terreno)  │                                │   (OUTBOUND / FULFILLED) │
└─────────────────────────┘                                └──────────────────────────┘
```

### 1. Modelo de Datos `dispatch_requests`
Para separar la solicitud pendiente del hecho físico ya ejecutado (`inventory_movements`), se implementa la tabla `dispatch_requests`:
* **Campos:** `id`, `company_id`, `client_owner_id`, `product_id`, `requested_quantity`, `status` (`PENDING`, `APPROVED`, `FULFILLED`, `REJECTED`), `requested_at`, `approved_by_user_id`, `fulfilled_movement_id`, `rejection_reason`, `notes`.

### 2. Motor de Notificaciones Automáticas por Telegram
Cuando un Cliente 3PL emite una nueva solicitud de despacho (`PENDING`):
* **Notificación Push de Telegram:** El bot de Bodeg-IA envía instantáneamente una alerta al Jefe de Bodega y Admin Empresa asignados: *"📩 Nueva Solicitud de Despacho #1042 — Cliente: Frutas del Cachapoal | SKU: HAR-IND-25 (50 cajas). Ingresa al portal para aprobar"*.
* **Badge de Notificación en Sidebar:** Muestra un contador rojo `[3]` en la opción `Solicitudes de Despacho Pendientes` del menú lateral.

---

## ⚡ Reglas de Negocio, Supervisión vs Aprobación & Seguridad

### 🏭 1. Aclaración de Flujos: Supervisión Ex-Post vs Aprobación Previa
* **Reubicaciones entre Casilleros (Relocate):** **Acción Directa + Supervisión Ex-Post**. Para mantener la agilidad en terreno, el Bodeguero mueve pallets libremente en tiempo real. El Jefe de Bodega **supervisa y audita ex-post** los movimientos desde su dashboard sin bloquear la operación diaria.
* **Despachos de Mercancía (Outbound):** **Aprobación Previa Obligatoria**. Todo despacho hacia el cliente final o transporte requiere que una solicitud (`dispatch_requests`) haya sido previamente aprobada (`APPROVED`) por el Jefe de Bodega o Admin Empresa antes de que el Bodeguero ejecute la salida física.

### ✉️ 2. Onboarding del Cliente 3PL ("Invitar a Portal")
En los módulos de *Clientes 3PL* del Admin Empresa y Gestión Comercial, cada ficha de cliente 3PL incluye el botón **"✉️ Invitar a Portal 3PL"**:
* Genera un enlace de invitación seguro por correo electrónico para que el representante del cliente configure su cuenta con rol `CLIENT_VIEWER`.

### 🏢 3. Un mismo Cliente 3PL con Múltiples Operadores Logísticos (Limitación Conocida MVP)
* **Limitación del Modelo MVP:** El modelo de datos ata la ficha `clients` a una única `company_id` de un operador logístico. Si una empresa dueña de mercancía guarda stock con dos operadores distintos usarios de Bodeg-IA, operará con dos cuentas `CLIENT_VIEWER` independientes (delimitación aceptada para el MVP).

### ⏳ 4. Política de Fin de Contrato con Cliente 3PL (Acceso Histórico 90 Días)
* Cuando la relación comercial con un cliente 3PL finaliza, la cuenta no se elimina de inmediato.
* **Estado `READ_ONLY_HISTORICAL_90_DAYS`:** Durante **90 días**, el acceso del cliente pasa a modo solo lectura histórica para que pueda revisar facturas pasadas, descargar reportes Kardex y resolver eventuales disputas de cobro antes de la desactivación total.

### 🔒 5. Seguridad Reforzada para el Portal `CLIENT_VIEWER`
Debido a que los usuarios `CLIENT_VIEWER` son actores externos a la organización:
* **Expiración de Sesión Corta:** Tokens JWT con validez máxima de **4 horas** (vs 24 horas de usuarios internos).
* **Cierre Automático por Inactividad:** Cierre de sesión automático tras **15 minutos de inactividad**.
* **Auditoría de Acceso a Facturación:** Auditoría de IP y trazabilidad en peticiones a liquidaciones.

### 🛡️ 6. Auditoría de Datos Sensibles de Tenants & Límites SaaS
* **Registro Inmutable `tenant_access_audit_logs`:** Registra cada consulta de usuarios internos (`SUPER_ADMIN` / `PLATFORM_ADMIN`) a tarifarios y datos financieros de clientes.
* **Enforcement de Límites SaaS:** Intercepta peticiones con `HTTP 402` (`PLAN_LIMIT_EXCEEDED`) si se superan las bodegas, usuarios o m³ del plan contratado, desplegando la modal de Upsell en Frontend.
* **Bloqueo de Downgrade:** Se exige reducir los recursos activos antes de procesar un downgrade a un plan con menores capacidades.
* **PIN Telegram Seguro:** Códigos de 6 dígitos con expiración estricta de **10 minutos** y máximo **3 intentos fallidos**.
* **Simulador de Cotizaciones:** Herramienta **puramente en memoria (Read-Only)** que no altera la base de datos.

---

## 🌳 Estructura Detallada del Menú Lateral (Sidebar) por Rol

---

### 👑 1. SIDEBAR: SUPER ADMIN (Interno - Plataforma Global)

-> Home / Dashboard Global
--> Descripción: Vista principal consolidada de la plataforma SaaS Bodeg-IA. Muestra métricas de alto nivel: total de empresas clientes activas, total de bodegas registradas en la plataforma, volumen total de almacenamiento en m³, ingresos recurrentes mensuales (MRR SaaS), estado de salud de los servidores de backend y PostgreSQL, y alertas globales de sistema.

-> Clientes / Empresas SaaS
--> Listado General de Empresas
---> Descripción: Muestra el catálogo completo de todas las empresas clientes registradas en la plataforma SaaS. Permite filtrar por estado (Activa, Suspendida, Demo), plan contratado y fecha de registro. Al hacer clic en una empresa, permite navegar a su ficha detallada: usuarios asignados, sucursales, bodegas registradas, volumen ocupado, suscripción activa e historial de pagos.
--> Alta de Nueva Empresa
---> Descripción: Formulario para registrar una nueva empresa en el sistema SaaS. Permite ingresar nombre de la empresa, RUT/Tax ID, dirección corporativa, teléfono de contacto, plan asignado y crear la cuenta del usuario Administrador principal de la empresa.
--> Cartolas y Asignación de Ejecutivos
---> Descripción: Herramienta de gestión para asignar empresas clientes a los Ejecutivos de Cuenta internos (Admin Plataforma). Muestra qué empresas están bajo la tutela de cada ejecutivo y permite reasignar carteras de clientes registrando la auditoría en `executive_portfolio_history`.

-> Planes & Suscripciones SaaS
--> Catálogo de Planes & Limites
---> Descripción: Gestión del tarifario del SaaS (Planes BASIC, PRO, ENTERPRISE). Permite crear y modificar planes definiendo precio mensual en CLP/USD, límite de bodegas permitidas (`max_warehouses`), límite de usuarios activos (`max_users`), capacidad máxima de almacenamiento en m³ (`max_storage_m3`) y reglas de bloqueo por exceso.
--> Suscripciones & Facturación Global
---> Descripción: Monitoreo de todas las suscripciones activas y vencidas de las empresas clientes. Muestra renovaciones automáticas, histórico de facturas de cobro SaaS y alertas de empresas con pagos pendientes.

-> Infraestructura & Jerarquía Global
--> Red Global de Bodegas
---> Descripción: Mapa y tabla que consolida todas las sucursales y bodegas físicas existentes en la plataforma a nivel nacional. Muestra métricas de capacidad máxima en m³, ocupación actual %, cantidad de casilleros/posiciones 2D y empresa propietaria de cada bodega.
--> Auditoría Global de Ocupación
---> Descripción: Visor de mapas de calor globales que muestra el nivel de uso del espacio en m³ de toda la infraestructura disponible en la plataforma para análisis de expansión de capacidad.

-> Motor AST & Parámetros Globales
--> Configuración del Motor de Costos
---> Descripción: Ajustes del parser matemático de evaluación de fórmulas AST (mathjs sandbox). Define variables globales del sistema, multiplicadores por defecto de tasa de rotación (HIGH, MEDIUM, LOW) y límites de seguridad para el cálculo de tarifas por repisa/día.

-> Gestión de Usuarios Internos
--> Listado de Personal Interno
---> Descripción: Gestión de usuarios pertenecientes al equipo interno de Bodeg-IA (Super Admins, Ejecutivos comerciales, Soporte técnico). Permite crear cuentas, restablecer contraseñas y revocar acceso a sesiones activas.
--> Roles y Permisos Globales
---> Descripción: Configuración de la matriz de permisos JSONB del sistema para los roles internos de la plataforma.

-> Bot de Telegram & Asistente IA
--> Estado & Configuración del Bot
---> Descripción: Panel de control de la integración con el Bot de Telegram de IA. Muestra el estado del webhook de Telegram, tokens de API, logs de mensajes procesados, intenciones consultadas por usuarios en terreno y tasa de éxito en la identificación de productos.
--> Registro de Dispositivos & Usuarios Telegram
---> Descripción: Muestra las cuentas de Telegram y teléfonos vinculados a usuarios del sistema mediante código PIN temporal de 10 minutos para consultas directas desde terreno.

-> Auditoría, Seguridad & Access Logs
--> Audit Log de Acceso a Datos de Tenants
---> Descripción: Registro inmutable de seguridad que audita cada acceso de Super Admins o Ejecutivos a las fichas financieras o tarifarios de empresas clientes (`tenant_access_audit_logs`), garantizando trazabilidad en auditorías Enterprise.
--> Trace ID & Logs de Peticiones
---> Descripción: Registros en tiempo real de todas las peticiones HTTP procesadas por el middleware de Trace ID (`x-trace-id`). Muestra latencia en ms, IP de origen, status HTTP (200, 401, 403, 500) y controlador ejecutado.
--> Historial de Cambios & Revocaciones
---> Descripción: Registro de auditoría de seguridad que detalla qué usuario realizó cambios en empresas, perfiles de costo o cuándo se revocaron sesiones en `user_sessions`.

-> Configuración Plataforma
--> Parámetros Generales
---> Descripción: Configuración de la marca de la plataforma (logos, nombre Bodeg-IA, correos transaccionales), políticas de expiración de JWT y límites de Rate Limiting.

---

### 💼 2. SIDEBAR: EJECUTIVO DE PLATAFORMA (Interno - Cartola de Clientes)

-> Home / Mi Cartola
--> Descripción: Vista principal personalizada para el Ejecutivo Comercial. Muestra las métricas consolidadas exclusivamente de su cartera de clientes asignada: cantidad de empresas en su cartola, total de bodegas bajo su supervisión, volumen total en m³ de sus clientes, volumen ocupado %, e ingresos por renovaciones SaaS.

-> Mis Clientes (Cartola Asignada)
--> Listado de Mi Cartera
---> Descripción: Muestra el listado de las empresas clientes asignadas bajo la tutela de este ejecutivo. Al seleccionar una empresa, el ejecutivo puede navegar a la ficha completa de ese cliente para ver sus sucursales, bodegas y usuarios administradores. Cada ingreso a datos financieros genera un registro en `tenant_access_audit_logs`.
--> Detección de Oportunidades de Upselling
---> Descripción: Reporte inteligente que identifica empresas de su cartera que están alcanzando el 85%+ del límite de bodegas, usuarios o almacenamiento m³ de su plan actual, permitiendo al ejecutivo proponer una actualización al Plan PRO o ENTERPRISE.

-> Supervisión de Bodegas & Capacidad
--> Bodegas de Mi Cartera
---> Descripción: Listado de todas las bodegas pertenecientes a los clientes de su cartera. Muestra el porcentaje de ocupación en m³, cantidad de casilleros libres/ocupados y desglose por zonas.
--> Consulta de Ocupación por Cliente
---> Descripción: Reporte detallado que analiza cómo cada empresa cliente está utilizando el volumen contratado de almacenamiento en sus bodegas.

-> Asistencia en Tarifarios & Costos
--> Visor de Perfiles de Costo
---> Descripción: Permite al ejecutivo consultar los perfiles de costo y fórmulas AST configuradas en las bodegas de sus clientes para verificar que las tarifas por día/zona estén correctamente aplicadas.
--> Simulador de Cotizaciones (Puro en Memoria)
---> Descripción: Herramienta de cálculo puro en memoria para simular propuestas de cobro de bodegaje para los clientes de su cartera, ingresando volumen en m³, días de estancia y factores de temporada para presentar cotizaciones comerciales sin crear registros persistentes.

-> Bot de Telegram & Consultas
--> Monitoreo de Consultas de Mi Cartera
---> Descripción: Muestra las consultas en lenguaje natural realizadas a través del Bot de Telegram por los usuarios de las empresas pertenecientes a su cartola de clientes.

-> Mi Perfil
--> Configuración de Cuenta
---> Descripción: Ajustes personales del ejecutivo, cambio de contraseña, correo electrónico de contacto y teléfono para notificaciones.

---

### 🏢 3. SIDEBAR: ADMINISTRADOR DE EMPRESA (Externo - Empresa Cliente)

-> Home / Dashboard Empresa
--> Descripción: Vista de mando de la empresa cliente. Muestra indicadores de rendimiento clave (KPIs): uso actual de límites del plan (ej. 2/3 Bodegas, 8/15 Usuarios, 450/2000 m³ ocupados), sucursales activas, bodegas propias, solicitudes de despacho pendientes, porcentaje de ocupación promedio, total de productos en catálogo, stock total e historial de movimientos del día.

-> Estructura Física & Bodegas
--> Sucursales
---> Descripción: Gestión de las sucursales de la empresa (ej. Sucursal Pudahuel, Sucursal San Bernardo). Permite crear y editar sucursales especificando nombre, dirección física y teléfono de contacto.
--> Bodegas
---> Descripción: Listado de bodegas asociadas a cada sucursal. Permite crear nuevas bodegas (con validación previa contra el límite `max_warehouses` del plan contratado), habilitar o deshabilitar el seguimiento de costos por espacio (`is_cost_tracking_enabled`) y definir parámetros operativos.
--> Diseñador Espacial & Jerarquía (Zonas, Pasillos, Repisas)
---> Descripción: Herramienta de gestión para estructurar la jerarquía física de cada bodega. Permite crear Zonas (definiendo tasa de rotación HIGH, MEDIUM, LOW), Pasillos, Repisas (Racks 2D) especificando su posición en grilla `position_x`, `position_y`, Niveles y Casilleros de almacenamiento (`storage_locations`) fijando capacidad máxima en m³ y peso en kg.
--> Plano 2D Interactivo de Bodegas
---> Descripción: Visualizador gráfico interactivo en 2D de las repisas y casilleros de la bodega. Muestra un mapa de calor visual según el nivel de llenado del casillero (Disponible/Verde, Parcial/Amarillo, Lleno/Rojo) y permite ver el stock almacenado en cada posición al hacer clic.

-> Solicitudes de Despacho 3PL (Aprobación & Notificaciones)
--> Solicitudes Pendientes [Badge Counter]
---> Descripción: Panel de revisión de solicitudes de despacho enviadas por clientes 3PL (`dispatch_requests` en estado `PENDING`). Muestra la mercancía requerida, cliente solicitante y permite Aprobar (`APPROVED`) o Rechazar (`REJECTED` especificando motivo), enviando una notificación push al cliente.
--> Historial de Solicitudes Despachadas
---> Descripción: Registro de todas las solicitudes de despacho procesadas, indicando quién las aprobó y el movimiento Kardex de salida asociado.

-> Tarifario & Motor de Costos AST
--> Perfiles de Costo (Zonas / Repisas / Niveles)
---> Descripción: Configuración del cobro por espacio de almacenamiento en la bodega. Permite definir el costo base diario por m³, multiplicador de rotación, costos fijos de mantenimiento/energía diarios y asociarlo mediante la regla de Arco Exclusivo (exactamente a una Zona, Repisa o Nivel).
--> Editor de Fórmulas Dinámicas AST
---> Descripción: Herramienta avanzada para crear fórmulas de cobro personalizadas escritas en lenguaje sintáctico AST (ej. `(base * turnover + energy) * seasonal`). Permite probar la fórmula antes de guardarla.
--> Simulador de Cobros de Almacenaje (Puro en Memoria)
---> Descripción: Calculadora interactiva pura en memoria que permite ingresar volumen ocupado en m³, cantidad de días y zona elegida para calcular al instante el costo total estimado a cobrar por el bodegaje.
--> Historial de Cambios Tarifarios
---> Descripción: Registro de auditoría que guarda cada modificación realizada a los perfiles de costo en `cost_history`, mostrando costo anterior, costo nuevo, usuario que lo cambió y la justificación del ajuste.

-> Inventario & Control de Stock
--> Listado de Existencias (Stock Físico)
---> Descripción: Vista general de todos los items almacenados en las bodegas de la empresa. Muestra SKU, producto, cliente propietario 3PL, casillero exacto donde reside, cantidad, lote, fecha de vencimiento y volumen m³ ocupado.
--> Ingreso de Stock (Inbound)
---> Descripción: Formulario operativo para recibir nueva mercancía en la bodega. Requiere seleccionar el producto, casillero de destino (con validación automática de volumen disponible en m³), cantidad, lote y cliente propietario. Al registrar, genera automáticamente la entrada en el Kardex.
--> Reubicación de Stock (Relocate)
---> Descripción: Herramienta para transferir mercancía de un casillero a otro dentro de la bodega. Actualiza en tiempo real los volúmenes m³ ocupados tanto en el casillero origen como en el destino y registra el movimiento de reubicación en el Kardex.
--> Salida / Despacho (Outbound)
---> Descripción: Formulario para registrar la salida de mercancía vinculada a una solicitud previamente aprobada (`APPROVED`). Libera volumen m³ en el casillero de origen y descuenta las existencias en inventario registrando el movimiento de salida en el Kardex.
--> Kardex de Movimientos (Histórico & Auditoría)
---> Descripción: Registro cronológico e inmutable de todos los movimientos de inventario realizados en la empresa. Muestra fecha/hora, tipo de movimiento (INBOUND, RELOCATION, OUTBOUND), casillero origen, casillero destino, producto, cantidad y usuario que ejecutó la operación.

-> Catálogo & Clientes 3PL
--> Catálogo de Productos (SKUs)
---> Descripción: Gestión del catálogo maestro de productos de la empresa. Permite crear y editar SKUs, especificando nombre, descripción, peso unitario en kg, volumen unitario en m³ y si el producto requiere paletizado.
--> Clientes 3PL & Onboarding Portal
---> Descripción: Registro de los clientes externos a quienes la empresa presta servicios de bodegaje 3PL. Incluye el botón **"✉️ Invitar a Portal 3PL"** para crear credenciales de acceso `CLIENT_VIEWER` y enviar la invitación por correo.

-> Usuarios, Permisos & Plan SaaS
--> Gestión de Usuarios de la Empresa
---> Descripción: Administración de las cuentas de usuario de la empresa (Jefes de Bodega, Bodegueros, Ejecutivos Comerciales). Valida previamente contra el límite `max_users` del plan. Permite asignar roles, activar/desactivar cuentas y restablecer claves.
--> Asignación de Bodegas por Usuario
---> Descripción: Mapeo de permisos por bodega (`user_warehouse_assignments`). Permite restringir a un Jefe de Bodega o Bodeguero para que solo pueda ver u operar en las bodegas explícitamente asignadas.
--> Mi Plan SaaS & Estado de Suscripción
---> Descripción: Muestra el plan SaaS actual contratado (BASIC, PRO, ENTERPRISE), el porcentaje consumido de los límites (bodegas, usuarios, m³) y permite solicitar un Upgrade de plan directamente a su Ejecutivo de Plataforma.

-> Bot de Telegram IA
--> Vinculación de Cuentas Telegram (Código PIN)
---> Descripción: Generador de códigos PIN temporales (expiración estricta de 10 minutos, máximo 3 intentos fallidos) para que el personal de la empresa pueda vincular su cuenta de Telegram al sistema Bodeg-IA.
--> Historial de Consultas de Terreno
---> Descripción: Visor de preguntas realizadas al Bot de Telegram por el personal de la empresa en terreno.

---

### 🏭 4. SIDEBAR: JEFE DE BODEGA (`WAREHOUSE_MANAGER` - Supervisión Operativa de Bodega)

-> Home / Mi Bodega Asignada
--> Descripción: Panel de control de la bodega asignada al Jefe de Bodega (`user_warehouse_assignments`). Muestra ocupación en m³ de la bodega, casilleros disponibles, **solicitudes de despacho pendientes de aprobación**, alertas de sobrecapacidad, movimientos del día y productos próximos a vencer.

-> Estructura & Ocupación de Mi Bodega
--> Plano 2D de Mi Bodega
---> Descripción: Mapa gráfico 2D interactivo de la bodega bajo su mando. Permite inspeccionar repisas, casilleros y ver el nivel de ocupación en m³ en tiempo real.
--> Gestión de Casilleros & Posiciones
---> Descripción: Administración local de los casilleros de la bodega asignada. Permite marcar casilleros en mantenimiento o ajustar peso máximo permitido en kg.

-> Solicitudes de Despacho 3PL (Aprobación & Notificaciones)
--> Aprobación de Despachos Pendientes [Badge Counter]
---> Descripción: Módulo de revisión de solicitudes de despacho emitidas por clientes 3PL para su bodega. Permite validar stock y Aprobar (`APPROVED`) o Rechazar (`REJECTED`), disparando la notificación instantánea por Telegram al cliente.

-> Tarifas & Costos de Mi Bodega (Solo Lectura)
--> Consulta de Tarifario de Mi Bodega
---> Descripción: Muestra los perfiles de costo AST aplicados a las zonas y repisas de su bodega asignada. A diferencia del bodeguero, el Jefe de Bodega **SÍ puede consultar las tarifas** de su bodega para coordinar la optimización del espacio, pero **no puede modificar** la estructura tarifaria financiera de la empresa.

-> Operaciones de Inventario & Supervisión
--> Gestión de Ingresos (Inbound)
---> Descripción: Control y registro de recepciones de mercancía que ingresan a su bodega.
--> Supervisión y Auditoría de Reubicaciones (Relocate)
---> Descripción: Visor de supervisión y auditoría ex-post de los movimientos de mercancía entre casilleros realizados libremente por los bodegueros en terreno. Permite auditar qué bodeguero movió cada pallet sin generar cuellos de botella operativos.
--> Ejecución de Despachos Aprobados (Outbound)
---> Descripción: Control de salidas de productos cuya solicitud ya ha sido autorizada previamente.
--> Kardex de Mi Bodega
---> Descripción: Historial filtrado de movimientos de inventario ocurridos exclusivamente en su bodega asignada.

-> Bot de Telegram & Terreno
--> Vinculación Telegram Personal
---> Descripción: Generación de PIN temporal de 10 minutos para vincular su Telegram al asistente virtual de bodega para recibir notificaciones push instantáneas de nuevas solicitudes de despacho.

---

### 📦 5. SIDEBAR: BODEGUERO / OPERADOR (`WAREHOUSE_OPERATOR` - Terreno & Operaciones Físicas)

-> Home / Operación Diaria
--> Descripción: Vista simplificada para el trabajador de bodega en terreno. Muestra accesos directos rápidos a recepción de mercancía, consulta de ubicación de productos, reubicaciones y tareas asignadas. **Strictly No-Financial**: No muestra ningún valor monetario ni tarifas.

-> Ubicación & Mapa 2D
--> Plano 2D de Mi Bodega (Vista Operativa)
---> Descripción: Visualización interactiva en 2D de la bodega asignada al operador. Permite navegar por repisas y ver visualmente qué casilleros están llenos o disponibles y qué productos están ubicados en cada posición.
--> Búsqueda Rápida de Ubicación (SKU / Producto)
---> Descripción: Buscador de respuesta inmediata para terreno. El operador ingresa un código SKU o nombre de producto y la herramienta devuelve la ruta física jerárquica exacta para ir a buscarlo (*Ejemplo: Zona A > Pasillo 01 > Repisa REP-A1 > Nivel 2 > Casillero A1-N2-POS1*).

-> Operaciones de Inventario en Terreno
--> Recepción de Mercancía (Inbound)
---> Descripción: Formulario rápido optimizado para tablets/móviles para ingresar productos a la bodega, asignándoles casillero con validación de volumen m³ disponible, lote y vencimiento.
--> Reubicación de Mercancía Directa (Relocate)
---> Descripción: Herramienta de terreno para mover pallets o cajas de un casillero a otro libremente en tiempo real, seleccionando origen y destino. Queda registrado para auditoría ex-post del Jefe de Bodega.
--> Despacho de Órdenes Aprobadas (Outbound)
---> Descripción: Lista de despachos cuya solicitud ya ha sido aprobada por el Jefe de Bodega. Muestra la ubicación de los casilleros de donde retirar el producto para su entrega al transporte.

-> Asistente Telegram IA (En Terreno)
--> Vinculación Telegram
---> Descripción: Muestra el código PIN único de 6 dígitos (10 min de expiración) para vincular la cuenta de Telegram del teléfono personal o corporativo del operador al bot de Bodeg-IA.
--> Guía de Comandos y Consultas de Voz
---> Descripción: Ejemplos de preguntas en lenguaje natural que el operador puede hacerle al Bot de Telegram mientras trabaja en la bodega (*ej. "¿En qué pasillo está la Harina 25kg?"*).

---

### 📊 6. SIDEBAR: GESTIÓN / COMERCIAL (`COMMERCIAL_MANAGEMENT` - Ventas, Costos & 3PL)

-> Home / Resumen Comercial
--> Descripción: Panel de control financiero y comercial para la empresa cliente. Muestra ingresos proyectados por cobro de bodegaje a terceros 3PL, evolución de m³ ocupados por cliente en el tiempo, productos con mayor rotación y resumen de solicitudes de despacho.

-> Clientes 3PL & Facturación de Bodegaje
--> Cartera de Clientes 3PL & Onboarding
---> Descripción: Listado de clientes propietarios a quienes la empresa les almacena mercancía. Muestra volumen m³ ocupado por cada cliente 3PL y botón **"✉️ Invitar a Portal 3PL"** para habilitar accesos `CLIENT_VIEWER`.
--> Liquidación de Cobro por Almacenaje 3PL
---> Descripción: Informe consolidado que liquida el costo de almacenamiento por cliente 3PL para un período dado. Múltiplica los m³ ocupados por día por la tarifa del perfil de costo AST correspondiente para generar la factura o detalle de cobro.

-> Tarifario AST & Simulación
--> Consulta de Tarifas por Zona
---> Descripción: Visor de los perfiles de costo vigentes en la bodega (costos diarios base por m³, multiplicadores de rotación y costos de energía).
--> Simulador de Cotizaciones Comerciales (Puro en Memoria)
---> Descripción: Calculadora comercial pura en memoria para cotizar a nuevos clientes 3PL el costo de almacenar cierta cantidad de m³ o pallets durante un período estimado de días sin crear registros persistentes en la base de datos.

-> Catálogo de Productos & Rotación
--> Catálogo Maestro de SKUs
---> Descripción: Consulta y administración del catálogo de productos (pesos, volúmenes m³, dimensiones y requerimientos de paletizado).
--> Reporte de Rotación y Velocidad de Pasillo
---> Descripción: Análisis de rotación de existencias por repisa/zona. Identifica qué pasillos o áreas tienen alta rotación (HIGH turnover) o almacenamiento estancado (LOW turnover) para sugerir ajustes en las tarifas de cobro.

-> Reportes & Exportación
--> Reporte de Ocupación m³
---> Descripción: Gráficos de tendencias de capacidad utilizada vs. disponible en las bodegas de la empresa. Exportable a Excel y PDF.
--> Reporte Kardex Comercial
---> Descripción: Exportación auditorable de todos los movimientos de entradas y salidas ordenados por cliente 3PL para respaldos de facturación.

---

### 🛒 7. SIDEBAR: PORTAL CLIENTE 3PL (`CLIENT_VIEWER` - Dueño de Mercancía)

-> Home / Mi Stock en Custodia
--> Descripción: Portal de autoservicio exclusivo para el cliente 3PL propietario de la mercancía (`client_owner_id`). Muestra resumen de su stock total almacenado, volumen ocupado en m³ en las bodegas del operador 3PL, estado de solicitudes de despacho recientes y resumen de cobro de almacenamiento del mes. *(Sesión segura de 4h con auto-bloqueo tras 15 min de inactividad)*.

-> Solicitudes de Despacho (Outbound 3PL)
--> Emitir Nueva Solicitud de Despacho
---> Descripción: Formulario para que el cliente 3PL solicite el retiro o envío de sus productos almacenados. Crea un registro en `dispatch_requests` en estado `PENDING` y dispara una notificación push por Telegram al Jefe de Bodega del operador.
--> Seguimiento de Mis Solicitudes [Badge Status]
---> Descripción: Panel para monitorear el estado en tiempo real de sus solicitudes (`PENDING` -> `APPROVED` -> `FULFILLED` o `REJECTED` con motivo de rechazo).

-> Mis Existencias & Productos
--> Listado de Mi Inventario
---> Descripción: Vista detallada de los productos de su propiedad guardados en la bodega 3PL. Muestra SKU, nombre de producto, cantidad disponible, lotes, fechas de vencimiento y casillero/bodega asignada.
--> Ubicación de Mi Stock
---> Descripción: Consulta de la bodega y zona donde se encuentra almacenado cada uno de sus productos.

-> Facturación & Cobro de Bodegaje
--> Mi Detalle de Cobro por Almacenaje
---> Descripción: Consulta del desglose diario de cobro por bodegaje. Muestra los m³ ocupados por día multiplicados por la tarifa pactada y permite descargar el respaldo de facturación del período.

-> Acceso Histórico & Preferencias
--> Descarga de Respaldo de Movimientos (Kardex 3PL)
---> Descripción: Permite exportar en PDF/Excel el historial inmutable de recepciones y despachos de su mercancía para auditorías contables. *(Disponible durante el contrato y por 90 días en estado `READ_ONLY_HISTORICAL_90_DAYS` tras finalizar el servicio)*.

---

## 🛠️ Matriz de Acceso y Restricción de Funcionalidades por Rol (6 Roles)

| Módulo / Funcionalidad | Super Admin | Ejecutivo Plataforma | Admin Empresa | Jefe Bodega | Bodeguero / Operador | Gestión Comercial | Portal Cliente 3PL |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Configuración SaaS & Planes** | 🟢 Total | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |
| **Ver Todas las Empresas** | 🟢 Total | 🟡 Solo Cartola | ❌ Solo la Propia | ❌ Solo la Propia | ❌ Solo la Propia | ❌ Solo la Propia | ❌ Solo la Propia |
| **Audit Log Acceso Datos Sensibles** | 🟢 Audit Logs | 🟢 Audit Logs | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |
| **Validación Límites Plan SaaS** | 🟢 Configura | 👁️ Oportunidades | 🔴 Evaluado en INSERT | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |
| **Crear/Editar Bodegas & Jerarquía** | 🟢 Total | 👁️ Lectura | 🟢 Total | 🟡 Solo Casilleros | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |
| **Plano 2D Interactivo de Bodega** | 🟢 Total | 🟢 Total | 🟢 Total | 🟢 Su Bodega | 🟢 Operativo | 👁️ Lectura | 👁️ Solo su Stock |
| **Configurar Perfiles Costo AST** | 🟢 Total | 👁️ Lectura | 🟢 Total | 👁️ Solo Lectura | ❌ Sin Acceso | 👁️ Solo Lectura | ❌ Sin Acceso |
| **Simulador de Costos (Puro Memoria)**| 🟢 Total | 🟢 Total | 🟢 Total | ❌ Sin Acceso | ❌ Sin Acceso | 🟢 Total | ❌ Sin Acceso |
| **Emitir Solicitud Despacho (`dispatch_requests`)** | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A | 🟢 Emite Solicitud |
| **Aprobar Solicitud Despacho** | 🟢 Total | ❌ Sin Acceso | 🟢 Total | 🟢 Su Bodega | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |
| **Ingreso / Reubicación Directa Stock**| 🟢 Total | ❌ Sin Acceso | 🟢 Total | 🟢 Su Bodega | 🟢 Directo Terreno | ❌ Sin Acceso | ❌ Sin Acceso |
| **Ejecución Despacho Aprobado** | 🟢 Total | ❌ Sin Acceso | 🟢 Total | 🟢 Su Bodega | 🟢 Despacha Aprobado| ❌ Sin Acceso | ❌ Sin Acceso |
| **Supervisión Ex-Post Reubicaciones** | 🟢 Total | 👁️ Lectura | 🟢 Total | 🟢 Audita Ex-Post | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |
| **Kardex de Movimientos** | 🟢 Total | 👁️ Lectura | 🟢 Total | 👁️ Su Bodega | 👁️ Mis Movimientos | 👁️ Reporte Comercial| 👁️ Solo su Stock |
| **Catálogo SKUs & Onboarding 3PL** | 🟢 Total | 👁️ Lectura | 🟢 Total | 👁️ Lectura | 👁️ Lectura | 🟢 Onboarding Email | 👁️ Sus Productos |
| **Bot Telegram (Alertas Push & Queries)**| 🟢 Admin Bot | 👁️ Lectura | 🟢 Alertas Push | 🟢 Alertas Push | 🟢 PIN 10m (3 Intentos) | 👁️ Lectura | ❌ Sin Acceso |

---

## 📌 Guía de Despliegue y Ejecución

### 1. Desarrollo Local
- **Frontend App (React + Vite):** `http://localhost:5173`
- **Backend API REST v1 (Node.js):** `http://localhost:4000/api/v1`
- **Base de Datos PostgreSQL:** `192.168.1.49:5432` (`bodeg-ia`)

### 2. Despliegue Homelab / Servidor
- **Dominio Producción:** `http://bodegia.bamms.dev:5173`
- **Comando Docker Compose:** `docker compose up -d --build`
