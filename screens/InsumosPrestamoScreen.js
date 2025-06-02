import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = "http://universidad-la9h.onrender.com";

const InsumosPrestamoScreen = ({ navigation }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState([]);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  });
  const [devolucionParcial, setDevolucionParcial] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);

  const fetchMovimientos = async (page = 1) => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_URL}/Movimientos-inventario`, {
        params: {
          page,
          pageSize: pagination.pageSize
        }
      });
      
      setMovimientos(response.data.data);
      setFilteredMovimientos(response.data.data);
      setPagination({
        page: response.data.paginacion.paginaActual,
        pageSize: response.data.paginacion.porPagina,
        total: response.data.paginacion.totalRegistros,
        totalPages: response.data.paginacion.totalPaginas
      });
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  useEffect(() => {
    let results = movimientos;
    
    if (filterType !== 'ALL') {
      results = movimientos.filter(m => m.tipo_movimiento === filterType);
    }
    
    if (searchTerm) {
      results = results.filter(m => 
        m.insumo_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.responsable?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id_solicitud?.toString().includes(searchTerm)
      );
    }
    
    setFilteredMovimientos(results);
  }, [searchTerm, filterType, movimientos]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchMovimientos(pagination.page + 1);
    }
  };

  const handleCompletar = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/solicitudes-uso/${id}`);
      const data = response.data;

      // Inicializar devolución parcial con todas las cantidades como devueltas
      const inicialDevolucion = {};
      data.insumos.forEach(insumo => {
        inicialDevolucion[insumo.id_insumo] = insumo.cantidad_total;
      });

      setDevolucionParcial(inicialDevolucion);
      setSelectedMovimiento(data);
      setShowDevolucionModal(true);
    } catch (error) {
      console.error('Error obteniendo detalles:', error);
      alert('Error al cargar los detalles de la solicitud');
    }
  };

  const handleCantidadDevuelta = (insumoId, cantidad) => {
    // Asegurarse que la cantidad esté entre 0 y el máximo disponible
    const insumo = selectedMovimiento.insumos.find(i => i.id_insumo === insumoId);
    const maxCantidad = insumo ? insumo.cantidad_total : 0;
    const nuevaCantidad = Math.max(0, Math.min(parseInt(cantidad) || 0, maxCantidad));

    setDevolucionParcial(prev => ({
      ...prev,
      [insumoId]: nuevaCantidad
    }));
  };

  const calcularNoDevueltos = () => {
    return selectedMovimiento.insumos.map(insumo => ({
      id_insumo: insumo.id_insumo,
      cantidad_no_devuelta: insumo.cantidad_total - (devolucionParcial[insumo.id_insumo] || 0)
    })).filter(item => item.cantidad_no_devuelta > 0);
  };

  const confirmarDevolucionInsumos = async () => {
    try {
      setLoading(true);
      const insumosNoDevueltos = calcularNoDevueltos();

      const response = await axios.post(
        `${API_URL}/solicitudes-uso/${selectedMovimiento.id_solicitud}/devolver`,
        {
          insumos_no_devueltos: insumosNoDevueltos
        }
      );

      if (response.status === 200) {
        alert(`Devolución registrada exitosamente!\nInsumos no devueltos: ${insumosNoDevueltos.length}`);
        setShowDevolucionModal(false);
        setDevolucionParcial({});
        fetchMovimientos();
      }
    } catch (error) {
      console.error('Error al confirmar devolución:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderMovementCard = (movimiento) => (
    <View key={movimiento.id_movimiento} style={[
      styles.card,
      movimiento.tipo_movimiento === 'PRESTAMO' ? styles.prestamoCard : styles.devolucionCard
    ]}>
      <View style={styles.cardHeader}>
        <View style={styles.typeIndicator}>
          <Icon 
            name={movimiento.tipo_movimiento === 'PRESTAMO' ? 'export' : 'import'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.typeText}>
            {movimiento.tipo_movimiento === 'PRESTAMO' ? 'SALIDA' : 'ENTRADA'}
          </Text>
        </View>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Cantidad</Text>
          <Text style={styles.cardQuantity}>
            {movimiento.tipo_movimiento === 'PRESTAMO' ? '-' : '+'}{movimiento.cantidad} {movimiento.unidad_medida}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>
          {movimiento.insumo_nombre || 'Insumo no especificado'}
        </Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={16} color="#fff" />
            <Text style={styles.infoText}>
              {new Date(movimiento.fecha_entregado).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="clock-outline" size={16} color="#fff" />
            <Text style={styles.infoText}>
              {new Date(movimiento.fecha_entregado).toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="file-document-outline" size={16} color="#fff" />
            <Text style={styles.infoText}>Solicitud #{movimiento.id_solicitud}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="account" size={16} color="#fff" />
            <Text style={styles.infoText}>{movimiento.responsable}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => {
            setSelectedMovimiento(movimiento);
            setModalVisible(true);
          }}
        >
          <Text style={styles.detailsButtonText}>Ver detalles</Text>
        </TouchableOpacity>

        {movimiento.estado === 'Aprobada' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompletar(movimiento.id_solicitud)}
          >
            <Text style={styles.completeButtonText}>Completar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && pagination.page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <Navbar navigation={navigation} />
        <ActivityIndicator size="large" color="#592644" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar navigation={navigation} />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchMovimientos(1)} />
        }
        contentContainerStyle={styles.scrollContent}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            handleLoadMore();
          }
        }}
      >
        <Text style={styles.title}>Movimientos de Inventario</Text>
        
       
        <View style={styles.filterContainer}>
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          
          <View style={styles.typeFilterContainer}>
            <TouchableOpacity
              style={[
                styles.typeFilterButton,
                filterType === 'ALL' && styles.activeTypeFilter
              ]}
              onPress={() => setFilterType('ALL')}
            >
              <Text style={[
                styles.typeFilterText,
                filterType === 'ALL' && styles.activeTypeFilterText
              ]}>
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeFilterButton,
                filterType === 'PRESTAMO' && styles.activeTypeFilter
              ]}
              onPress={() => setFilterType('PRESTAMO')}
            >
              <Text style={[
                styles.typeFilterText,
                filterType === 'PRESTAMO' && styles.activeTypeFilterText
              ]}>
                Salidas
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeFilterButton,
                filterType === 'DEVOLUCION' && styles.activeTypeFilter
              ]}
              onPress={() => setFilterType('DEVOLUCION')}
            >
              <Text style={[
                styles.typeFilterText,
                filterType === 'DEVOLUCION' && styles.activeTypeFilterText
              ]}>
                Entradas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredMovimientos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-alert-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>
              {movimientos.length === 0 
                ? 'No hay movimientos registrados' 
                : `No hay ${filterType === 'PRESTAMO' ? 'salidas' : 'entradas'} que coincidan`}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {filteredMovimientos.map(renderMovementCard)}
            {loading && pagination.page > 1 && (
              <ActivityIndicator size="small" color="#592644" style={styles.loadingMore} />
            )}
          </View>
        )}
      </ScrollView>

      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedMovimiento && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isCompleting ? "Control de Devolución de Insumos" : "Detalles del Movimiento"}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => {
                      setModalVisible(false);
                      setDevolucionParcial({});
                      setIsCompleting(false);
                    }}
                  >
                    <Icon name="close" size={24} color="#592644" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  {isCompleting ? (
                    <View style={styles.devolucionContainer}>
                      <View style={styles.devolucionHeader}>
                        <Text style={styles.devolucionTitle}>Insumos a Devolver</Text>
                      </View>
                      
                      {selectedMovimiento.insumos?.map((insumo, idx) => (
                        <View key={idx} style={styles.insumoRow}>
                          <View style={styles.insumoInfo}>
                            <Text style={styles.insumoNombre}>{insumo.insumo_nombre}</Text>
                            <Text style={styles.insumoCantidad}>
                              Total: {insumo.cantidad_total} {insumo.unidad_medida}
                            </Text>
                          </View>
                          
                          <View style={styles.devolucionInput}>
                            <Text style={styles.devolucionLabel}>Devueltos:</Text>
                            <TextInput
                              style={styles.cantidadInput}
                              keyboardType="numeric"
                              value={devolucionParcial[insumo.id_insumo]?.toString() || '0'}
                              onChangeText={(value) => handleCantidadDevuelta(insumo.id_insumo, value)}
                            />
                            <Text style={styles.noDevueltos}>
                              No devueltos: {insumo.cantidad_total - (devolucionParcial[insumo.id_insumo] || 0)}
                            </Text>
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={confirmarDevolucionInsumos}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.confirmButtonText}>Confirmar Devolución</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.modalSection}>
                        <View style={styles.sectionHeader}>
                          <Icon 
                            name={selectedMovimiento.tipo_movimiento === 'PRESTAMO' ? 'export' : 'import'} 
                            size={20} 
                            color="#592644" 
                          />
                          <Text style={styles.sectionTitle}>Información General</Text>
                        </View>
                        <View style={styles.sectionContent}>
                          <View style={styles.detailRow}>
                            <Text style={styles.modalLabel}>Tipo:</Text>
                            <View style={[
                              styles.estadoBadge, 
                              selectedMovimiento.tipo_movimiento === 'PRESTAMO' ? styles.prestamoBadge : styles.devolucionBadge
                            ]}>
                              <Text style={styles.estadoText}>
                                {selectedMovimiento.tipo_movimiento === 'PRESTAMO' ? 'SALIDA' : 'ENTRADA'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.modalLabel}>Fecha:</Text>
                            <Text style={styles.modalValue}>
                              {new Date(selectedMovimiento.fecha_entregado).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.modalSection}>
                        <View style={styles.sectionHeader}>
                          <Icon name="package-variant" size={20} color="#592644" />
                          <Text style={styles.sectionTitle}>Insumo</Text>
                        </View>
                        <View style={styles.sectionContent}>
                          <View style={styles.detailRow}>
                            <Text style={styles.modalLabel}>Nombre:</Text>
                            <Text style={styles.modalValue}>{selectedMovimiento.insumo_nombre}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.modalLabel}>Cantidad:</Text>
                            <Text style={styles.modalValue}>
                              {selectedMovimiento.cantidad} {selectedMovimiento.unidad_medida}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.modalSection}>
                        <View style={styles.sectionHeader}>
                          <Icon name="file-document-outline" size={20} color="#592644" />
                          <Text style={styles.sectionTitle}>Solicitud</Text>
                        </View>
                        <View style={styles.sectionContent}>
                          <View style={styles.detailRow}>
                            <Text style={styles.modalLabel}>Responsable:</Text>
                            <Text style={styles.modalValue}>{selectedMovimiento.responsable}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Devolución de Insumos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDevolucionModal}
        onRequestClose={() => {
          setShowDevolucionModal(false);
          setDevolucionParcial({});
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Control de Devolución de Insumos</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowDevolucionModal(false);
                  setDevolucionParcial({});
                }}
              >
                <Icon name="close" size={24} color="#592644" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.devolucionContainer}>
                <View style={styles.devolucionHeader}>
                  <Text style={styles.devolucionSubtitle}>
                    Solicitud #{selectedMovimiento?.id_solicitud}
                  </Text>
                  <Text style={styles.devolucionInfo}>
                    Responsable: {selectedMovimiento?.responsable}
                  </Text>
                </View>
                
                {selectedMovimiento?.insumos?.map((insumo, idx) => (
                  <View key={idx} style={styles.insumoRow}>
                    <View style={styles.insumoInfo}>
                      <Text style={styles.insumoNombre}>{insumo.insumo_nombre}</Text>
                      <Text style={styles.insumoCantidad}>
                        Total: {insumo.cantidad_total} {insumo.unidad_medida}
                      </Text>
                    </View>
                    
                    <View style={styles.devolucionInput}>
                      <Text style={styles.devolucionLabel}>Devueltos:</Text>
                      <TextInput
                        style={styles.cantidadInput}
                        keyboardType="numeric"
                        value={devolucionParcial[insumo.id_insumo]?.toString() || '0'}
                        onChangeText={(value) => handleCantidadDevuelta(insumo.id_insumo, value)}
                      />
                      <Text style={styles.noDevueltos}>
                        No devueltos: {insumo.cantidad_total - (devolucionParcial[insumo.id_insumo] || 0)}
                      </Text>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmarDevolucionInsumos}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirmar Devolución</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 80,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#592644',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  typeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeFilterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  activeTypeFilter: {
    backgroundColor: '#592644',
  },
  typeFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTypeFilterText: {
    color: '#fff',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  cardsContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#592644',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  prestamoCard: {
    backgroundColor: '#592644',
  },
  devolucionCard: {
    backgroundColor: '#2E7D32',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  quantityContainer: {
    alignItems: 'flex-end',
  },
  quantityLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  cardQuantity: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    minWidth: '45%',
  },
  infoText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    alignItems: 'center',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    padding: 12,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#592644',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#592644',
    marginLeft: 10,
  },
  sectionContent: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  prestamoBadge: {
    backgroundColor: '#592644',
  },
  devolucionBadge: {
    backgroundColor: '#2E7D32',
  },
  estadoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingMore: {
    marginVertical: 10,
  },
  devolucionContainer: {
    padding: 16,
  },
  devolucionHeader: {
    marginBottom: 20,
  },
  devolucionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#592644',
  },
  insumoRow: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insumoInfo: {
    flex: 1,
  },
  insumoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insumoCantidad: {
    fontSize: 14,
    color: '#666',
  },
  devolucionInput: {
    alignItems: 'flex-end',
  },
  devolucionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cantidadInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  noDevueltos: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: '#592644',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devolucionSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#592644',
    marginBottom: 4,
  },
  devolucionInfo: {
    fontSize: 14,
    color: '#666',
  },
});

export default InsumosPrestamoScreen;