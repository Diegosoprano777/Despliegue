Este documento detalla la justificación técnica y el procedimiento para la migración de credenciales estáticas a variables de entorno dinámicas en el proyecto SENA Evidence Management System.

## 1. Contexto del Problema
Anteriormente, el backend utilizaba credenciales "hardcoded" (escritas directamente
en el código) para la conexión a MySQL y la firma de tokens JWT.
• **Riesgo**: Si el código se sube a un repositorio público (GitHub), cualquier
persona con acceso al código podría ver las contraseñas, comprometiendo la
base de datos y la integridad de los tokens de usuario.

## 2. Requerimiento No Funcional (RNF)
**ID**: RNF-SEG-01
**Nombre**: Aislamiento de Secretos y Configuración de Entorno
**Prioridad**: Crítica
**Descripción**: El sistema debe separar la lógica de negocio de la configuración sensible. Toda credencial (BD, Claves de Cifrado, API Keys) debe ser inyectada en tiempo de ejecución a través del entorno del sistema operativo.

## 3. Justificación Técnica (Por qué es importante)
### A. Seguridad (Seguridad de la Información)
• **Principio de Menor Privilegio**: Al usar un archivo .env ignorado por Git, las contraseñas reales residen únicamente en la máquina del desarrollador o en el servidor de producción.
• **Prevención de Fugas**: Evita que repositorios públicos expongan infraestructuras privadas.

### B. Portabilidad y Despliegue (DevOps)
• **Inmutabilidad del Código**: Permite utilizar el mismo "motor" (código) en diferentes escenarios (Local, Pruebas, Producción) sin modificar una sola línea de código fuente. Solo se cambia el "combustible" (las variables de entorno).

### C. Estándar de la Industria
• **12-Factor App**: Seguir la metodología de las "12-Factor Apps" (factor III: Configuración), que es el estándar de oro para aplicaciones en la nube modernas.

## 4. Cambios Solicitados e Implementados
1. **Integración de dotenv**: Implementación de la librería para permitir la lectura de archivos de configuración física en entornos de desarrollo local.
2. **Desacoplamiento de index.js**: Referenciar `process.env[VARIABLE]` en lugar de cadenas de texto literales en toda la suite Backend.
3. **Implementación de .env.example**: Creación de un contrato de configuración. Este archivo define qué variables se necesitan, pero no revela cuáles son los valores, permitiendo que nuevos desarrolladores (o aprendices) configuren su entorno rápidamente.

## 5. Conclusión para el Aprendiz
La programación profesional no se trata solo de que "funcione", sino de que sea segura, escalable y mantenible. El manejo de variables de entorno es el primer paso para pasar de ser un programador aficionado a un ingeniero de software profesional.
