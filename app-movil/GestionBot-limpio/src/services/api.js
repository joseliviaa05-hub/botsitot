// src/services/api.js
import axios from 'axios';

// ═══════════════════════════════════════
// 🔧 CONFIGURACIÓN DE LA API
// ═══════════════════════════════════════

// ⚠️ IMPORTANTE: Cambiar esta URL según tu configuración
// Opción 1: Si pruebas en emulador Android
// const API_URL = 'http://10.0.2.2:3000/api';

// Opción 2: Si pruebas en dispositivo físico en la misma red WiFi
// Reemplaza 192.168.X.X con la IP de tu PC
// const API_URL = 'http://192.168.1.100:3000/api';

// Opción 3: Para desarrollo local (tu configuración actual)
const API_URL = 'http://192.168.0.72:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ═══════════════════════════════════════
// 🔧 UTILIDADES AUXILIARES
// ═══════════════════════════════════════

/**
 * Normalizar texto (igual que en el backend)
 * Convierte a minúsculas, elimina tildes, reemplaza espacios por guiones bajos
 */
export const normalizarTexto = (texto) => {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
    .replace(/\s+/g, '_') // Espacios → guiones bajos
    .replace(/_{2,}/g, '_') // Múltiples guiones → uno solo
    .replace(/^_|_$/g, ''); // Eliminar guiones al inicio/final
};

/**
 * Formatear texto para mostrar en la app
 * Convierte guiones bajos en espacios y capitaliza cada palabra
 */
