// src/controllers/apiController.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 🌐 API CONTROLLER - Controlador de API para Dashboard
 * ═══════════════════════════════════════════════════════════════
 */

const cache = require('../utils/CacheManager');
const productService = require('../services/productService');
const clientService = require('../services/clientService');
const orderService = require('../services/orderService');
const imageService = require('../services/imageService');
const { AppError } = require('../middlewares/errorHandler');
const { validarCamposRequeridos, esPrecioValido } = require('../utils/validators');
const { normalizarTexto } = require('../utils/textHelpers');
const logger = require('../middlewares/logger');
const fs = require('fs');
const path = require('path');

class ApiController {
    // ═══════════════════════════════════════════════════════════
    // PRODUCTOS
    // ═══════════════════════════════════════════════════════════

    /**
     * GET /api/productos
     */
    async getProductos(req, res, next) {
        try {
            const productos = productService.obtenerTodosArray();
            
            logger.info(`✅ Enviando ${productos.length} productos al frontend`);
            
            res.json({
                success: true,
                total: productos.length,
                productos
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/productos/:id
     */
    async getProductoById(req, res, next) {
        try {
            const { id } = req.params;
            const partes = id.split('::');
            
            if (partes.length < 3) {
                throw new AppError('ID de producto inválido', 400);
            }
            
            const [categoria, subcategoria, ...nombrePartes] = partes;
            const nombre = nombrePartes.join('::');
            
            const producto = productService.obtenerProducto(categoria, subcategoria, nombre);
            
            if (!producto) {
                throw new AppError('Producto no encontrado', 404);
            }
            
            res.json({
                success: true,
                producto
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/productos
     */
    async createProducto(req, res, next) {
        try {
            const { categoria, subcategoria, nombre, precio, precio_desde, stock, unidad, codigo_barras, imagenes } = req.body;
            
            // Validar campos requeridos
            const validacion = validarCamposRequeridos(req.body, ['categoria', 'subcategoria', 'nombre']);
            
            if (!validacion.valido) {
                throw new AppError(validacion.errores.join(', '), 400);
            }
            
            // ✅ MEJORADO: Validar tipo de precio
            if (!precio && !precio_desde) {
                throw new AppError('Debes ingresar un precio (fijo o desde)', 400);
            }
            
            if (precio && precio_desde) {
                throw new AppError('Solo puedes usar precio fijo O precio desde, no ambos', 400);
            }
            
            if ((precio && !esPrecioValido(precio)) || (precio_desde && !esPrecioValido(precio_desde))) {
                throw new AppError('Precio inválido', 400);
            }
            
            // Preparar datos del producto
            const datosProducto = {
                stock: stock !== false
            };
            
            if (precio) {
                datosProducto.precio = parseFloat(precio);
            } else if (precio_desde) {
                datosProducto.precio_desde = parseFloat(precio_desde);
            }
            
            if (unidad) datosProducto.unidad = unidad.trim();
            if (codigo_barras) datosProducto.codigo_barras = codigo_barras.trim();
            if (imagenes && Array.isArray(imagenes)) datosProducto.imagenes = imagenes;
            
            // Crear producto
            const producto = productService.crear(categoria, subcategoria, nombre, datosProducto);
            
            logger.info(`✅ Producto creado: ${producto.nombre}`);
            
            res.status(201).json({
                success: true,
                mensaje: 'Producto creado exitosamente',
                producto
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/productos/:id
     * ✅ CORREGIDO: Ahora actualiza nombre y subcategoría correctamente
     */
    async updateProducto(req, res, next) {
        try {
            const { id } = req.params;
            const partes = id.split('::');
            
            if (partes.length < 3) {
                throw new AppError('ID de producto inválido', 400);
            }
            
            const [categoriaOriginal, subcategoriaOriginal, ...nombrePartes] = partes;
            const nombreOriginal = nombrePartes.join('::');
            
            logger.info(`📝 Actualizando producto: ${id}`);
            logger.debug('Body recibido:', req.body);
            
            const { 
                nombre: nombreNuevo,
                precio, 
                precio_desde, 
                unidad, 
                stock, 
                categoria: categoriaNueva, 
                subcategoria: subcategoriaNueva,
                codigo_barras,
                imagenes
            } = req.body;
            
            // ✅ MEJORADO: Validar tipo de precio
            if (precio && precio_desde) {
                throw new AppError('Solo puedes usar precio fijo O precio desde, no ambos', 400);
            }
            
            // Obtener producto actual
            const productos = cache.obtenerProductosSync();
            
            if (!productos[categoriaOriginal] || 
                !productos[categoriaOriginal][subcategoriaOriginal] ||
                !productos[categoriaOriginal][subcategoriaOriginal][nombreOriginal]) {
                throw new AppError('Producto no encontrado', 404);
            }
            
            const productoActual = productos[categoriaOriginal][subcategoriaOriginal][nombreOriginal];
            
            // ✅ Determinar nuevos valores (usar originales si no se envían nuevos)
            const categoriaFinal = categoriaNueva || categoriaOriginal;
            const subcategoriaFinal = subcategoriaNueva || subcategoriaOriginal;
            const nombreFinal = nombreNuevo || nombreOriginal;
            
            logger.info(`📋 Cambios detectados:`);
            logger.info(`   Categoría: ${categoriaOriginal} → ${categoriaFinal}`);
            logger.info(`   Subcategoría: ${subcategoriaOriginal} → ${subcategoriaFinal}`);
            logger.info(`   Nombre: ${nombreOriginal} → ${nombreFinal}`);
            
            // Preparar datos actualizados
            const datosActualizados = { ...productoActual };
            
            // ✅ MEJORADO: Actualizar precio (mutuamente excluyentes)
            if (precio !== undefined && precio !== null && precio !== '') {
                datosActualizados.precio = parseFloat(precio);
                delete datosActualizados.precio_desde; // Eliminar precio_desde
                logger.info(`   💰 Precio fijo: $${precio}`);
            } else if (precio_desde !== undefined && precio_desde !== null && precio_desde !== '') {
                datosActualizados.precio_desde = parseFloat(precio_desde);
                delete datosActualizados.precio; // Eliminar precio
                logger.info(`   💰 Precio desde: $${precio_desde}`);
            }
            
            // Actualizar otros campos
            if (unidad !== undefined) {
                datosActualizados.unidad = unidad && unidad.trim() !== '' ? unidad.trim() : null;
            }
            
            if (stock !== undefined) {
                datosActualizados.stock = stock;
            }
            
            if (codigo_barras !== undefined) {
                datosActualizados.codigo_barras = codigo_barras && codigo_barras.trim() !== '' ? codigo_barras.trim() : null;
            }
            
            if (imagenes !== undefined) {
                datosActualizados.imagenes = Array.isArray(imagenes) ? imagenes : [];
            }
            
            // ✅ Actualizar ID y referencias
            datosActualizados.id = `${categoriaFinal}::${subcategoriaFinal}::${nombreFinal}`;
            datosActualizados.nombre = nombreFinal;
            datosActualizados.categoria = categoriaFinal;
            datosActualizados.subcategoria = subcategoriaFinal;
            
            // ✅ CRÍTICO: Si cambió la ubicación o nombre, eliminar el viejo y crear el nuevo
            const cambioUbicacion = 
                categoriaOriginal !== categoriaFinal || 
                subcategoriaOriginal !== subcategoriaFinal || 
                nombreOriginal !== nombreFinal;
            
            if (cambioUbicacion) {
                logger.info('🔄 Detectado cambio de ubicación/nombre - Reorganizando...');
                
                // Crear nueva ubicación si no existe
                if (!productos[categoriaFinal]) {
                    productos[categoriaFinal] = {};
                }
                
                if (!productos[categoriaFinal][subcategoriaFinal]) {
                    productos[categoriaFinal][subcategoriaFinal] = {};
                }
                
                // Mover producto a nueva ubicación
                productos[categoriaFinal][subcategoriaFinal][nombreFinal] = datosActualizados;
                
                // Eliminar de la ubicación original
                delete productos[categoriaOriginal][subcategoriaOriginal][nombreOriginal];
                
                // Limpiar subcategoría vacía
                if (Object.keys(productos[categoriaOriginal][subcategoriaOriginal]).length === 0) {
                    delete productos[categoriaOriginal][subcategoriaOriginal];
                    logger.info(`🗑️ Subcategoría vacía eliminada: ${categoriaOriginal}/${subcategoriaOriginal}`);
                }
                
                // Limpiar categoría vacía
                if (Object.keys(productos[categoriaOriginal]).length === 0) {
                    delete productos[categoriaOriginal];
                    logger.info(`🗑️ Categoría vacía eliminada: ${categoriaOriginal}`);
                }
            } else {
                // Solo actualizar en la misma ubicación
                productos[categoriaOriginal][subcategoriaOriginal][nombreOriginal] = datosActualizados;
            }
            
            // ✅ Guardar cambios en el archivo
            const productosPath = path.join(__dirname, '../../data/lista-precios.json');
            fs.writeFileSync(productosPath, JSON.stringify(productos, null, 2), 'utf8');
            cache.invalidarProductos();
            
            logger.info(`✅ Producto actualizado exitosamente: ${nombreFinal}`);
            
            res.json({
                success: true,
                mensaje: 'Producto actualizado exitosamente',
                producto: datosActualizados
            });
        } catch (error) {
            logger.error('❌ Error al actualizar producto:', error);
            next(error);
        }
    }

    /**
     * DELETE /api/productos/:id
     */
    async deleteProducto(req, res, next) {
        try {
            const { id } = req.params;
            const partes = id.split('::');
            
            if (partes.length < 3) {
                throw new AppError('ID de producto inválido', 400);
            }
            
            const [categoria, subcategoria, ...nombrePartes] = partes;
            const nombre = nombrePartes.join('::');
            
            productService.eliminar(categoria, subcategoria, nombre);
            
            logger.info(`✅ Producto eliminado: ${nombre}`);
            
            res.json({
                success: true,
                mensaje: 'Producto eliminado exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/productos/buscar-codigo/:codigo
     */
    async buscarPorCodigo(req, res, next) {
        try {
            const { codigo } = req.params;
            
            logger.info(`🔍 Buscando producto por código: ${codigo}`);
            
            const producto = productService.buscarPorCodigo(codigo);
            
            if (!producto) {
                return res.json({
                    success: true,
                    encontrado: false,
                    mensaje: 'No se encontró ningún producto con ese código de barras'
                });
            }
            
            res.json({
                success: true,
                encontrado: true,
                producto
            });
        } catch (error) {
            next(error);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // CATEGORÍAS
    // ═══════════════════════════════════════════════════════════

    /**
     * GET /api/categorias
     */
    async getCategorias(req, res, next) {
        try {
            const categorias = productService.obtenerCategorias();
            
            res.json({
                success: true,
                total: categorias.length,
                categorias
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/categorias
     */
    async createCategoria(req, res, next) {
        try {
            const { nombre, subcategoria } = req.body;
            
            if (!nombre || !subcategoria) {
                throw new AppError('Nombre y subcategoría son requeridos', 400);
            }
            
            const nombreNormalizado = normalizarTexto(nombre);
            const subcategoriaNormalizada = normalizarTexto(subcategoria);
            
            const listaPrecios = cache.obtenerProductosSync();
            
            if (!listaPrecios[nombreNormalizado]) {
                listaPrecios[nombreNormalizado] = {};
            }
            
            if (!listaPrecios[nombreNormalizado][subcategoriaNormalizada]) {
                listaPrecios[nombreNormalizado][subcategoriaNormalizada] = {};
            }
            
            const dataPath = path.join(__dirname, '../../data/lista-precios.json');
            fs.writeFileSync(dataPath, JSON.stringify(listaPrecios, null, 2));
            cache.invalidarProductos();
            
            logger.info(`✅ Categoría creada: ${nombreNormalizado}/${subcategoriaNormalizada}`);
            
            res.status(201).json({
                success: true,
                mensaje: 'Categoría creada exitosamente',
                categoria: nombreNormalizado,
                subcategoria: subcategoriaNormalizada
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/categorias/:nombre
     */
    async updateCategoria(req, res, next) {
        try {
            const nombreActual = req.params.nombre;
            const { nuevoNombre } = req.body;

            if (!nuevoNombre || nuevoNombre.trim() === '') {
                throw new AppError('El nuevo nombre es obligatorio', 400);
            }

            const nombreActualNormalizado = normalizarTexto(nombreActual);
            const nuevoNombreNormalizado = normalizarTexto(nuevoNombre);

            logger.info(`✏️ Renombrando categoría: ${nombreActualNormalizado} → ${nuevoNombreNormalizado}`);

            const productos = cache.obtenerProductosSync();
            const categoriaExiste = Object.keys(productos).some(key => key === nombreActualNormalizado);

            if (!categoriaExiste) {
                throw new AppError(`La categoría "${nombreActual}" no existe`, 404);
            }

            if (nombreActualNormalizado !== nuevoNombreNormalizado) {
                const nuevoNombreExiste = Object.keys(productos).some(key => key === nuevoNombreNormalizado);
                
                if (nuevoNombreExiste) {
                    throw new AppError(`Ya existe una categoría con el nombre "${nuevoNombre}"`, 400);
                }
            }

            const categoriaData = productos[nombreActualNormalizado];
            productos[nuevoNombreNormalizado] = categoriaData;
            
            if (nombreActualNormalizado !== nuevoNombreNormalizado) {
                delete productos[nombreActualNormalizado];
            }

            for (const subcategoria in productos[nuevoNombreNormalizado]) {
                for (const nombreProducto in productos[nuevoNombreNormalizado][subcategoria]) {
                    const producto = productos[nuevoNombreNormalizado][subcategoria][nombreProducto];
                    producto.id = `${nuevoNombreNormalizado}::${subcategoria}::${nombreProducto}`;
                    producto.categoria = nuevoNombreNormalizado;
                }
            }

            const productosPath = path.join(__dirname, '../../data/lista-precios.json');
            fs.writeFileSync(productosPath, JSON.stringify(productos, null, 2));
            cache.invalidarProductos();

            logger.info(`✅ Categoría renombrada exitosamente`);

            res.json({ 
                success: true,
                mensaje: 'Categoría renombrada exitosamente',
                nombreAntiguo: nombreActual,
                nombreNuevo: nuevoNombre
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/categorias/:nombre
     */
    async deleteCategoria(req, res, next) {
        try {
            const { nombre } = req.params;
            
            const listaPrecios = cache.obtenerProductosSync();
            
            if (!listaPrecios[nombre]) {
                throw new AppError('Categoría no encontrada', 404);
            }
            
            delete listaPrecios[nombre];
            
            const dataPath = path.join(__dirname, '../../data/lista-precios.json');
            fs.writeFileSync(dataPath, JSON.stringify(listaPrecios, null, 2));
            cache.invalidarProductos();
            
            logger.info(`✅ Categoría eliminada: ${nombre}`);
            
            res.json({
                success: true,
                mensaje: 'Categoría eliminada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // CLIENTES
    // ═══════════════════════════════════════════════════════════

    /**
     * GET /api/clientes
     */
    async getClientes(req, res, next) {
        try {
            const clientes = clientService.obtenerTodos();
            
            res.json({
                success: true,
                total: clientes.length,
                clientes
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/clientes/:telefono
     */
    async getClienteByTelefono(req, res, next) {
        try {
            const { telefono } = req.params;
            const cliente = clientService.obtenerPorTelefono(telefono);
            
            if (!cliente) {
                throw new AppError('Cliente no encontrado', 404);
            }
            
            res.json({
                success: true,
                cliente
            });
        } catch (error) {
            next(error);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // IMÁGENES
    // ═══════════════════════════════════════════════════════════

    /**
     * POST /api/productos/imagen
     */
    async uploadImagen(req, res, next) {
        try {
            const { productoId, categoriaId, subcategoriaId } = req.body;
            
            if (!req.file) {
                throw new AppError('No se recibió ninguna imagen', 400);
            }
            
            logger.info(`📸 Subiendo imagen para: ${productoId}`);
            
            const resultado = await imageService.subirImagenProducto(
                req.file.buffer,
                req.file.mimetype,
                productoId,
                categoriaId,
                subcategoriaId
            );
            
            res.json(resultado);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/productos/imagen
     */
    async deleteImagen(req, res, next) {
        try {
            const { productoId, categoriaId, subcategoriaId, publicId } = req.body;
            
            logger.info(`🗑️ Eliminando imagen: ${publicId}`);
            
            await imageService.eliminarImagenDeProducto(
                productoId,
                categoriaId,
                subcategoriaId,
                publicId
            );
            
            res.json({
                success: true,
                mensaje: 'Imagen eliminada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/productos/:categoriaId/:subcategoriaId/:productoId/imagenes
     */
    async getImagenes(req, res, next) {
        try {
            const { categoriaId, subcategoriaId, productoId } = req.params;
            
            const imagenes = imageService.obtenerImagenesProducto(
                categoriaId,
                subcategoriaId,
                productoId
            );
            
            res.json({
                success: true,
                total: imagenes.length,
                imagenes
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/productos/imagenes/reordenar
     */
    async reordenarImagenes(req, res, next) {
        try {
            const { productoId, categoriaId, subcategoriaId, imagenesOrdenadas } = req.body;
            
            logger.info(`🔄 Reordenando imágenes para: ${productoId}`);
            
            const imagenes = await imageService.reordenarImagenes(
                productoId,
                categoriaId,
                subcategoriaId,
                imagenesOrdenadas
            );
            
            res.json({
                success: true,
                mensaje: 'Orden de imágenes actualizado',
                imagenes
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ApiController();