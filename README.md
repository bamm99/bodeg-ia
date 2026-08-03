# 🏢 Bodeg-IA — Arquitectura de Negocio, Roles y Árbol de Menús (Sidebar)

Documento maestro de especificación de negocio, niveles de acceso, restricción de vistas y estructura detallada del menú lateral (Sidebar) para cada perfil de usuario en la plataforma **Bodeg-IA**.

---

## 👥 Clasificación de Perfiles de Usuario

La plataforma distingue dos grandes categorías de usuarios: **Internos** (equipo propio de la plataforma Bodeg-IA) y **Externos** (personal de las empresas clientes usarias de bodegas).

### 🔒 1. Usuarios Internos (Plataforma Bodeg-IA)
* **Super Admin (`SUPER_ADMIN`)**: Posee visibilidad y control absoluto sobre la plataforma SaaS multi-tenant. Administra planes, facturación global, todas las empresas clientes, configuraciones de infraestructura, auditoría y Bot de Telegram.
* **Ejecutivo (`PLATFORM_ADMIN`)**: Ejecutivo comercial / gestor de cuentas de la plataforma (estilo ejecutivo bancario). Administra y supervisa únicamente una cartera/cartola de clientes asignados a su cargo.

### 🏢 2. Usuarios Externos (Empresas Clientes 3PL / Distribución)
* **Administrador (`COMPANY_ADMIN`)**: Administrador principal de una empresa cliente. Controla la configuración de su empresa, sucursales, bodegas, tarifarios AST, usuarios internos de la empresa, catálogo y clientes 3PL.
* **Bodeguero (`WAREHOUSE_OPERATOR`)**: Usuario operativo enfocado en el trabajo físico "en terreno" dentro de la bodega. Accede al mapa 2D de repisas/casilleros, realiza recepción de mercancía (Inbound), reubicaciones (Relocate), despachos (Outbound), escaneo de SKUs e integración con Bot de Telegram en terreno. No tiene acceso a datos financieros o tarifarios.
* **Gestión / Comercial (`COMMERCIAL_MANAGEMENT`)**: Usuario enfocado en la gestión comercial, financiera y de clientes 3PL de la empresa. Revisa tarifarios de costo de almacenamiento, volumen ocupado en $m^3$, valorización de inventarios, cotizaciones, contratos y reportes de rotación. No realiza operaciones físicas de movimiento de stock.

---

## 🌳 Estructura Detallada del Menú Lateral (Sidebar) por Rol

---

### 👑 1. SIDEBAR: SUPER ADMIN (Interno)

-> Home / Dashboard Global
--> Descripción: Vista principal consolidada de la plataforma SaaS Bodeg-IA. Muestra métricas de alto nivel: total de empresas clientes activas, total de bodegas registradas en la plataforma, volumen total de almacenamiento en m³, ingresos recurrentes mensuales (MRR SaaS), estado de salud de los servidores de backend y PostgreSQL, y alertas globales de sistema.

-> Clientes / Empresas SaaS
--> Listado General de Empresas
---> Descripción: Muestra el catálogo completo de todas las empresas clientes registradas en la plataforma SaaS. Permite filtrar por estado (Activa, Suspendida, Demo), plan contratado y fecha de registro. Al hacer clic en una empresa, permite navegar a su ficha detallada: usuarios asignados, sucursales, bodegas registradas, volumen ocupado, suscripción activa e historial de pagos.
--> Alta de Nueva Empresa
---> Descripción: Formulario para registrar una nueva empresa en el sistema SaaS. Permite ingresar nombre de la empresa, RUT/Tax ID, dirección corporativa, teléfono de contacto, plan asignado y crear la cuenta del usuario Administrador principal de la empresa.
--> Cartolas y Asignación de Ejecutivos
---> Descripción: Herramienta de gestión para asignar empresas clientes a los Ejecutivos de Cuenta internos (Admin Plataforma). Muestra qué empresas están bajo la tutela de cada ejecutivo y permite reasignar carteras de clientes en tiempo real.

-> Planes & Suscripciones SaaS
--> Catálogo de Planes
---> Descripción: Gestión del tarifario del SaaS (Planes BASIC, PRO, ENTERPRISE). Permite crear y modificar planes definiendo precio mensual en CLP/USD, límite de bodegas permitidas, límite de usuarios activos, capacidad máxima de almacenamiento en m³ y características habilitadas.
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
---> Descripción: Muestra las cuentas de Telegram y teléfonos vinculados a usuarios del sistema mediante código PIN para consultas directas desde terreno.