export const formatearTexto = (texto) => {
  if (!texto) return '';
  
  return texto
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Parsear ID de producto (con nuevo formato ::)
 * Ejemplo: "juguetes::juegos_de_mesa::generala"
 */
export const parsearIdProducto = (id) => {
  if (!id) return null;
  
  const partes = id.split('::');
  
  if (partes.length < 3) {
    console.warn('ID de producto inválido:', id);
    return null;
  }

  return {
    categoria: partes[0],
    subcategoria: partes[1],
    nombre: partes.slice(2).join('::'),
  };
};

/**
 * Construir ID de producto
 */
export const construirIdProducto = (categoria, subcategoria, nombre) => {
  return `${categoria}::${subcategoria}::${nombre}`;
};

// ═══════════════════════════════════════
// 📊 ESTADÍSTICAS
// ═══════════════════════════════════════

export const getEstadisticas = async () => {
  try {
    const response = await api.get('/estadisticas');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 📦 PEDIDOS
// ═══════════════════════════════════════

export const getPedidos = async () => {
  try {
    const response = await api.get('/pedidos');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error.response?.data || error.message);
    throw error;
  }
};

export const getPedido = async (id) => {
  try {
    const response = await api.get(`/pedidos/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener pedido:', error.response?.data || error.message);
    throw error;
  }
};

export const marcarPedidoCompletado = async (id) => {
  try {
    const response = await api.put(`/pedidos/${id}`, {
      estado: 'completado'
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar pedido:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 🏷️ PRODUCTOS
// ═══════════════════════════════════════

export const getProductos = async () => {
  try {
    const response = await api.get('/productos');
    console.log(`✅ ${response.data.length} productos cargados`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener productos:', error.response?.data || error.message);
    throw error;
  }
};

export const getCategorias = async () => {
  try {
    const response = await api.get('/categorias');
    console.log(`✅ ${response.data.length} categorías cargadas`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ NUEVA: Buscar producto por código de barras
export const buscarProductoPorCodigo = async (codigo) => {
  try {
    console.log('🔍 Buscando producto por código:', codigo);
    const response = await api.get(`/productos/buscar-codigo/${codigo}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al buscar por código:', error.response?.data || error.message);
    throw error;
  }
};

export const crearProducto = async (producto) => {
  try {
    // ✅ VALIDACIONES ANTES DE ENVIAR
    if (!producto.categoria || producto.categoria.trim() === '') {
      throw new Error('La categoría es obligatoria');
    }

    if (!producto.subcategoria || producto.subcategoria.trim() === '') {
      throw new Error('La subcategoría es obligatoria');
    }

    if (!producto.nombre || producto.nombre.trim() === '') {
      throw new Error('El nombre del producto es obligatorio');
    }

    if (!producto.precio && !producto.precio_desde) {
      throw new Error('Debes ingresar un precio (fijo o "desde")');
    }

    if (producto.precio && producto.precio_desde) {
      throw new Error('Solo puedes usar precio fijo O precio desde, no ambos');
    }

    // Asegurar que los valores numéricos sean correctos
    const datos = {
      ...producto,
      precio: producto.precio ? parseFloat(producto.precio) : undefined,
      precio_desde: producto.precio_desde ? parseFloat(producto.precio_desde) : undefined,
      stock: producto.stock !== undefined ? producto.stock : true,
      codigo_barras: producto.codigo_barras ? producto.codigo_barras.trim() : undefined, // ✅ NUEVO
    };

    console.log('📤 Creando producto:', datos);

    const response = await api.post('/productos', datos);
    
    console.log('✅ Producto creado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear producto:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarProducto = async (id, producto) => {
  try {
    // ✅ VALIDACIONES
    if (producto.precio && producto.precio_desde) {
      throw new Error('Solo puedes usar precio fijo O precio desde, no ambos');
    }

    if (producto.subcategoria && producto.subcategoria.trim() === '') {
      throw new Error('La subcategoría no puede estar vacía');
    }

    // Incluir nuevo_nombre si cambió el nombre
    const datos = { ...producto };
    
    if (producto.nombre) {
      datos.nuevo_nombre = producto.nombre.trim();
    }

    // Asegurar valores numéricos correctos
    if (datos.precio !== undefined) {
      datos.precio = parseFloat(datos.precio);
      delete datos.precio_desde; // Eliminar el otro tipo de precio
    }

    if (datos.precio_desde !== undefined) {
      datos.precio_desde = parseFloat(datos.precio_desde);
      delete datos.precio; // Eliminar el otro tipo de precio
    }

    // ✅ NUEVO: Incluir código de barras
    if (datos.codigo_barras !== undefined) {
      datos.codigo_barras = datos.codigo_barras ? datos.codigo_barras.trim() : null;
    }

    console.log('📤 Actualizando producto:', id, datos);

    const response = await api.put(`/productos/${id}`, datos);
    
    console.log('✅ Producto actualizado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error.response?.data || error.message);
    throw error;
  }
};

export const eliminarProducto = async (id) => {
  try {
    console.log('🗑️ Eliminando producto:', id);
    
    const response = await api.delete(`/productos/${id}`);
    
    console.log('✅ Producto eliminado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 📁 CATEGORÍAS (NUEVAS FUNCIONES)
// ═══════════════════════════════════════

export const crearCategoria = async (nombre, subcategoria) => {
  try {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la categoría es obligatorio');
    }

    if (!subcategoria || subcategoria.trim() === '') {
      throw new Error('La subcategoría es obligatoria');
    }

    console.log('📤 Creando categoría:', nombre, 'con subcategoría:', subcategoria);

    const response = await api.post('/categorias', {
      nombre: nombre.trim(),
      subcategoria: subcategoria.trim(),
    });
    
    console.log('✅ Categoría creada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear categoría:', error.response?.data || error.message);
    throw error;
  }
};

export const editarNombreCategoria = async (nombreActual, nuevoNombre) => {
  try {
    if (!nuevoNombre || nuevoNombre.trim() === '') {
      throw new Error('El nuevo nombre no puede estar vacío');
    }

    console.log('✏️ Renombrando categoría:', nombreActual, '→', nuevoNombre);

    const response = await api.put(`/categorias/${nombreActual}`, {
      nuevoNombre: nuevoNombre.trim(),
    });
    
    console.log('✅ Categoría renombrada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al renombrar categoría:', error.response?.data || error.message);
    throw error;
  }
};

export const eliminarCategoria = async (nombre) => {
  try {
    console.log('🗑️ Eliminando categoría:', nombre);
    
    const response = await api.delete(`/categorias/${nombre}`);
    
    console.log('✅ Categoría eliminada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar categoría:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 👥 CLIENTES
// ═══════════════════════════════════════

export const getClientes = async () => {
  try {
    const response = await api.get('/clientes');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error.response?.data || error.message);
    throw error;
  }
};

export const getCliente = async (telefono) => {
  try {
    const response = await api.get(`/clientes/${telefono}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener cliente:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// ⚙️ CONFIGURACIÓN
// ═══════════════════════════════════════

export const getConfiguracion = async () => {
  try {
    const response = await api.get('/configuracion');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener configuración:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarConfiguracion = async (datos) => {
  try {
    console.log('📤 Actualizando configuración:', datos);
    
    const response = await api.put('/configuracion', datos);
    
    console.log('✅ Configuración actualizada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar configuración:', error.response?.data || error.message);
    throw error;
  }
};

export const getConfiguracionPedidos = async () => {
  try {
    const response = await api.get('/configuracion/pedidos');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener configuración de pedidos:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarConfiguracionPedidos = async (datos) => {
  try {
    console.log('📤 Actualizando configuración de pedidos:', datos);
    
    const response = await api.put('/configuracion/pedidos', datos);
    
    console.log('✅ Configuración de pedidos actualizada');
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar configuración de pedidos:', error.response?.data || error.message);
    throw error;
  }
};

export const getPalabrasClave = async () => {
  try {
    const response = await api.get('/configuracion/palabras-clave');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener palabras clave:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarPalabrasClave = async (datos) => {
  try {
    const response = await api.put('/configuracion/palabras-clave', datos);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar palabras clave:', error.response?.data || error.message);
    throw error;
  }
};

export const getRespuestas = async () => {
  try {
    const response = await api.get('/respuestas');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener respuestas:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarRespuestas = async (datos) => {
  try {
    const response = await api.put('/respuestas', datos);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar respuestas:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 🤖 CONTROL DEL BOT
// ═══════════════════════════════════════

export const getEstadoBot = async () => {
  try {
    const response = await api.get('/estado');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener estado del bot:', error.response?.data || error.message);
    throw error;
  }
};

export const toggleRespuestas = async () => {
  try {
    console.log('🔄 Cambiando estado de respuestas automáticas...');
    
    const response = await api.post('/toggle-respuestas');
    
    console.log('✅ Estado cambiado:', response.data.estado ? 'Activadas' : 'Pausadas');
    return response.data;
  } catch (error) {
    console.error('❌ Error al cambiar estado de respuestas:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 🔧 FUNCIONES AUXILIARES DE VALIDACIÓN
// ═══════════════════════════════════════

/**
 * Validar producto antes de crear/actualizar
 */
export const validarProducto = (producto) => {
  const errores = [];

  if (!producto.categoria || producto.categoria.trim() === '') {
    errores.push('La categoría es obligatoria');
  }

  if (!producto.subcategoria || producto.subcategoria.trim() === '') {
    errores.push('La subcategoría es obligatoria');
  }

  if (!producto.nombre || producto.nombre.trim() === '') {
    errores.push('El nombre del producto es obligatorio');
  }

  if (!producto.precio && !producto.precio_desde) {
    errores.push('Debes ingresar un precio (fijo o "desde")');
  }

  if (producto.precio && producto.precio_desde) {
    errores.push('Solo puedes usar precio fijo O precio desde, no ambos');
  }

  if (producto.precio && (isNaN(producto.precio) || producto.precio <= 0)) {
    errores.push('El precio debe ser un número mayor a 0');
  }

  if (producto.precio_desde && (isNaN(producto.precio_desde) || producto.precio_desde <= 0)) {
    errores.push('El precio desde debe ser un número mayor a 0');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};

/**
 * Formatear precio para mostrar
 */
export const formatearPrecio = (precio, unidad = '') => {
  if (!precio && precio !== 0) return '';
  
  const precioFormateado = parseFloat(precio).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return unidad ? `$${precioFormateado} ${unidad}` : `$${precioFormateado}`;
};

/**
 * Formatear fecha
 */
export const formatearFecha = (isoString) => {
  if (!isoString) return '';
  
  const fecha = new Date(isoString);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const año = fecha.getFullYear();
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  
  return `${dia}/${mes}/${año} ${hora}:${minutos}`;
};

export default api;