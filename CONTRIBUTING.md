# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a **BotSitot**!  

Esta guía te ayudará a empezar. 

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Guía de Estilo](#guía-de-estilo)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Solicitar Features](#solicitar-features)

---

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta.  Al participar, se espera que mantengas un ambiente respetuoso y colaborativo.

### Esperamos que:

- ✅ Uses lenguaje inclusivo y respetuoso
- ✅ Respetes diferentes puntos de vista
- ✅ Aceptes críticas constructivas
- ✅ Te enfoques en lo mejor para la comunidad
- ✅ Muestres empatía hacia otros miembros

---

## 🚀 ¿Cómo puedo contribuir?

### 1️⃣ Reportar Bugs

¿Encontraste un bug?  Ayúdanos a mejorarlo:

1. **Verifica** que el bug no esté ya reportado en [Issues](https://github.com/joseliviaa05-hub/botsitot/issues)
2. **Abre un nuevo Issue** con el template de Bug Report
3. **Incluye:**
   - Descripción clara del problema
   - Pasos para reproducirlo
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Versión de Node. js y sistema operativo

### 2️⃣ Solicitar Features

¿Tienes una idea para mejorar el proyecto? 

1. **Verifica** que no exista ya en [Issues](https://github.com/joseliviaa05-hub/botsitot/issues)
2. **Abre un Issue** con el template de Feature Request
3. **Describe:**
   - El problema que resuelve
   - La solución propuesta
   - Alternativas consideradas
   - Mockups o ejemplos si aplica

### 3️⃣ Mejorar Documentación

La documentación siempre puede mejorar:

- Corregir typos o errores
- Agregar ejemplos
- Traducir a otros idiomas
- Mejorar explicaciones

### 4️⃣ Contribuir Código

¡El código siempre es bienvenido! 

- Arreglar bugs
- Implementar features
- Mejorar tests
- Optimizar performance

---

## 🛠️ Configuración del Entorno

### Prerrequisitos

```bash
Node.js >= 18.0. 0
npm >= 9.0.0
PostgreSQL 14+
Redis 7+ (opcional)
Git
```

### Instalación

```bash
# 1. Fork el repositorio
# Hacé click en "Fork" en GitHub

# 2. Clonar tu fork
git clone https://github.com/TU-USUARIO/botsitot. git
cd botsitot

# 3. Agregar el repositorio original como remote
git remote add upstream https://github.com/joseliviaa05-hub/botsitot.git

# 4.  Instalar dependencias
npm install

# 5. Configurar variables de entorno
cp .env.example .env
# Editar . env con tus credenciales

# 6. Configurar base de datos
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 7. Ejecutar tests
npm test

# 8. Iniciar en modo desarrollo
npm run dev
```

---

## 🔄 Flujo de Trabajo

### 1️⃣ Crear un Branch

```bash
# Actualizar tu main
git checkout main
git pull upstream main

# Crear branch para tu feature/fix
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/nombre-del-bug
```

### 2️⃣ Hacer Cambios

```bash
# Hacer tus cambios
code .

# Ver cambios
git status
git diff

# Agregar cambios
git add . 

# Commit (Husky ejecutará lint automáticamente)
git commit -m "feat: descripción del cambio"
```

### 3️⃣ Mantener tu Branch Actualizado

```bash
# Traer últimos cambios de upstream
git fetch upstream
git rebase upstream/main
```

### 4️⃣ Push y Pull Request

```bash
# Push a tu fork
git push origin feature/nombre-descriptivo

# Abrir Pull Request en GitHub
# Ir a tu fork en GitHub y hacer click en "New Pull Request"
```

---

## 🎨 Guía de Estilo

### TypeScript

```typescript
// ✅ BIEN: Usar tipos explícitos
function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ MAL: Evitar 'any' cuando sea posible
function getUser(id: any): any {
  return prisma.user.findUnique({ where: { id } });
}

// ✅ BIEN: Nombres descriptivos
const activeUsers = users.filter(u => u.activo);

// ❌ MAL: Nombres crípticos
const au = users.filter(u => u.activo);
```

### Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, punto y coma faltantes, etc
refactor: refactorización de código
test: agregar o modificar tests
chore: cambios en build, herramientas, etc
perf: mejoras de performance
```

**Ejemplos:**

```bash
feat: agregar endpoint de estadísticas de ventas
fix: corregir validación de email en registro
docs: actualizar guía de instalación en README
test: agregar tests para cliente. service
refactor: simplificar lógica de cálculo de precios
```

### Código

```typescript
// ═══════════════════════════════════════════════════════════════
// USAR SEPARADORES PARA SECCIONES GRANDES
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Usar guiones para subsecciones
// ─────────────────────────────────────────────────────────────

// Comentarios simples para líneas individuales
const result = calculateTotal(items); // Explicación breve
```

### Formato

El proyecto usa **ESLint** y **Prettier**:

```bash
# Verificar código
npm run lint

# Auto-fix issues
npm run lint:fix

# Formatear código
npm run format

# Verificar tipos TypeScript
npm run type-check
```

**Husky ejecutará automáticamente** lint y format en pre-commit. 

---

## 🔍 Proceso de Pull Request

### Checklist antes de abrir PR

- [ ] El código compila sin errores (`npm run build`)
- [ ] Todos los tests pasan (`npm test`)
- [ ] ESLint no tiene errores (`npm run lint`)
- [ ] El código está formateado (`npm run format`)
- [ ] Agregaste tests para código nuevo
- [ ] Actualizaste la documentación si es necesario
- [ ] El commit message sigue Conventional Commits
- [ ] El branch está actualizado con `main`

### Template de Pull Request

```markdown
## 📝 Descripción

Descripción clara de los cambios. 

## 🎯 Tipo de Cambio

- [ ] 🐛 Bug fix
- [ ] ✨ Nueva feature
- [ ] 📚 Documentación
- [ ] 🎨 Refactoring
- [ ] ⚡ Performance
- [ ] ✅ Tests

## 🧪 ¿Cómo se probó? 

Describe cómo probaste los cambios.

## 📸 Screenshots (si aplica)

Agregar capturas de pantalla. 

## ✅ Checklist

- [ ] Tests pasan
- [ ] Lint pasa
- [ ] Documentación actualizada
```

### Proceso de Review

1. **Un maintainer revisará tu PR** en 1-3 días
2. **Pueden solicitar cambios** - no te preocupes, es normal
3. **Hacé los cambios solicitados** y pushealos al mismo branch
4. **Una vez aprobado**, el maintainer hará merge

---

## 🐛 Reportar Bugs

### Antes de reportar

- [ ] Busca en [Issues existentes](https://github.com/joseliviaa05-hub/botsitot/issues)
- [ ] Verifica que sea reproducible
- [ ] Intenta con la última versión

### Template de Bug Report

```markdown
## 🐛 Descripción del Bug

Descripción clara y concisa del bug.

## 🔄 Pasos para Reproducir

1.  Ir a '...'
2. Hacer click en '...'
3. Ver error

## ✅ Comportamiento Esperado

Qué debería pasar. 

## ❌ Comportamiento Actual

Qué pasa actualmente.

## 📸 Screenshots

Si aplica, agregar screenshots. 

## 🖥️ Entorno

- OS: [ej.  Windows 11, macOS 14]
- Node.js: [ej.  20.10.0]
- npm: [ej. 10.2.0]
- Navegador: [ej. Chrome 120]

## 📝 Información Adicional

Cualquier otra información relevante.
```

---

## ✨ Solicitar Features

### Template de Feature Request

```markdown
## 💡 Descripción del Feature

Descripción clara del feature propuesto.

## 🎯 Problema que Resuelve

Qué problema específico resuelve.

## 💭 Solución Propuesta

Cómo debería funcionar.

## 🔄 Alternativas Consideradas

Otras soluciones que consideraste.

## 📸 Mockups/Ejemplos

Si aplica, agregar mockups o ejemplos.

## 🔥 Prioridad

- [ ] Alta
- [ ] Media
- [ ] Baja
```

---

## 📞 Contacto

¿Preguntas? ¿Necesitás ayuda?

- 🐛 **Bugs/Features:** [GitHub Issues](https://github.com/joseliviaa05-hub/botsitot/issues)
- 💬 **Discusiones:** [GitHub Discussions](https://github.com/joseliviaa05-hub/botsitot/discussions)
- 📧 **Email:** [Tu email si querés agregarlo]

---

## 📜 Licencia

Al contribuir, aceptás que tus contribuciones serán licenciadas bajo la [Licencia MIT](./LICENSE).

---

<div align="center">

**¡Gracias por contribuir a BotSitot!  🚀**

</div>