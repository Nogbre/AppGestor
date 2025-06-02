import React, { useRef, useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const expandAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  useEffect(() => {
    // Animación inicial que sube el header
    Animated.timing(expandAnim, {
      toValue: 305,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      return Alert.alert('Error', 'Por favor completa todos los campos.');
    }

    try {
      const response = await axios.post('https://universidad-la9h.onrender.com/auth/encargado-login', {
        correo,
        contrasena,
      });

      const encargado = response.data;
      await AsyncStorage.setItem('encargado', JSON.stringify(encargado));

      // Primero bajamos el telón
      Animated.timing(expandAnim, {
        toValue: height,
        duration: 800,
        useNativeDriver: false,
      }).start(() => {
        // Navegamos a Home y el telón se subirá automáticamente
        navigation.replace('Home', { fromLogin: true });
      });

    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert('Datos erróneos', 'Correo o contraseña incorrectos.');
      } else {
        Alert.alert('Error', 'No se pudo conectar con el servidor.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Animated.View style={[styles.header, { height: expandAnim }]}>
          <Image source={require('../assets/logo-2.png')} style={styles.logo} />
        </Animated.View>

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
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock" size={24} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              placeholder="contraseña"
              secureTextEntry
              placeholderTextColor="#999"
              value={contrasena}
              onChangeText={setContrasena}
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  