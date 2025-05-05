import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const expandAnim = useRef(new Animated.Value(305)).current;

  const handleLogin = () => {
    Animated.timing(expandAnim, {
      toValue: height,
      duration: 600,
      useNativeDriver: false,
    }).start(() => {
      navigation.replace('Home');
    });
  };

  return (
    <View style={styles.container}>
      {/* Header animado */}
      <Animated.View style={[styles.header, { height: expandAnim }]}>
        <Image source={require('../assets/logo-2.png')} style={styles.logo} />
      </Animated.View>

      {/* Formulario */}
      <View style={styles.formContainer}>
        <Text style={styles.titulo}>Laboratorios</Text>
        <Text style={styles.titulo2}>Univalle</Text>
        <Text style={styles.titulo3}>Iniciar Sesión</Text>

        <View style={styles.inputWrapper}>
          <MaterialIcons name="email" size={24} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.inputText}
            placeholder="example@univalle.edu"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputWrapper}>
          <MaterialIcons name="lock" size={24} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.inputText}
            placeholder="contraseña"
            secureTextEntry
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#592644',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      zIndex: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 20,
    },
    container: {
      flex: 1,
      backgroundColor: '#f1f1f1',
    },
    formContainer: {
      marginTop: 320,
      alignItems: 'center',
      paddingHorizontal: 30,
      zIndex: 1,
    },
    titulo: {
      fontSize: 42,
      fontWeight: 'bold',
      color: '#34434D',
      marginTop:20,
    },
    titulo2: {
      fontSize: 34,
      fontWeight: 'bold',
      marginBottom: 30,
      color: '#34434D',
    },
    titulo3: {
      fontSize: 18,
      marginBottom: 20,
      color: '#888',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      width: '100%',
      borderRadius: 18,
      paddingHorizontal: 15,
      marginVertical: 10,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
    },
    inputIcon: {
      marginRight: 10,
    },
    inputText: {
      flex: 1,
      height: 50,
      color: '#333',
      fontSize: 16,
    },
    loginButton: {
      backgroundColor: '#592644',
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 30,
      marginTop: 30,
      elevation: 6,
    },
    loginButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
      letterSpacing: 1,
    },
    logo: {
      marginTop: 30,
      height: 150,
      width: 150,
    
    },
  });
  