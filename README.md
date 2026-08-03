# 🏢 Bodeg-IA — Arquitectura de Negocio, Roles, Matriz RBAC y Árbol de Menús (Sidebar)

Documento maestro de especificación de negocio, niveles de acceso, reglas de limites SaaS, seguridad en auditoría y estructura detallada del menú lateral (Sidebar) para cada perfil de usuario en la plataforma **Bodeg-IA**.

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
1. **Super Admin (`SUPER_ADMIN`)**: Posee visibilidad y control absoluto sobre la plataforma SaaS multi-tenant. Administra planes, facturación global, todas las empresas clientes, configuraciones de infraestructura, auditoría de accesos a datos sensibles y Bot de Telegram.
2. **Ejecutivo de Plataforma (`PLATFORM_ADMIN`)**: Ejecutivo comercial / gestor de cuentas de la plataforma (estilo ejecutivo bancario). Administra y supervisa únicamente una cartera/cartola de clientes asignados a su cargo (`user_company_access`).

### 🏢 2. Usuarios Externos (Empresa Cliente / Operador Logístico)
3. **Administrador de Empresa (`COMPANY_ADMIN`)**: Administrador principal de una empresa cliente. Controla la configuración de su empresa, sucursales, bodegas, tarifarios AST, usuarios internos de la empresa, catálogo y clientes 3PL.
4. **Jefe de Bodega (`WAREHOUSE_MANAGER`)**: Responsable operativo y de gestión de una o más bodegas específicas asignadas (`user_warehouse_assignments`). Puede visualizar costos y tarifas de sus bodegas asignadas, gestionar la jerarquía espacial de sus casilleros y aprobar reubicaciones o ajustes, pero no puede modificar datos de facturación de la empresa ni gestionar usuarios fuera de su bodega.
5. **Bodeguero / Operador (`WAREHOUSE_OPERATOR`)**: Usuario operativo enfocado exclusivamente en el trabajo físico "en terreno". Accede al mapa 2D de casilleros, ejecuta recepción de mercancía (Inbound), reubicaciones (Relocate), despachos (Outbound), escaneo de SKUs e integración con Bot de Telegram en terreno. **Strictly No-Financial**: No tiene acceso a datos de costo ni tarifas.
6. **Gestión / Comercial (`COMMERCIAL_MANAGEMENT`)**: Usuario enfocado en la gestión comercial, financiera y de clientes 3PL de la empresa. Revisa tarifarios de costo de almacenamiento, volumen ocupado en $m^3$, valorización de inventarios, cotizaciones puras en memoria, contratos y reportes de rotación. No realiza operaciones físicas de movimiento de stock.

### 🛒 3. Usuarios Externos (Propietarios de Mercancía / Cliente 3PL Final)
7. **Portal Cliente 3PL (`CLIENT_VIEWER`)**: Dueño real de la mercancía almacenada en las bodegas 3PL (`client_owner_id`). Accede a un portal de solo lectura para consultar exclusivamente su stock acumulado, volumen ocupado en $m^3$, estado de despachos, historial Kardex de sus productos y detalle de liquidación/facturación de cobro por bodegaje.

---

## ⚡ Reglas de Negocio, Seguridad y Control de Límites SaaS

### 🔒 1. Registro de Auditoría Explicito para Acceso a Datos Financieros de Tenants
Para garantizar el cumplimiento de auditorías Enterprise y seguridad de datos comerciales sensibles de los clientes:
* Cada vez que un usuario interno (`SUPER_ADMIN` o `PLATFORM_ADMIN`) abre la pestaña de tarifarios, ficha financiera o simula cobros de una empresa cliente, el backend registra automáticamente un evento inmutable de auditoría en la tabla `tenant_access_audit_logs`.
* **Datos Registrados:** `id`, `user_id`, `target_company_id`, `access_type` (`FINANCIAL_TARIFF_READ`), `timestamp`, `ip_address`, `trace_id`.

### 🛡️ 2. Validación de Límites del Plan SaaS & Mecanismo de Upsell
El backend valida estrictamente los límites del plan contratado (`max_warehouses`, `max_users`, `max_storage_m3`) antes de ejecutar cualquier `INSERT`:
* **Respuesta Backend:** Si un `COMPANY_ADMIN` en plan **BASIC** (máximo 3 bodegas) intenta crear una 4ª bodega, la API retorna `HTTP 402 Payment Required` con código `PLAN_LIMIT_EXCEEDED`.
* **Mecanismo de Upsell en Frontend:** El cliente visualiza una modal interactiva de actualización: *"Has alcanzado el límite de 3 bodegas de tu Plan BASIC. Actualiza a Plan PRO o contacta a tu Ejecutivo de Plataforma para continuar ampliando tu capacidad"*.

