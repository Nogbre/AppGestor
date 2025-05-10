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
  const [filterType, setFilterType] = useState('PRESTAMO'); 
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  });

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
      setFilteredMovimientos(response.data.data.filter(m => m.tipo_movimiento === filterType));
      setPagination({
        page: response.data.paginacion.paginaActual,
        pageSize: response.data.paginacion.porPagina,
        total: response.data.paginacion.totalRegistros,
        totalPages: response.data.paginacion.totalPaginas
      });
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  useEffect(() => {
    let results = movimientos.filter(m => m.tipo_movimiento === filterType);
    
    
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
        <Text style={styles.cardQuantity}>
          {movimiento.tipo_movimiento === 'PRESTAMO' ? '-' : '+'}{movimiento.cantidad}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>
          {movimiento.insumo_nombre || 'Insumo no especificado'}
        </Text>

        <View style={styles.infoRow}>
          <Icon name="calendar" size={16} color="#fff" />
          <Text style={styles.infoText}>
            {new Date(movimiento.fecha_entregado).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="file-document-outline" size={16} color="#fff" />
          <Text style={styles.infoText}>Solicitud #{movimiento.id_solicitud}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => {
          setSelectedMovimiento(movimiento);
          setModalVisible(true);
        }}
      >
        <Text style={styles.detailsButtonText}>Ver detalles</Text>
      </TouchableOpacity>
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
                    Detalles del Movimiento
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Icon name="close" size={24} color="#592644" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Tipo de Movimiento:</Text>
                    <View style={[
                      styles.typeBadge,
                      selectedMovimiento.tipo_movimiento === 'PRESTAMO' 
                        ? styles.prestamoBadge 
                        : styles.devolucionBadge
                    ]}>
                      <Text style={styles.typeBadgeText}>
                        {selectedMovimiento.tipo_movimiento === 'PRESTAMO' ? 'SALIDA' : 'ENTRADA'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Insumo:</Text>
                    <Text style={styles.detailValue}>
                      {selectedMovimiento.insumo_nombre || 'No especificado'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Cantidad:</Text>
                    <Text style={[styles.detailValue, 
                      selectedMovimiento.tipo_movimiento === 'PRESTAMO' 
                        ? styles.negativeQuantity 
                        : styles.positiveQuantity]}>
                      {selectedMovimiento.tipo_movimiento === 'PRESTAMO' ? '-' : '+'}{selectedMovimiento.cantidad}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Fecha de Movimiento:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedMovimiento.fecha_entregado).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>ID Solicitud:</Text>
                    <Text style={styles.detailValue}>
                      {selectedMovimiento.id_solicitud}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Registrado por:</Text>
                    <Text style={styles.detailValue}>
                      {selectedMovimiento.responsable || 'Sistema'}
                    </Text>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeModalButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
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
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prestamoCard: {
    backgroundColor: '#E53935', 
  },
  devolucionCard: {
    backgroundColor: '#43A047', 
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  cardQuantity: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
    opacity: 0.9,
  },
  detailsButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#592644',
    flex: 1,
  },
  modalContent: {
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  positiveQuantity: {
    color: '#43A047',
    fontWeight: 'bold',
  },
  negativeQuantity: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  prestamoBadge: {
    backgroundColor: '#E53935',
  },
  devolucionBadge: {
    backgroundColor: '#43A047',
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeModalButton: {
    backgroundColor: '#592644',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingMore: {
    marginVertical: 10,
  },
});

export default InsumosPrestamoScreen;