-> Auditoría & Logs del Sistema
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
--> Descripción: Vista principal personalizada para el Ejecutivo Comercial. Muestra las métricas consolidadas exclusivamente de su cartera de clientes asignada: cantidad de empresas en su cartola, total de bodegas bajo su supervisión, volumen total en m³ de sus clientes, volumen ocupado %, y comisión/ingreso generado por su cartera.

-> Mis Clientes (Cartola Asignada)
--> Listado de Mi Cartera
---> Descripción: Muestra el listado de las empresas clientes asignadas bajo la tutela de este ejecutivo. Al seleccionar una empresa, el ejecutivo puede navegar a la ficha completa de ese cliente para ver sus sucursales, bodegas, usuarios administradores, perfiles de costo y estado del plan contratado.
--> Solicitudes de Soporte & Ajustes
---> Descripción: Mapeo de requerimientos o incidencias reportadas por los clientes de su cartola (ej. solicitudes de aumento de capacidad en m³, adición de bodegas adicionales o asistencia en configuración).

-> Supervisión de Bodegas & Capacidad
--> Bodegas de Mi Cartera
---> Descripción: Listado de todas las bodegas pertenecientes a los clientes de su cartera. Muestra el porcentaje de ocupación en m³, cantidad de casilleros libres/ocupados y desglose por zonas.
--> Consulta de Ocupación por Cliente
---> Descripción: Reporte detallado que analiza cómo cada empresa cliente está utilizando el volumen contratado de almacenamiento en sus bodegas, permitiendo al ejecutivo detectar oportunidades de venta cruzada (upselling) para planes con mayor capacidad.

-> Asistencia en Tarifarios & Costos
--> Visor de Perfiles de Costo
---> Descripción: Permite al ejecutivo consultar los perfiles de costo y fórmulas AST configuradas en las bodegas de sus clientes para verificar que las tarifas por día/zona estén correctamente aplicadas.
--> Simulador de Tarifas Comerciales
---> Descripción: Herramienta para simular propuestas de cobro de bodegaje para los clientes de su cartera, ingresando volumen en m³, días de estancia y factores de temporada para presentar cotizaciones comerciales.

-> Bot de Telegram & Consultas
--> Monitoreo de Consultas de Mi Cartera
---> Descripción: Muestra las consultas en lenguaje natural realizadas a través del Bot de Telegram por los usuarios de las empresas pertenecientes a su cartola de clientes.

-> Mi Perfil
--> Configuración de Cuenta
---> Descripción: Ajustes personales del ejecutivo, cambio de contraseña, correo electrónico de contacto y teléfono para notificaciones.

---

### 🏢 3. SIDEBAR: ADMINISTRADOR DE EMPRESA (Externo - Empresa Cliente)

-> Home / Dashboard Empresa
--> Descripción: Vista de mando de la empresa cliente. Muestra indicadores de rendimiento clave (KPIs): cantidad de sucursales activas, total de bodegas propias, capacidad total en m³, porcentaje de ocupación promedio, total de productos en catálogo, stock total en casilleros e historial de movimientos del día.

-> Estructura Física & Bodegas
--> Sucursales
---> Descripción: Gestión de las sucursales de la empresa (ej. Sucursal Pudahuel, Sucursal San Bernardo). Permite crear y editar sucursales especificando nombre, dirección física y teléfono de contacto.
--> Bodegas
---> Descripción: Listado de bodegas asociadas a cada sucursal. Permite crear nuevas bodegas, habilitar o deshabilitar el seguimiento de costos por espacio (`is_cost_tracking_enabled`) y definir parámetros operativos de la instalación.
--> Diseñador Espacial & Jerarquía (Zonas, Pasillos, Repisas)
---> Descripción: Herramienta de gestión para estructurar la jerarquía física de cada bodega. Permite crear Zonas (definiendo tasa de rotación HIGH, MEDIUM, LOW), Pasillos, Repisas (Racks 2D) especificando su posición en grilla `position_x`, `position_y`, Niveles y Casilleros de almacenamiento (`storage_locations`) fijando capacidad máxima en m³ y peso en kg.
--> Plano 2D Interactivo de Bodegas
---> Descripción: Visualizador gráfico interactivo en 2D de las repisas y casilleros de la bodega. Muestra un mapa de calor visual según el nivel de llenado del casillero (Disponible/Verde, Parcial/Amarillo, Lleno/Rojo) y permite ver el stock almacenado en cada posición al hacer clic.

