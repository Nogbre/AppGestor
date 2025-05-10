import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';  
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const QRScannerModal = ({ visible, onClose, onScanned }) => {
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState(null); 

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();  
      setHasPermission(status === 'granted'); 
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    onScanned(data);
  };

  if (hasPermission === null) {
    return <Text>Solicitando permisos de cámara...</Text>;  
  }

  if (hasPermission === false) {
    return <Text>No tienes acceso a la cámara</Text>;  
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <QRCodeScanner
          onRead={handleBarCodeScanned}
          reactivate={true}
          reactivateTimeout={5000}
          showMarker={true}
          topContent={<Text style={styles.topText}>Escanea el código QR</Text>}
          bottomContent={
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close-circle" size={48} color="#fff" />
            </TouchableOpacity>
          }
        />
        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanText}>Escanear de nuevo</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  topText: {
    fontSize: 18,
    color: '#fff',
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  rescanButton: {
    backgroundColor: '#fff',
    padding: 12,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  rescanText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRScannerModal;