### 🚫 3. Política de Downgrade de Plan con Exceso de Recursos (Regla de Bloqueo Preventivo)
* **Regla Preventiva:** Una empresa cliente **NO puede realizar un Downgrade** a un plan inferior si su uso actual supera los límites del plan de destino (ej. si posee 5 bodegas activas, el sistema bloquea el cambio a plan BASIC de 3 bodegas hasta que elimine/archive 2 bodegas).
* **Tratamiento de Exceso por Expiración:** Si la suscripción expira y baja forzosamente de categoría, las bodegas excedentes pasan automáticamente a estado `READ_ONLY_BLOCKED` (no permiten ingresar stock Inbound hasta regularizar el plan).

### 📜 4. Auditoría de Reasignación de Cartola de Clientes
Toda reasignación de una empresa cliente desde un Ejecutivo de Plataforma A hacia un Ejecutivo B se registra inmutablemente en la tabla `executive_portfolio_history` (`company_id`, `previous_user_id`, `new_user_id`, `reassigned_by_user_id`, `reassigned_at`, `reason`).

### 📱 5. Seguridad de Vinculación con Bot de Telegram (Código PIN)
El código PIN temporal para vincular la cuenta de Telegram de un trabajador o cliente posee las siguientes restricciones de seguridad:
* **Expiración Estricta:** Válido por únicamente **10 minutos**.
* **Límite de Intentos:** Máximo **3 intentos fallidos** por PIN antes de ser invalidado y requerir la generación de un nuevo token.
* **Formato:** Criptográficamente aleatorio de 6 dígitos numéricos asociado a la sesión del usuario.

### 🧮 6. Simulador de Cotizaciones (Herramienta Pura en Memoria)
Los simuladores de cotizaciones en las vistas de Ejecutivo y Comercial son **herramientas puramente de cálculo en memoria (Read-Only/Simulation)**. No crean registros persistentes en la base de datos ni emiten facturas reales a menos que se exporten manualmente a formato propuesta.

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
---> Descripción: Muestra el listado de las empresas clientes asignadas bajo la tutela de este ejecutivo. Al seleccionar una empresa, el ejecutivo puede navegar a la ficha completa de ese cliente para ver sus sucursales, bodegas, usuarios administradores y uso de plan. Cada ingreso a datos financieros genera un registro en `tenant_access_audit_logs`.
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
--> Descripción: Vista de mando de la empresa cliente. Muestra indicadores de rendimiento clave (KPIs): uso actual de límites del plan (ej. 2/3 Bodegas, 8/15 Usuarios, 450/2000 m³ ocupados), sucursales activas, bodegas propias, porcentaje de ocupación promedio, total de productos en catálogo, stock total e historial de movimientos del día.

-> Estructura Física & Bodegas
--> Sucursales
---> Descripción: Gestión de las sucursales de la empresa (ej. Sucursal Pudahuel, Sucursal San Bernardo). Permite crear y editar sucursales especificando nombre, dirección física y teléfono de contacto.
--> Bodegas
---> Descripción: Listado de bodegas asociadas a cada sucursal. Permite crear nuevas bodegas (con validación previa contra el límite `max_warehouses` del plan contratado), habilitar o deshabilitar el seguimiento de costos por espacio (`is_cost_tracking_enabled`) y definir parámetros operativos.
--> Diseñador Espacial & Jerarquía (Zonas, Pasillos, Repisas)
---> Descripción: Herramienta de gestión para estructurar la jerarquía física de cada bodega. Permite crear Zonas (definiendo tasa de rotación HIGH, MEDIUM, LOW), Pasillos, Repisas (Racks 2D) especificando su posición en grilla `position_x`, `position_y`, Niveles y Casilleros de almacenamiento (`storage_locations`) fijando capacidad máxima en m³ y peso en kg.
--> Plano 2D Interactivo de Bodegas
---> Descripción: Visualizador gráfico interactivo en 2D de las repisas y casilleros de la bodega. Muestra un mapa de calor visual según el nivel de llenado del casillero (Disponible/Verde, Parcial/Amarillo, Lleno/Rojo) y permite ver el stock almacenado en cada posición al hacer clic.

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
---> Descripción: Formulario para registrar el retiro o despacho de productos. Libera volumen m³ en el casillero de origen y descuenta las existencias en inventario registrando el movimiento de salida en el Kardex.
--> Kardex de Movimientos (Histórico & Auditoría)
---> Descripción: Registro cronológico e inmutable de todos los movimientos de inventario realizados en la empresa. Muestra fecha/hora, tipo de movimiento (INBOUND, RELOCATION, OUTBOUND), casillero origen, casillero destino, producto, cantidad y usuario que ejecutó la operación.