-> Tarifario & Motor de Costos AST
--> Perfiles de Costo (Zonas / Repisas / Niveles)
---> Descripción: Configuración del cobro por espacio de almacenamiento en la bodega. Permite definir el costo base diario por m³, multiplicador de rotación, costos fijos de mantenimiento/energía diarios y asociarlo mediante la regla de Arco Exclusivo (exactamente a una Zona, Repisa o Nivel).
--> Editor de Fórmulas Dinámicas AST
---> Descripción: Herramienta avanzada para crear fórmulas de cobro personalizadas escritas en lenguaje sintáctico AST (ej. `(base * turnover + energy) * seasonal`). Permite probar la fórmula antes de guardarla.
--> Simulador de Cobros de Almacenaje
---> Descripción: Calculadora interactiva que permite ingresar volumen ocupado en m³, cantidad de días y zona elegida para calcular al instante el costo total estimado a cobrar por el bodegaje.
--> Historial de Cambios Tarifarios
---> Descripción: Registro de auditoría que guarda cada modificación realizada a los perfiles de costo, mostrando costo anterior, costo nuevo, usuario que lo cambió y la justificación del ajuste.

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

-> Usuarios & Permisos RBAC
--> Gestión de Usuarios de la Empresa
---> Descripción: Administración de las cuentas de usuario de la empresa (Jefes de Bodega, Bodegueros, Ejecutivos Comerciales). Permite asignar roles, activar/desactivar cuentas y restablecer claves.
--> Asignación de Bodegas por Usuario
---> Descripción: Mapeo de permisos por bodega (`user_warehouse_assignments`). Permite restringir a un bodeguero u operador para que solo pueda ver u operar en una bodega específica.

-> Bot de Telegram IA
--> Vinculación de Cuentas Telegram
---> Descripción: Generador de códigos PIN temporales para que el personal de bodega y administradores puedan vincular su cuenta de Telegram al sistema Bodeg-IA.
--> Historial de Consultas de Terreno
---> Descripción: Visor de preguntas realizadas al Bot de Telegram por el personal de la empresa en terreno.

---

### 📦 4. SIDEBAR: BODEGUERO / OPERADOR (Externo - Terreno & Operaciones)

-> Home / Mi Bodega (Terreno)
--> Descripción: Vista simplificada de operación diaria para el trabajador de bodega en terreno. Muestra accesos directos a la recepción de mercancía, consulta rápida de ubicación de productos, reubicaciones pendientes y tareas del día en la bodega asignada.

-> Ubicación & Mapa 2D
--> Plano 2D de Mi Bodega
---> Descripción: Visualización interactiva en 2D de la bodega asignada al operador. Permite navegar visualmente por pasillos y repisas, ver qué casilleros están llenos o disponibles y consultar qué productos están ubicados en cada repisa/nivel.
--> Búsqueda Rápida de Ubicación (SKU / Producto)
---> Descripción: Buscador de respuesta inmediata. El operador ingresa un código SKU o nombre de producto y la herramienta devuelve la ruta física jerárquica exacta para ir a buscarlo en la bodega (*Ejemplo: Zona A > Pasillo 01 > Repisa REP-A1 > Nivel 2 > Casillero A1-N2-POS1*).

-> Operaciones de Inventario
--> Recepción de Mercancía (Inbound)
---> Descripción: Formulario rápido optimizado para tablets o dispositivos móviles de terreno para ingresar productos que llegan en camión a la bodega, asignándoles casillero y registrando lote y vencimiento.
--> Reubicación de Mercancía (Relocate)
---> Descripción: Herramienta de terreno para mover pallets o cajas de una repisa/casillero a otro, escaneando o seleccionando el casillero origen y destino.
--> Despacho / Salida (Outbound)
---> Descripción: Registro de salida de productos preparados para despacho al cliente final.

-> Asistente Telegram IA (En Terreno)
--> Vinculación Telegram
---> Descripción: Muestra el código PIN único para vincular la cuenta de Telegram del teléfono personal o corporativo del operador al bot de Bodeg-IA.
--> Guía de Comandos y Consultas de Voz
---> Descripción: Instrucciones y ejemplos de preguntas en lenguaje natural que el operador puede hacerle al Bot de Telegram mientras trabaja en la bodega (ej. *"¿En qué pasillo está la Harina 25kg?"*).

---

### 📊 5. SIDEBAR: GESTIÓN / COMERCIAL (Externo - Ventas, Costos & 3PL)

