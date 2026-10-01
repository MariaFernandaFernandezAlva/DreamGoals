# 🌟 DreamGoals

DreamGoals es una plataforma web colaborativa diseñada para gestionar metas de ahorro en grupo. Permite a los usuarios crear espacios compartidos, definir objetivos financieros, registrar transacciones y celebrar hitos (minimetas), garantizando la transparencia mediante herramientas de conciliación de saldos con comprobantes bancarios.

## 🚀 Características Principales

*   **Autenticación Segura (Magic Links):** Acceso rápido sin contraseñas a través de enlaces enviados al correo electrónico (Supabase Auth).
*   **Gestión de Grupos:** Creación de espacios de ahorro con generación de enlaces de invitación únicos y control de roles (Admin/Miembro).
*   **Metas Compartidas:** Paneles visuales para seguir el progreso del ahorro en tiempo real, visualizar aportes por integrante y calcular el dinero restante.
*   **Minimetas y Recompensas:** Configuración de hitos intermedios (automáticos o manuales) que disparan animaciones de celebración cuando se alcanzan.
*   **Registro de Movimientos:** Historial detallado de depósitos y retiros, con soporte para adjuntar imágenes como comprobantes.
*   **Conciliación Bancaria:** Sistema de validación periódica que bloquea nuevos movimientos hasta que un integrante verifique que el saldo de la app coincide con el saldo real del banco.

## 🛠️ Stack Tecnológico

*   **Frontend:** React 19 + TypeScript + Vite.
*   **Estilos:** Tailwind CSS v4.
*   **Enrutamiento:** React Router v7.
*   **Backend & Base de Datos:** Supabase (PostgreSQL, Storage, Auth y RPC).
*   **Iconografía:** Lucide React.
*   **Animaciones:** Canvas Confetti.

## ⚙️ Requisitos Previos

*   [Node.js](https://nodejs.org/) (versión 20 o superior recomendada).
*   Una cuenta activa en [Supabase](https://supabase.com/) con el esquema de base de datos, funciones RPC y buckets de almacenamiento (`evidencias`) configurados.

## 📦 Instalación y Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   cd dreamgoals
   ```

2. **Instalar dependencias:**
   Puedes utilizar npm, yarn o pnpm.
   ```Bash
   npm install
   ```
  
3. **Configurar variables de entorno:** 
    Crea un archivo llamado `.env.local` en la raíz del proyecto. Deberás obtener estos valores desde la configuración de tu panel de Supabase:
    ```Bash
    VITE_SUPABASE_URL=tu_supabase_project_url
    VITE_SUPABASE_KEY=tu_supabase_anon_key
    ```

4. **Sincronizar los tipos de Supabase (TypeScript):**
    Para mantener el autocompletado y tipado estricto sincronizado con los cambios de tu base de datos, debes generar el archivo de tipos usando el CLI de Supabase:
    Primero, inicia sesión en Supabase:

    ```Bash
    npx supabase login
    ```
    Luego, genera el archivo types.ts reemplazando "codigo_supabase" con el ID real de tu proyecto:
    > Cada que hagas un cambio en las tablas del supaBase, siempre debes volver a escribir este comando.

    ```Bash
    npx supabase gen types typescript --project-id "codigo_supabase" > src/services/types.ts
    ```
5. **Iniciar el servidor de desarrollo:**
    ```Bash
    npm run dev
    ```

    La aplicación se abrirá en http://localhost:5173.

## 🤖 Herramientas para IA (Repomix)

Si necesitas compartir el contexto completo del proyecto con herramientas de Inteligencia Artificial (como Claude, ChatGPT o Gemini) para refactorizar código, encontrar bugs o generar documentación, puedes usar Repomix.

Ejecuta el siguiente comando en la raíz del proyecto:

  ```Bash
  npx repomix@latest
  ```
  > Este comando analiza toda la estructura de carpetas y el código fuente del repositorio, empaquetándolo en un único archivo (por defecto repomix-output.xml o .txt). Esto facilita enormemente que los modelos de lenguaje entiendan cómo se conectan tus componentes, hooks y servicios sin tener que copiar y pegar archivos uno por uno.

> **⚠️ IMPORTANTE: Control de Versiones (.gitignore)**
> Asegúrate de que los siguientes archivos estén siempre incluidos en tu `.gitignore` para no subir información sensible ni archivos generados innecesariamente al repositorio público:
> ```text
> # Variables de entorno
> .env
> .env.local
> 
> # Archivos generados por IA
> repomix-output.xml
> repomix-output.txt
> ```

## Comandos Disponibles (Scripts)

  * `npm run dev`: Inicia el entorno de desarrollo con Vite.

  * `npm run build`: Compila la aplicación para producción utilizando TypeScript y Vite.

  * `npm run lint`: Ejecuta ESLint para analizar el código en busca de errores.

  * `npm run preview`: Previsualiza la compilación de producción en un servidor local.