-> Catálogo & Clientes 3PL
--> Catálogo de Productos (SKUs)
---> Descripción: Gestión del catálogo maestro de productos de la empresa. Permite crear y editar SKUs, especificando nombre, descripción, peso unitario en kg, volumen unitario en m³ y si el producto requiere paletizado.
--> Clientes 3PL / Propietarios de Mercancía
---> Descripción: Registro de los clientes externos a quienes la empresa presta servicios de bodegaje 3PL. Permite asociar inventario específico a cada cliente propietario para liquidación de servicios.

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

### 🏭 4. SIDEBAR: JEFE DE BODEGA (`WAREHOUSE_MANAGER` - Gestión Operativa de Bodega)

-> Home / Mi Bodega Asignada
--> Descripción: Panel de control de la bodega asignada al Jefe de Bodega (`user_warehouse_assignments`). Muestra ocupación en m³ de la bodega, casilleros disponibles, alertas de sobrecapacidad, movimientos del día y productos próximos a vencer.

-> Estructura & Ocupación de Mi Bodega
--> Plano 2D de Mi Bodega
---> Descripción: Mapa gráfico 2D interactivo de la bodega bajo su mando. Permite inspeccionar repisas, casilleros y ver el nivel de ocupación en m³ en tiempo real.
--> Gestión de Casilleros & Posiciones
---> Descripción: Administración local de los casilleros de la bodega asignada. Permite marcar casilleros en mantenimiento o ajustar peso máximo permitido en kg.

-> Tarifas & Costos de Mi Bodega (Solo Lectura)
--> Consulta de Tarifario de Mi Bodega
---> Descripción: Muestra los perfiles de costo AST aplicados a las zonas y repisas de su bodega asignada. A diferencia del bodeguero, el Jefe de Bodega **SÍ puede consultar las tarifas** para coordinar la optimización del espacio, pero **no puede modificar** la estructura tarifaria financiera de la empresa.

-> Operaciones de Inventario & Supervisión
--> Gestión de Ingresos (Inbound)
---> Descripción: Control y aprobación de recepciones de mercancía que ingresan a su bodega.
--> Autorización de Reubicaciones (Relocate)
---> Descripción: Supervisión y ejecución de movimientos de mercancía entre casilleros dentro de su bodega.
--> Autorización de Despachos (Outbound)
---> Descripción: Aprobación de salidas de productos preparadas para entrega a transporte.
--> Kardex de Mi Bodega
---> Descripción: Historial filtrado de movimientos de inventario ocurridos exclusivamente en su bodega asignada.

-> Bot de Telegram & Terreno
--> Vinculación Telegram Personal
---> Descripción: Generación de PIN temporal de 10 minutos para vincular su Telegram al asistente virtual de bodega.

---

### 📦 5. SIDEBAR: BODEGUERO / OPERADOR (`WAREHOUSE_OPERATOR` - Terreno & Operaciones Físicas)

-> Home / Operación Diaria
--> Descripción: Vista simplificada para el trabajador de bodega en terreno. Muestra accesos directos rápidos a recepción, consulta de ubicación de productos, reubicaciones y tareas del día. **Strictly No-Financial**: No muestra ningún valor monetario ni tarifas.

-> Ubicación & Mapa 2D
--> Plano 2D de Mi Bodega (Vista Operativa)
---> Descripción: Visualización interactiva en 2D de la bodega asignada al operador. Permite navegar por repisas y ver visualmente qué casilleros están llenos o disponibles y qué productos están ubicados en cada posición.
--> Búsqueda Rápida de Ubicación (SKU / Producto)
---> Descripción: Buscador de respuesta inmediata para terreno. El operador ingresa un código SKU o nombre de producto y la herramienta devuelve la ruta física jerárquica exacta para ir a buscarlo (*Ejemplo: Zona A > Pasillo 01 > Repisa REP-A1 > Nivel 2 > Casillero A1-N2-POS1*).

-> Operaciones de Inventario en Terreno
--> Recepción de Mercancía (Inbound)
---> Descripción: Formulario rápido optimizado para tablets/móviles para ingresar productos a la bodega, asignándoles casillero con validación de volumen m³ disponible, lote y vencimiento.
--> Reubicación de Mercancía (Relocate)
---> Descripción: Herramienta de terreno para mover pallets o cajas de un casillero a otro, seleccionando origen y destino.
--> Despacho / Salida (Outbound)
---> Descripción: Registro de salida física de productos preparados para despacho.

