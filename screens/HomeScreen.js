import React, { useRef, useEffect, useState } from 'react';
import {View,Text,StyleSheet,Animated,Dimensions,Image,TouchableOpacity,ScrollView,Modal,} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BarChart } from 'react-native-chart-kit';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import axios from 'axios';

const { height, width } = Dimensions.get('window');
const NAVBAR_HEIGHT = 130;

export default function HomeScreen({ navigation }) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [animComplete, setAnimComplete] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [graficoData, setGraficoData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });

  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [permission, requestPermission] = useCameraPermissions(); 
  const cameraRef = useRef(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: -(height - NAVBAR_HEIGHT),
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      setAnimComplete(true);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://universidad-la9h.onrender.com/top-docentes-laboratorios');
        const dataFromApi = response.data;

        const labels = dataFromApi.map(item => ` ${item.nombre_docente} `);
        const data = dataFromApi.map(item => item.total_laboratorios);

        setGraficoData({
          labels,
          datasets: [{ data }],
        });
      } catch (error) {
        console.error('Error al cargar datos del gráfico:', error.message);
      }
    };

    fetchData();
  }, []);

  const toggleMenu = () => {
    const toValue = menuAbierto ? -(height - NAVBAR_HEIGHT) : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setMenuAbierto(!menuAbierto);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setScannerVisible(false);

    const estanteria = data.trim();
    navigation.navigate('Ubicacion', { estanteria });
  };

  if (!permission) {
    return <View style={styles.container}><Text>Solicitando permisos...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No tienes acceso a la cámara</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.boton_qr}>
          <Text style={styles.texto_boton}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.overlay, { transform: [{ translateY: slideAnim }] }]}>
        {animComplete && (
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo-2.png')} style={styles.logo} />
          </View>
        )}

        <TouchableOpacity style={styles.navbar} onPress={toggleMenu}>
          <Text style={styles.navbarText}>HOME</Text>
        </TouchableOpacity>

        {menuAbierto && (
          <View style={styles.menuContentCentered}>
            <Text style={styles.menuText}>Laboratorios</Text>
            <Text style={styles.menuText}>Insumos en Uso</Text>
            <Text style={styles.menuText}>En desarrollo</Text>
            <Text style={styles.cerrar} onPress={() => navigation.replace('Login')}>Cerrar sesión</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.contenedor_laboratorio_dashboard}>
          <Text style={styles.tituloGrafico}>Laboratorios hasta la fecha</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={graficoData}
              width={width * 0.8}
              height={250}
              fromZero
              yAxisInterval={4}
              segments={5}
              xLabelsOffset={-5}
              yLabelsOffset={30}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(89, 38, 68, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 16 },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: '#ccc',
                },
              }}
              verticalLabelRotation={0}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              showBarTops
            />
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.boton_qr} onPress={() => {
          setScannerVisible(true);
          setScanned(false);
        }}>
          <Icon style={styles.logo_qr} name="qrcode-scan" size={32} color="#000" />
          <Text style={styles.texto_boton}>Escanear QR</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal para escanear */}
      <Modal visible={scannerVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} // OJO, cambia 'BarCodeScanned' por 'BarcodeScanned'
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />

          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 50,
              left: 20,
              backgroundColor: '#fff',
              padding: 10,
              borderRadius: 10,
            }}
            onPress={() => setScannerVisible(false)}
          >
            <Text>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    backgroundColor: '#592644',
    zIndex: 10,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
    zIndex: 11,
  },
  logo: {
    marginTop: 60,
    height: 170,
    width: 170,
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    height: NAVBAR_HEIGHT,
    width: '100%',
    backgroundColor: '#592644',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  navbarText: {
    marginTop: 50,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    zIndex: 1,
    padding: 20,
    alignItems: 'center',
  },
  contenedor_laboratorio_dashboard: {
    backgroundColor: '#59264426',
    marginTop: -40,
    height: 320,
    width: 340,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  boton_qr: {
    backgroundColor: '#59264426',
    borderRadius: 24,
    marginTop: 30,
    elevation: 6,
    width: 340,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  texto_boton: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  tituloGrafico: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#592644',
    marginBottom: 10,
  },
  menuContentCentered: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -50 }],
    alignItems: 'center',
  },
  menuText: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 10,
    color: 'white',
  },
});