-> Home / Resumen Comercial
--> Descripción: Panel de control con foco financiero y comercial para la empresa cliente. Muestra ingresos proyectados por cobro de bodegaje a terceros 3PL, evolución de m³ ocupados por cliente en el tiempo, productos con mayor rotación y resumen de contratos de almacenamiento.

-> Clientes 3PL & Facturación de Bodegaje
--> Cartera de Clientes 3PL
---> Descripción: Listado de clientes propietarios a quienes la empresa les almacena mercancía. Muestra volumen m³ ocupado por cada cliente 3PL y detalle de productos en custodia.
--> Reporte de Cobro de Almacenaje por Cliente
---> Descripción: Informe consolidado que liquida el costo de almacenamiento por cliente 3PL para un período dado. Múltiplica los m³ ocupados por día por la tarifa del perfil de costo AST correspondiente para generar el detalle de cobro.

-> Tarifario AST & Simulación
--> Consulta de Tarifas por Zona
---> Descripción: Visor de los perfiles de costo vigentes en la bodega (costos diarios base por m³, multiplicadores de rotación y costos de energía).
--> Simulador de Cotizaciones Comerciales
---> Descripción: Calculadora comercial para cotizar a nuevos clientes 3PL el costo de almacenar cierta cantidad de m³ o pallets durante un período estimado de días.

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

## 🛠️ Matriz de Acceso y Restricción de Funcionalidades por Rol

| Módulo / Funcionalidad | Super Admin | Ejecutivo Plataforma | Admin Empresa | Bodeguero | Gestión / Comercial |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Configuración SaaS & Planes** | 🟢 Total | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |
| **Ver Todas las Empresas del Sistema** | 🟢 Total | 🟡 Solo Cartola | ❌ Solo la Propia | ❌ Solo la Propia | ❌ Solo la Propia |
| **Crear/Editar Sucursales y Bodegas** | 🟢 Total | 👁️ Lectura | 🟢 Total | ❌ Sin Acceso | ❌ Sin Acceso |
| **Diseño 2D Jerarquía (Zonas/Racks)** | 🟢 Total | 👁️ Lectura | 🟢 Total | ❌ Sin Acceso | ❌ Sin Acceso |
| **Plano 2D Interactivo de Bodega** | 🟢 Total | 🟢 Total | 🟢 Total | 🟢 Operativo | 👁️ Lectura |
| **Configurar Perfiles Costo AST & Fórmulas** | 🟢 Total | 👁️ Lectura | 🟢 Total | ❌ Sin Acceso | 👁️ Lectura |
| **Simulador de Costos AST** | 🟢 Total | 🟢 Total | 🟢 Total | ❌ Sin Acceso | 🟢 Total |
| **Ingreso / Reubicación / Salida Stock** | 🟢 Total | ❌ Sin Acceso | 🟢 Total | 🟢 Operativo | ❌ Sin Acceso |
| **Kardex de Movimientos** | 🟢 Total | 👁️ Lectura | 🟢 Total | 👁️ Mis Movimientos | 👁️ Reporte Comercial |
| **Catálogo de Productos & Clientes 3PL** | 🟢 Total | 👁️ Lectura | 🟢 Total | 👁️ Lectura | 🟢 Total |
| **Reporte de Liquidación / Cobro 3PL** | 🟢 Total | 👁️ Lectura | 🟢 Total | ❌ Sin Acceso | 🟢 Total |
| **Administración de Usuarios** | 🟢 Global | ❌ Sin Acceso | 🟢 De su Empresa | ❌ Sin Acceso | ❌ Sin Acceso |
| **Bot de Telegram IA (Consultas Terreno)** | 🟢 Admin Bot | 👁️ Lectura | 🟢 Admin Empresa | 🟢 Usuario Terreno | 👁️ Lectura |
| **Logs de Peticiones & Trace ID** | 🟢 Total | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso | ❌ Sin Acceso |

---

## 📌 Guía de Despliegue y Ejecución

### 1. Desarrollo Local
- **Frontend App (React + Vite):** `http://localhost:5173`
- **Backend API REST v1 (Node.js):** `http://localhost:4000/api/v1`
- **Base de Datos PostgreSQL:** `192.168.1.49:5432` (`bodeg-ia`)

### 2. Despliegue Homelab / Servidor
- **Dominio Producción:** `http://bodegia.bamms.dev:5173`
- **Comando Docker Compose:** `docker compose up -d --build`
