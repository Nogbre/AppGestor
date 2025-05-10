import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import axios from 'axios';

const { height, width } = Dimensions.get('window');
const NAVBAR_HEIGHT = 130;

export default function UbicacionScreen({ route, navigation }) {
  const { estanteria } = route.params;
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noInsumosModalVisible, setNoInsumosModalVisible] = useState(false);
  const [insumosModalVisible, setInsumosModalVisible] = useState(false);
  const [ubicacionEscaneada, setUbicacionEscaneada] = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [animComplete, setAnimComplete] = useState(false);

  const [menuAbierto, setMenuAbierto] = useState(false);

  const botones = [0, 1, 2, 3, 4];

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

  const toggleMenu = () => {
    const toValue = menuAbierto ? -(height - NAVBAR_HEIGHT) : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setMenuAbierto(!menuAbierto);
  };

  const handleBotonPress = async (numero) => {
    const ubicacion = `${estanteria}${numero}`;

    try {
      setLoading(true);
      const response = await axios.get(`https://universidad-la9h.onrender.com/insumos/ubicacion/${ubicacion}`);
      setInsumos(response.data);
      setUbicacionEscaneada(ubicacion);

      if (response.data.length === 0) {
        setNoInsumosModalVisible(true);
      } else {
        setInsumosModalVisible(true);
      }
    } catch (error) {
      console.error('Error al obtener insumos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { transform: [{ translateY: slideAnim }] }]}>
        {animComplete && (
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo-2.png')} style={styles.logo} />
          </View>
        )}

        <TouchableOpacity style={styles.navbar} onPress={toggleMenu}>
          <Text style={styles.navbarText}>Estantería {estanteria}</Text>
        </TouchableOpacity>

        {menuAbierto && animComplete && (
          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.textoBotonVolver}>Volver al Home</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {animComplete && (
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Image source={require('../assets/estanteria.png')} style={styles.estanteriaFondo} />

          <View style={styles.botonesContainer}>
            {botones.map((numero) => (
              <TouchableOpacity
                key={numero}
                style={styles.boton}
                onPress={() => handleBotonPress(numero)}
              >
                <Text style={styles.textoBoton}>{numero}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      <Modal visible={noInsumosModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>No hay insumos en esta ubicación</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setNoInsumosModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={insumosModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 400 }]}>
            <Text style={styles.modalText}>Insumos en {ubicacionEscaneada}</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#592644" style={{ marginTop: 20 }} />
            ) : (
              <ScrollView style={{ width: '100%', marginBottom: 20 }}>
                {insumos.map((item) => (
                  <View key={item.id_insumo} style={styles.insumoCardModal}>
                    <Text style={styles.nombreInsumo}>{item.nombre}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setInsumosModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
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
    marginTop: 20,
    height: 120,
    width: 120,
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
  botonVolver: {
    position: 'absolute',
    top: 220,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 5,
  },
  textoBotonVolver: {
    color: '#592644',
    fontSize: 16,
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
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estanteriaFondo: {
    marginTop:180,
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 540,
    opacity: 1,
  },
  botonesContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:-100,
    height:500,
    marginTop:10,
    opacity:0.4,
  },
  boton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 130,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:46,    
    opacity:1,
    
  },
  textoBoton: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: 300,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#34434D',
  },
  modalButton: {
    backgroundColor: '#592644',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  insumoCardModal: {
    backgroundColor: '#f4f4f4',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    width: '100%',
  },
});
