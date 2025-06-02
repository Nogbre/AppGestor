import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = "https://universidad-la9h.onrender.com";

const SolicitudesScreen = ({ navigation }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Pendiente');

  const estados = ['Pendiente', 'Aprobada', 'Completada', 'Rechazada'];

  const fetchSolicitudes = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_URL}/solicitudes-uso`);
      setSolicitudes(response.data);
      setFilteredSolicitudes(response.data.filter(s => s.estado === selectedFilter));
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  useEffect(() => {
    if (solicitudes.length > 0) {
      const filtered = solicitudes.filter(s => s.estado === selectedFilter);
      setFilteredSolicitudes(filtered);
    }
  }, [selectedFilter, solicitudes]);

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      await axios.put(`${API_URL}/solicitudes-uso/${id}/estado`, { estado: nuevoEstado });
      fetchSolicitudes(); 
    } catch (error) {
      console.error(`Error al ${nuevoEstado.toLowerCase()} solicitud:`, error);
    }
  };

  const fetchDetallesSolicitud = async (id) => {
    try {
      setLoadingDetails(true);
      const response = await axios.get(`${API_URL}/solicitudes-uso/${id}`);
      setSelectedSolicitud(response.data);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching detalles:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getEstadoStyle = (estado) => {
    switch(estado) {
      case 'Aprobada': return styles.aprobada;
      case 'Pendiente': return styles.pendiente;
      case 'Completada': return styles.completada;
      case 'Rechazada': return styles.rechazada;
      default: return {};
    }
  };

  return (
    <View style={styles.container}>
      <Navbar navigation={navigation} />
      
      <View style={styles.scrollContent}>
        <Text style={styles.title}>Gestión de Solicitudes</Text>
        
        <View style={styles.summaryContainer}>
          <TouchableOpacity 
            style={[styles.summaryCard, selectedFilter === 'Pendiente' && styles.selectedFilter]}
            onPress={() => setSelectedFilter('Pendiente')}
          >
            <Text style={styles.summaryTitle}>Pendientes</Text>
            <Text style={styles.summaryValue}>
              {solicitudes.filter(s => s.estado === 'Pendiente').length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.summaryCard, selectedFilter === 'Aprobada' && styles.selectedFilter]}
            onPress={() => setSelectedFilter('Aprobada')}
          >
            <Text style={styles.summaryTitle}>Aprobadas</Text>
            <Text style={styles.summaryValue}>
              {solicitudes.filter(s => s.estado === 'Aprobada').length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.summaryCard, selectedFilter === 'Completada' && styles.selectedFilter]}
            onPress={() => setSelectedFilter('Completada')}
          >
            <Text style={styles.summaryTitle}>Completadas</Text>
            <Text style={styles.summaryValue}>
              {solicitudes.filter(s => s.estado === 'Completada').length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.summaryCard, selectedFilter === 'Rechazada' && styles.selectedFilter]}
            onPress={() => setSelectedFilter('Rechazada')}
          >
            <Text style={styles.summaryTitle}>Rechazadas</Text>
            <Text style={styles.summaryValue}>
              {solicitudes.filter(s => s.estado === 'Rechazada').length}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#592644" />
        ) : (
          <FlatList
            data={filteredSolicitudes}
            keyExtractor={(item) => item.id_solicitud.toString()}
            renderItem={({ item }) => (
              <View style={[styles.solicitudCard, getEstadoStyle(item.estado)]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>#{item.id_solicitud} - {item.docente_nombre}</Text>
                  <View style={[styles.estadoBadge, getEstadoStyle(item.estado)]}>
                    <Text style={styles.estadoText}>{item.estado}</Text>
                  </View>
                </View>
                
                <Text style={styles.cardText}>
                  <Text style={styles.cardLabel}>Práctica:</Text> {item.practica_titulo || 'Sin práctica'}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.cardLabel}>Laboratorio:</Text> {item.laboratorio_nombre}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.cardLabel}>Inicio:</Text> {new Date(item.fecha_hora_inicio).toLocaleString()}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.cardLabel}>Fin:</Text> {new Date(item.fecha_hora_fin).toLocaleString()}
                </Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.detalleButton}
                    onPress={() => fetchDetallesSolicitud(item.id_solicitud)}
                  >
                    <Text style={styles.detalleButtonText}>Ver detalles</Text>
                  </TouchableOpacity>

                  {item.estado === 'Pendiente' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.aprobarButton]}
                        onPress={() => handleEstadoChange(item.id_solicitud, 'Aprobada')}
                      >
                        <Text style={styles.actionButtonText}>Aprobar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rechazarButton]}
                        onPress={() => handleEstadoChange(item.id_solicitud, 'Rechazada')}
                      >
                        <Text style={styles.actionButtonText}>Rechazar</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {item.estado === 'Aprobada' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.completarButton]}
                      onPress={() => handleEstadoChange(item.id_solicitud, 'Completada')}
                    >
                      <Text style={styles.actionButtonText}>Completar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No se encontraron solicitudes {selectedFilter.toLowerCase()}</Text>
            }
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={fetchSolicitudes} 
              />
            }
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {loadingDetails ? (
              <ActivityIndicator size="large" color="#592644" />
            ) : selectedSolicitud && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalles de Solicitud</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Icon name="close" size={24} color="#592644" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="information" size={20} color="#592644" />
                      <Text style={styles.sectionTitle}>Información General</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <Text style={styles.modalLabel}>Estado:</Text>
                        <View style={[styles.estadoBadge, getEstadoStyle(selectedSolicitud.estado)]}>
                          <Text style={styles.estadoText}>{selectedSolicitud.estado}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="account" size={20} color="#592644" />
                      <Text style={styles.sectionTitle}>Docente</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <Text style={styles.modalLabel}>Nombre:</Text>
                        <Text style={styles.modalValue}>{selectedSolicitud.docente_nombre}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="flask" size={20} color="#592644" />
                      <Text style={styles.sectionTitle}>Práctica</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <Text style={styles.modalLabel}>Título:</Text>
                        <Text style={styles.modalValue}>{selectedSolicitud.practica_titulo || 'No especificado'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="office-building" size={20} color="#592644" />
                      <Text style={styles.sectionTitle}>Laboratorio</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <Text style={styles.modalLabel}>Nombre:</Text>
                        <Text style={styles.modalValue}>{selectedSolicitud.laboratorio_nombre}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="clock-outline" size={20} color="#592644" />
                      <Text style={styles.sectionTitle}>Horario</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <Text style={styles.modalLabel}>Inicio:</Text>
                        <Text style={styles.modalValue}>{new Date(selectedSolicitud.fecha_hora_inicio).toLocaleString()}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.modalLabel}>Fin:</Text>
                        <Text style={styles.modalValue}>{new Date(selectedSolicitud.fecha_hora_fin).toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="package-variant" size={20} color="#592644" />
                      <Text style={styles.sectionTitle}>Insumos Requeridos</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      {selectedSolicitud.insumos?.length > 0 ? (
                        selectedSolicitud.insumos.map((insumo, index) => (
                          <View key={index} style={styles.insumoItem}>
                            <Text style={styles.insumoName}>{insumo.insumo_nombre}</Text>
                            <View style={styles.insumoDetails}>
                              <Text style={styles.insumoDetail}>
                                <Text style={styles.insumoLabel}>Cantidad por grupo:</Text> {insumo.cantidad_por_grupo} {insumo.unidad_medida}
                              </Text>
                              <Text style={styles.insumoDetail}>
                                <Text style={styles.insumoLabel}>Cantidad total:</Text> {insumo.cantidad_total} {insumo.unidad_medida}
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.emptyText}>No hay insumos registrados</Text>
                      )}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 80,
    paddingBottom: 20,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#592644',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    width: '23%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedFilter: {
    borderWidth: 2,
    borderColor: '#592644',
  },
  summaryTitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#592644',
  },
  solicitudCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aprobada: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  pendiente: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  completada: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  rechazada: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  cardText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    lineHeight: 16,
  },
  cardLabel: {
    fontWeight: '600',
    color: '#333',
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  detalleButton: {
    backgroundColor: '#592644',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  detalleButtonText: {
    color: 'white',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  aprobarButton: {
    backgroundColor: '#4CAF50',
  },
  rechazarButton: {
    backgroundColor: '#F44336',
  },
  completarButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
    fontSize: 13,
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
  insumoItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  insumoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  insumoDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
  },
  insumoDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  insumoLabel: {
    fontWeight: '500',
    color: '#592644',
  },
});

export default SolicitudesScreen;