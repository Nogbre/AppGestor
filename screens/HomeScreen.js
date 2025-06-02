import React, { useState, useEffect, useRef } from 'react';
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
  Pressable,
  Animated
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Navbar from '../components/Navbar';
import Card from '../components/Card';

const { width, height } = Dimensions.get('window');
const NAVBAR_HEIGHT = 80;

export default function HomeScreen({ navigation, route }) {
  const expandAnim = useRef(new Animated.Value(0)).current;
  
  const [graficoData, setGraficoData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [solicitudesPieData, setSolicitudesPieData] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [totalInsumos, setTotalInsumos] = useState(0);
  const [stockCritico, setStockCritico] = useState(0);
  const [solicitudesUso, setSolicitudesUso] = useState(0);
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

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Solo animamos si venimos del login
    if (route.params?.fromLogin) {
      expandAnim.setValue(height);
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, []);

  const onRefresh = () => {
    fetchData();
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Animated.View style={[styles.telon, { height: expandAnim }]} />
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
  noDataText: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 20,
  },
  telon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#592644',
    zIndex: 999,
  },
});