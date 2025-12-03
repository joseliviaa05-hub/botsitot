// src/screens/ProductoEditScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../utils/colors';
import { 
  actualizarProducto, 
  crearProducto, 
  eliminarProducto,
  getCategorias,
  validarProducto,
  formatearTexto,
} from '../services/api';

const ProductoEditScreen = ({ route, navigation }) => {
  const { producto, codigoBarras } = route.params || {}; // ✅ NUEVO: codigoBarras desde escáner
  const esNuevo = !producto;

  // Estados del formulario
  const [nombre, setNombre] = useState(producto?.nombre.replace(/_/g, ' ') || '');
  const [categoria, setCategoria] = useState(producto?.categoria || '');
  const [subcategoria, setSubcategoria] = useState(producto?.subcategoria.replace(/_/g, ' ') || '');
  const [tipoPrecio, setTipoPrecio] = useState(producto?.precio ? 'fijo' : 'desde');
  const [precio, setPrecio] = useState(producto?.precio?.toString() || '');
  const [precioDesde, setPrecioDesde] = useState(producto?.precio_desde?.toString() || '');
  const [unidad, setUnidad] = useState(producto?.unidad || '');
  const [stock, setStock] = useState(producto?.stock !== false);
  const [codigoBarrasInput, setCodigoBarrasInput] = useState(producto?.codigo_barras || codigoBarras || ''); // ✅ NUEVO
  
  // Estados auxiliares
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    cargarCategorias();
  }, []);

  // ✅ NUEVO: Si viene código de barras desde el escáner, mostrarlo
  useEffect(() => {
    if (codigoBarras) {
      setCodigoBarrasInput(codigoBarras);
      console.log('📸 Código de barras recibido:', codigoBarras);
    }
  }, [codigoBarras]);

  const cargarCategorias = async () => {
    try {
      const datos = await getCategorias();
      setCategorias(datos);
    } catch (error) {
      console.error('❌ Error al cargar categorías:', error);
    }
  };

  const cambiarTipoPrecio = (tipo) => {
    setTipoPrecio(tipo);
    if (tipo === 'fijo') {
      setPrecioDesde('');
    } else {
      setPrecio('');
    }
  };

  const validarFormulario = () => {
    const errores = [];

    if (!nombre.trim()) {
      errores.push('El nombre del producto es obligatorio');
    }

    if (esNuevo) {
      if (!categoria.trim()) {
        errores.push('La categoría es obligatoria');
      }
      if (!subcategoria.trim()) {
        errores.push('La subcategoría es obligatoria');
      }
    } else {
      if (subcategoria && !subcategoria.trim()) {
        errores.push('La subcategoría no puede estar vacía');
      }
    }

    if (!precio.trim() && !precioDesde.trim()) {
      errores.push('Debes ingresar un precio (fijo o desde)');
    }

    if (precio.trim() && precioDesde.trim()) {
      errores.push('Solo puedes usar precio fijo O precio desde, no ambos');
    }

    if (precio.trim() && (isNaN(precio) || parseFloat(precio) <= 0)) {
      errores.push('El precio debe ser un número mayor a 0');
    }

    if (precioDesde.trim() && (isNaN(precioDesde) || parseFloat(precioDesde) <= 0)) {
      errores.push('El precio desde debe ser un número mayor a 0');
    }

    if (errores.length > 0) {
      Alert.alert('Errores de validación', errores.join('\n\n'));
      return false;
    }

    return true;
  };

  const guardarProducto = async () => {
    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const datos = {
        nombre: nombre.trim(),
        stock: stock,
      };

      // Agregar precio según el tipo seleccionado
      if (tipoPrecio === 'fijo' && precio.trim()) {
        datos.precio = parseFloat(precio);
      } else if (tipoPrecio === 'desde' && precioDesde.trim()) {
        datos.precio_desde = parseFloat(precioDesde);
      }

      // Agregar unidad si existe
      if (unidad.trim()) {
        datos.unidad = unidad.trim();
      }

      // ✅ NUEVO: Agregar código de barras si existe
      if (codigoBarrasInput.trim()) {
        datos.codigo_barras = codigoBarrasInput.trim();
      }

      if (esNuevo) {
        // Crear producto nuevo
        datos.categoria = categoria.trim();
        datos.subcategoria = subcategoria.trim();
        
        console.log('📤 Creando producto:', datos);
        
        await crearProducto(datos);
        
        Alert.alert(
          '✅ Éxito',
          'Producto creado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Actualizar producto existente
        if (subcategoria.trim() && subcategoria.trim() !== producto.subcategoria) {
          datos.subcategoria = subcategoria.trim();
        }
        
        console.log('📤 Actualizando producto:', producto.id, datos);
        
        await actualizarProducto(producto.id, datos);
        
        Alert.alert(
          '✅ Éxito',
          'Producto actualizado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('❌ Error al guardar producto:', error);
      
      const mensajeError = error.response?.data?.error || error.message || 'Error desconocido';
      
      Alert.alert(
        'Error al guardar',
        mensajeError,
        [
          { text: 'Reintentar', onPress: guardarProducto },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const eliminar = () => {
    Alert.alert(
      '⚠️ Confirmar eliminación',
      `¿Estás seguro de eliminar "${formatearTexto(producto.nombre)}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🗑️ Eliminando producto:', producto.id);
              
              await eliminarProducto(producto.id);
              
              Alert.alert(
                '✅ Éxito',
                'Producto eliminado correctamente',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
              
              const mensajeError = error.response?.data?.error || error.message || 'Error desconocido';
              
              Alert.alert('Error al eliminar', mensajeError);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const seleccionarCategoria = (cat) => {
    setCategoria(cat.nombre);
    setMostrarSugerencias(false);
  };

  // ✅ NUEVO: Abrir escáner para asignar código de barras
// const abrirEscanerParaCodigo = () => {
//    navigation.navigate('BarcodeScanner', {
//      onScan: (codigo) => {
//        setCodigoBarrasInput(codigo);
//        console.log('📸 Código asignado:', codigo);
//      },
//      modo: 'asignar',
//    });
//  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Nombre del producto */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nombre del producto *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Cuaderno A4 Tapa Dura"
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={Colors.gray}
              autoCapitalize="words"
            />
            <Text style={styles.hint}>
              💡 Puedes usar mayúsculas y espacios (se normalizarán automáticamente)
            </Text>
          </View>

          {/* ✅ NUEVO: Código de barras */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Código de barras (opcional)
            </Text>
            <View style={styles.codigoBarrasContainer}>
              <TextInput
                style={[styles.input, styles.codigoBarrasInput]}
                placeholder="7790123456789"
                value={codigoBarrasInput}
                onChangeText={setCodigoBarrasInput}
                placeholderTextColor={Colors.gray}
                keyboardType="numeric"
              />
              {/* BOTÓN DE ESCÁNER COMENTADO
              <TouchableOpacity
                style={styles.scanIconButton}
                onPress={abrirEscanerParaCodigo}
              >
                <Ionicons name="barcode" size={24} color={Colors.primary} />
              </TouchableOpacity>
              */}
            </View>
            <Text style={styles.hint}>
              📸 Escanea el código de barras o ingrésalo manualmente
            </Text>
          </View>

          {/* Categoría (solo al crear) */}
          {esNuevo && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Categoría *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Librería, Cotillón, Juguetería"
                value={categoria}
                onChangeText={(text) => {
                  setCategoria(text);
                  setMostrarSugerencias(text.length > 0);
                }}
                placeholderTextColor={Colors.gray}
                autoCapitalize="words"
              />
              <Text style={styles.hint}>
                💡 Puedes usar espacios y mayúsculas
              </Text>
              
              {/* Sugerencias de categorías existentes */}
              {mostrarSugerencias && categorias.length > 0 && (
                <View style={styles.sugerenciasContainer}>
                  <Text style={styles.sugerenciasTitle}>Categorías existentes:</Text>
                  {categorias.map((cat) => (
                    <TouchableOpacity
                      key={cat.nombre}
                      style={styles.sugerenciaBtn}
                      onPress={() => seleccionarCategoria(cat)}
                    >
                      <Text style={styles.sugerenciaText}>
                        {formatearTexto(cat.nombre)}
                      </Text>
                      <Text style={styles.sugerenciaCount}>
                        ({cat.total_productos})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Subcategoría */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Subcategoría *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Escolar, Fiesta, Peluches"
              value={subcategoria}
              onChangeText={setSubcategoria}
              placeholderTextColor={Colors.gray}
              autoCapitalize="words"
              editable={esNuevo || true}
            />
            <Text style={styles.hint}>
              💡 Puedes usar espacios y mayúsculas
            </Text>
          </View>

          {/* Tipo de precio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de precio *</Text>
            <View style={styles.tipoPrecioContainer}>
              <TouchableOpacity
                style={[
                  styles.tipoPrecioBtn,
                  tipoPrecio === 'fijo' && styles.tipoPrecioBtnActivo
                ]}
                onPress={() => cambiarTipoPrecio('fijo')}
              >
                <Ionicons
                  name={tipoPrecio === 'fijo' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={tipoPrecio === 'fijo' ? Colors.primary : Colors.gray}
                />
                <Text style={[
                  styles.tipoPrecioText,
                  tipoPrecio === 'fijo' && styles.tipoPrecioTextActivo
                ]}>
                  Precio fijo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipoPrecioBtn,
                  tipoPrecio === 'desde' && styles.tipoPrecioBtnActivo
                ]}
                onPress={() => cambiarTipoPrecio('desde')}
              >
                <Ionicons
                  name={tipoPrecio === 'desde' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={tipoPrecio === 'desde' ? Colors.primary : Colors.gray}
                />
                <Text style={[
                  styles.tipoPrecioText,
                  tipoPrecio === 'desde' && styles.tipoPrecioTextActivo
                ]}>
                  Precio desde
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Precio fijo o Precio desde */}
          <View style={styles.row}>
            {tipoPrecio === 'fijo' ? (
              <View style={[styles.inputGroup, styles.fullWidth]}>
                <Text style={styles.label}>Precio fijo ($) *</Text>
                <View style={styles.precioInputContainer}>
                  <Text style={styles.precioSymbol}>$</Text>
                  <TextInput
                    style={[styles.input, styles.precioInput]}
                    placeholder="1500"
                    value={precio}
                    onChangeText={setPrecio}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.gray}
                  />
                </View>
              </View>
            ) : (
              <View style={[styles.inputGroup, styles.fullWidth]}>
                <Text style={styles.label}>Precio desde ($) *</Text>
                <View style={styles.precioInputContainer}>
                  <Text style={styles.precioSymbol}>$</Text>
                  <TextInput
                    style={[styles.input, styles.precioInput]}
                    placeholder="1000"
                    value={precioDesde}
                    onChangeText={setPrecioDesde}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.gray}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Unidad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unidad (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: c/u, kg, mt, x10"
              value={unidad}
              onChangeText={setUnidad}
              placeholderTextColor={Colors.gray}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              💡 Se mostrará junto al precio (ej: $1500 c/u)
            </Text>
          </View>

          {/* Stock */}
          <View style={styles.switchGroup}>
            <View style={styles.switchLabel}>
              <Ionicons
                name={stock ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={stock ? Colors.success : Colors.danger}
              />
              <View>
                <Text style={styles.label}>
                  {stock ? 'Producto disponible' : 'Sin stock'}
                </Text>
                <Text style={styles.switchHint}>
                  {stock 
                    ? 'El producto se mostrará como disponible' 
                    : 'El producto se marcará como agotado'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={stock}
              onValueChange={setStock}
              trackColor={{ false: Colors.lightGray, true: Colors.success }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.lightGray}
            />
          </View>

          {/* Información adicional */}
          {!esNuevo && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Información del producto</Text>
                <Text style={styles.infoText}>
                  Categoría: {formatearTexto(producto.categoria)}
                </Text>
                <Text style={styles.infoText}>
                  ID: {producto.id}
                </Text>
                {producto.codigo_barras && (
                  <Text style={styles.infoText}>
                    Código: {producto.codigo_barras}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={guardarProducto}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.gradientSuccess}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons 
                    name={esNuevo ? 'add-circle' : 'checkmark-circle'} 
                    size={24} 
                    color={Colors.white} 
                  />
                  <Text style={styles.saveButtonText}>
                    {esNuevo ? 'Crear Producto' : 'Guardar Cambios'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {!esNuevo && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={eliminar}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={20} color={Colors.danger} />
              <Text style={styles.deleteButtonText}>Eliminar Producto</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  fullWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  hint: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
    lineHeight: 16,
  },
  codigoBarrasContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  codigoBarrasInput: {
    flex: 1,
  },
  scanIconButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  sugerenciasContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  sugerenciasTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 8,
  },
  sugerenciaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderRadius: 6,
    marginBottom: 4,
  },
  sugerenciaText: {
    fontSize: 14,
    color: Colors.dark,
    fontWeight: '500',
  },
  sugerenciaCount: {
    fontSize: 12,
    color: Colors.gray,
  },
  tipoPrecioContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tipoPrecioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  tipoPrecioBtnActivo: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  tipoPrecioText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  tipoPrecioTextActivo: {
    color: Colors.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  precioInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  precioSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
    paddingLeft: 12,
  },
  precioInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginTop: 8,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchHint: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginTop: 8,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 18,
  },
  buttonsContainer: {
    gap: 12,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductoEditScreen;