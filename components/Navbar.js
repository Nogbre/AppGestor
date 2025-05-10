import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Image,
  Easing,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { CameraView } from 'expo-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const Navbar = () => {
  const heightAnim = useRef(new Animated.Value(70)).current;
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [fullHeight, setFullHeight] = useState(400);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation();
  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    const calculatedHeight = Platform.select({
      ios: windowHeight * (Dimensions.get('window').width >= 768 ? 0.85 : 0.9),
      android: windowHeight * 0.9,
      default: windowHeight * 0.85,
    });
    setFullHeight(calculatedHeight);
  }, [windowHeight]);

  const toggleMenu = useCallback(() => {
    Animated.timing(heightAnim, {
      toValue: menuAbierto ? 70 : fullHeight,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setMenuAbierto(!menuAbierto);
    });
  }, [menuAbierto, fullHeight, heightAnim]);

  const handleLogout = useCallback(() => {
    // Cerramos el menú primero
    if (menuAbierto) {
      toggleMenu();
      // Esperamos a que la animación termine antes de navegar
      setTimeout(() => {
        navigation.replace('Login');
      }, 400);
    } else {
      navigation.replace('Login');
    }
  }, [menuAbierto, toggleMenu, navigation]);

  const handleMenuOptionPress = useCallback((option) => {
    toggleMenu();
    switch (option) {
      case 'Cerrar sesión':
        handleLogout();
        break;
      case 'alertas':
        navigation.navigate('Alertas');
        break;
      case 'inicio':
        navigation.navigate('Home');
        break;
      case 'Solicitudes':
        navigation.navigate('SuppliesInUse');
        break;
      case 'Insumos en préstamo':
        navigation.navigate('InsumosPrestamo');
        break;
      default:
        break;
    }
  }, [toggleMenu, handleLogout, navigation]);

  const handleBarCodeScanned = useCallback(({ data }) => {
    setScanned(true);
    setScannerVisible(false);
    navigation.navigate('Ubicacion', { estanteria: data.trim() });
  }, [navigation]);

  const toggleScanner = useCallback(() => {
    setScannerVisible(!scannerVisible);
    setScanned(false);
  }, [scannerVisible]);

  return (
    <>
      <Animated.View 
        style={[
          styles.container,
          {
            height: heightAnim,
            maxHeight: fullHeight,
          }
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={toggleMenu}>
            <Icon name={menuAbierto ? "close" : "home"} size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleScanner} style={styles.qrButton}>
            <Icon name="qrcode-scan" size={26} color="white" />
            <Text style={styles.qrButtonText}>Escanear</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Image 
            source={require('../assets/logo-2.png')} 
            style={[
              styles.logo,
              { height: windowHeight * 0.15, width: windowHeight * 0.15 }
            ]} 
          />
          
          <View style={styles.menuItemsContainer}>
            <MenuItem 
              icon="home" 
              label="Inicio" 
              onPress={() => handleMenuOptionPress('inicio')} 
            />
            <MenuItem 
              icon="chart-line" 
              label="Alertas" 
              onPress={() => handleMenuOptionPress('alertas')} 
            />
            <MenuItem
              icon="clipboard-text" 
              label="Solicitudes" 
              onPress={() => handleMenuOptionPress('Solicitudes')}
            />
            <MenuItem
              icon="swap-horizontal" 
              label="Movimientos" 
              onPress={() => handleMenuOptionPress('Insumos en préstamo')}
            />
            <MenuItem 
              icon="logout" 
              label="Cerrar sesión" 
              onPress={() => handleMenuOptionPress('Cerrar sesión')} 
            />
          </View>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={toggleMenu}
          >
            <Icon name="chevron-up" size={30} color="white" />
            <Text style={styles.closeButtonText}>Ocultar menú</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal visible={scannerVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => setScannerVisible(false)}
          >
            <Icon name="close" size={30} color="white" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const MenuItem = React.memo(({ icon, label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem}>
    <Icon name={icon} size={26} color="white" />
    <Text style={styles.menuItemText}>{label}</Text>
  </TouchableOpacity>
));

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#592644',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 1000,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topBar: {
    height: 95,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    backgroundColor: '#592644',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  qrButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  content: {
    paddingBottom: 20,
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
  },
  logo: {
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 20,
  },
  menuItemsContainer: {
    width: '80%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff10',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    justifyContent: 'flex-start',
    paddingLeft: 30,
  },
  menuItemText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 15,
    fontWeight: 'bold',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  cancelButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    backgroundColor: '#592644',
    padding: 10,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 5,
  },
};

export default Navbar;