-> Asistente Telegram IA (En Terreno)
--> Vinculación Telegram
---> Descripción: Muestra el código PIN único de 6 dígitos (10 min de expiración) para vincular la cuenta de Telegram del teléfono personal o corporativo del operador al bot de Bodeg-IA.
--> Guía de Comandos y Consultas de Voz
---> Descripción: Ejemplos de preguntas en lenguaje natural que el operador puede hacerle al Bot de Telegram mientras trabaja en la bodega (*ej. "¿En qué pasillo está la Harina 25kg?"*).

---

### 📊 6. SIDEBAR: GESTIÓN / COMERCIAL (`COMMERCIAL_MANAGEMENT` - Ventas, Costos & 3PL)

-> Home / Resumen Comercial
--> Descripción: Panel de control financiero y comercial para la empresa cliente. Muestra ingresos proyectados por cobro de bodegaje a terceros 3PL, evolución de m³ ocupados por cliente en el tiempo, productos con mayor rotación y resumen de liquidaciones.

-> Clientes 3PL & Facturación de Bodegaje
--> Cartera de Clientes 3PL
---> Descripción: Listado de clientes propietarios a quienes la empresa les almacena mercancía. Muestra volumen m³ ocupado por cada cliente 3PL y detalle de productos en custodia.
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
--> Descripción: Portal de autoservicio exclusivo para el cliente 3PL propietario de la mercancía (`client_owner_id`). Muestra resumen de su stock total almacenado, volumen ocupado en m³ en las bodegas del operador 3PL, estado de despachos recientes y resumen de cobro de almacenamiento del mes.

-> Mis Existencias & Productos
--> Listado de Mi Inventario
---> Descripción: Vista detallada de los productos de su propiedad guardados en la bodega 3PL. Muestra SKU, nombre de producto, cantidad disponible, lotes, fechas de vencimiento y casillero/bodega asignada.
--> Ubicación de Mi Stock
---> Descripción: Consulta de la bodega y zona donde se encuentra almacenado cada uno de sus productos.

-> Despachos & Movimientos
--> Solicitudes de Despacho / Outbound
---> Descripción: Permite al cliente 3PL enviar órdenes o solicitudes de retiro/despacho de su mercancía hacia el operador de bodega.
--> Histórico Kardex de Mi Mercancía
---> Descripción: Registro de auditoría de todos los ingresos (Inbound) y despachos (Outbound) realizados sobre sus productos.

-> Facturación & Cobro de Bodegaje
--> Mi Detalle de Cobro por Almacenaje
---> Descripción: Consulta del desglose diario de cobro por bodegaje. Muestra los m³ ocupados por día multiplicados por la tarifa pactada y permite descargar el respaldo de facturación del período.

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
| **Ingreso / Reubicación / Salida Stock**| 🟢 Total | ❌ Sin Acceso | 🟢 Total | 🟢 Su Bodega | 🟢 Operativo | ❌ Sin Acceso | 🟡 Pide Despacho |
| **Kardex de Movimientos** | 🟢 Total | 👁️ Lectura | 🟢 Total | 👁️ Su Bodega | 👁️ Mis Movimientos | 👁️ Reporte Comercial| 👁️ Solo su Stock |
| **Catálogo SKUs & Clientes 3PL** | 🟢 Total | 👁️ Lectura | 🟢 Total | 👁️ Lectura | 👁️ Lectura | 🟢 Total | 👁️ Sus Productos |
| **Reporte de Liquidación / Cobro 3PL**| 🟢 Total | 👁️ Lectura | 🟢 Total | ❌ Sin Acceso | ❌ Sin Acceso | 🟢 Total | 👁️ Su Facturación |
| **Administración de Usuarios** | 🟢 Global | ❌ Sin Acceso | 🟢 De su Empresa | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |
| **Bot Telegram (Consultas Terreno)** | 🟢 Admin Bot | 👁️ Lectura | 🟢 Admin Empresa | 🟢 Jefe Bodega | 🟢 PIN 10m (3 Intentos) | 👁️ Lectura | ❌ Sin Acceso |

---

## 📌 Guía de Despliegue y Ejecución

### 1. Desarrollo Local
- **Frontend App (React + Vite):** `http://localhost:5173`
- **Backend API REST v1 (Node.js):** `http://localhost:4000/api/v1`
- **Base de Datos PostgreSQL:** `192.168.1.49:5432` (`bodeg-ia`)

### 2. Despliegue Homelab / Servidor
- **Dominio Producción:** `http://bodegia.bamms.dev:5173`
- **Comando Docker Compose:** `docker compose up -d --build`
