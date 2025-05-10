import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Dimensions,
  Modal,
  Pressable
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Navbar from '../components/Navbar';
import Card from '../components/Card';

const { width } = Dimensions.get('window');
const NAVBAR_HEIGHT = 80;


LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
};
LocaleConfig.defaultLocale = 'es';

export default function HomeScreen({ navigation }) {
  
  const [graficoData, setGraficoData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [solicitudesPieData, setSolicitudesPieData] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [insumos, setInsumos] = useState([]);
  const [totalInsumos, setTotalInsumos] = useState(0);
  const [stockCritico, setStockCritico] = useState(0);
  const [solicitudesUso, setSolicitudesUso] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateDetails, setSelectedDateDetails] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const stored = await AsyncStorage.getItem('encargado');
      const parsed = JSON.parse(stored);
      if (!parsed?.id_encargado) return;

      const [graficoRes, insumosRes, solicitudesUsoRes] = await Promise.all([
        axios.get('https://universidad-la9h.onrender.com/top-docentes-laboratorios'),
        axios.get(`https://universidad-la9h.onrender.com/insumos?id_encargado=${parsed.id_encargado}`),
        axios.get('http://universidad-la9h.onrender.com/solicitudes-uso')
      ]);

      
      setGraficoData({
        labels: graficoRes.data.map(item => ` ${item.nombre_docente} `),
        datasets: [{ data: graficoRes.data.map(item => item.total_laboratorios) }],
      });

     
      setInsumos(insumosRes.data);
      setTotalInsumos(insumosRes.data.length);
      const critico = insumosRes.data.filter(insumo => 
        parseInt(insumo.stock_actual) <= parseInt(insumo.stock_minimo)
      ).length;
      setStockCritico(critico);

      
      const solicitudes = solicitudesUsoRes.data;
      setSolicitudesUso(solicitudes.length);

      
      const estados = {
        Completada: solicitudes.filter(s => s.estado === 'Completada').length,
        Aprobada: solicitudes.filter(s => s.estado === 'Aprobada').length,
        Pendiente: solicitudes.filter(s => s.estado === 'Pendiente').length,
        Rechazada: solicitudes.filter(s => s.estado === 'Rechazada').length,
      };

      const pieData = [
        {
          name: 'Completadas',
          population: estados.Completada,
          color: '#4CAF50',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
        {
          name: 'Aprobadas',
          population: estados.Aprobada,
          color: '#2196F3',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
        {
          name: 'Pendientes',
          population: estados.Pendiente,
          color: '#FFC107',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
        {
          name: 'Rechazadas',
          population: estados.Rechazada,
          color: '#F44336',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        },
      ];
      setSolicitudesPieData(pieData);

      
      const approvedRequests = solicitudes.filter(s => s.estado === 'Aprobada');
      const datesMarked = {};
      
      approvedRequests.forEach(request => {
        const date = request.fecha_solicitud?.split('T')[0];
        if (date) {
          datesMarked[date] = {
            selected: true,
            selectedColor: '#2196F3',
            dotColor: '#fff'
          };
        }
      });
      setMarkedDates(datesMarked);

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDayPress = (day) => {
    const date = day.dateString;
    const solicitudesAprobadas = solicitudesPieData.find(s => s.name === 'Aprobadas')?.population || 0;
    
    if (markedDates[date]) {
      
      
      const detalles = [
        { id: 1, laboratorio: 'Lab 1', docente: 'Profesor A', hora: '10:00 - 12:00' },
        { id: 2, laboratorio: 'Lab 2', docente: 'Profesor B', hora: '14:00 - 16:00' }
      ]; 
      setSelectedDateDetails(detalles);
      setModalVisible(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    fetchData();
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Navbar navigation={navigation} />
      
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
       
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.cardsContainer}>
            <Card
              title="Total Insumos"
              value={totalInsumos}
              subtitle="Registrados en sistema"
              icon="package-variant"
            />
            <Card
              title="Stock Crítico"
              value={stockCritico}
              subtitle="Necesitan reposición"
              redirectTo="Alertas"
              icon="alert-circle"
            />
            <Card
              title="Solicitudes de Uso"
              value={solicitudesUso}
              subtitle="Total de solicitudes"
              icon="calendar-check"
            />
            <Card
              title="Laboratorios Completados"
              value={solicitudesPieData.find(s => s.name === 'Completadas')?.population || 0}
              subtitle="Solicitudes confirmadas"
              icon="check-circle"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Estado de Solicitudes de Uso</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SuppliesInUse')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Ver más</Text>
            </TouchableOpacity>
          </View>
          
          {solicitudesPieData.length > 0 ? (
            <View style={styles.chartContainer}>
              <PieChart
                data={solicitudesPieData}
                width={width * 0.9}
                height={200}
                chartConfig={{
                  color: () => '#000',
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend
              />
            </View>
          ) : (
            <Text style={styles.noDataText}>Cargando datos de solicitudes...</Text>
          )}
        </View>

       
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitudes Aprobadas</Text>
          <Calendar
            markedDates={markedDates}
            markingType="multi-dot"
            onDayPress={handleDayPress}
            theme={{
              selectedDayBackgroundColor: '#2196F3',
              todayTextColor: '#592644',
              arrowColor: '#592644',
            }}
            style={styles.calendar}
          />
        </View>

        
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Detalles de Reservas</Text>
              {selectedDateDetails.map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.detailText}>Laboratorio: {item.laboratorio}</Text>
                  <Text style={styles.detailText}>Docente: {item.docente}</Text>
                  <Text style={styles.detailText}>Horario: {item.hora}</Text>
                  {index < selectedDateDetails.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.textStyle}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Uso de Laboratorios</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('LabUsage')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Ver más</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.chartContainer}>
            <BarChart
              data={graficoData}
              width={width * 0.9}
              height={220}
              fromZero
              yAxisLabel=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(89, 38, 68, ${opacity})`,
                labelColor: () => '#000',
              }}
              style={styles.chart}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: NAVBAR_HEIGHT + 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#592644',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    color: '#592644',
    fontSize: 14,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 10,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  chart: {
    borderRadius: 12,
  },
  calendar: {
    borderRadius: 10,
    marginTop: 10,
  },
  noDataText: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#592644',
  },
  detailItem: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 15,
  },
  buttonClose: {
    backgroundColor: '#592644',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});