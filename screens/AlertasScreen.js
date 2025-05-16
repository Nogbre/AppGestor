import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl
} from "react-native";
import Navbar from "../components/Navbar";

const API_URL = "https://universidad-la9h.onrender.com";

const AlertasScreen = ({ navigation }) => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [order, setOrder] = useState("desc");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/alertas`);
      const data = await response.json();
      setAlertas(data);
      setError(null);
    } catch (err) {
      setError("Error al cargar las alertas");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlertas();
  }, [fetchAlertas]);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  const badgeColors = {
    Activa: "#EF4444",
    Inactiva: "#6B7280",
    Resuelta: "#10B981",
  };

  const filteredAlertas = alertas.filter((alerta) =>
    filter === "All" ? true : alerta.estado === filter
  );

  const sortedAlertas = filteredAlertas.sort((a, b) => {
    const dateA = new Date(a.fecha);
    const dateB = new Date(b.fecha);
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });

  const filters = [
    { label: "Todas", value: "All" },
    { label: "Activas", value: "Activa" },
    { label: "Inactivas", value: "Inactiva" },
    { label: "Resueltas", value: "Resuelta" },
  ];

  const orders = [
    { label: "Más Recientes", value: "desc" },
    { label: "Más Antiguas", value: "asc" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Navbar navigation={navigation} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alertas</Text>
          
          <View style={styles.filterRow}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterScroll}
            >
              {filters.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  style={[styles.chip, filter === f.value && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, filter === f.value && styles.chipTextSelected]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterScroll}
            >
              {orders.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => setOrder(o.value)}
                  style={[styles.chip, order === o.value && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, order === o.value && styles.chipTextSelected]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#592644" />
          </View>
        ) : error ? (
          <View style={styles.messageContainer}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : sortedAlertas.length === 0 ? (
          <View style={styles.messageContainer}>
            <Text style={styles.noAlert}>No hay alertas disponibles</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.alertasContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#592644']}
                tintColor="#592644"
              />
            }
          >
            {sortedAlertas.map((alerta, index) => (
              <View
                key={index}
                style={[styles.card, { backgroundColor: badgeColors[alerta.estado] + "20" }]}
              >
                <View style={[styles.badge, { backgroundColor: badgeColors[alerta.estado] }]}>
                  <Text style={styles.badgeText}>{alerta.estado.toUpperCase()}</Text>
                </View>
                <Text style={styles.text}>
                  <Text style={styles.bold}>Nombre:</Text> {alerta.insumo_nombre || "No disponible"}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.bold}>Disponibilidad actual:</Text> {alerta.stock_actual}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.bold}>Mínimo:</Text> {alerta.stock_minimo} | <Text style={styles.bold}>Máximo:</Text> {alerta.stock_maximo}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.bold}>Fecha:</Text> {alerta.fecha ? new Date(alerta.fecha).toLocaleDateString() : "No disponible"}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#592644",
    textAlign: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#592644",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: "#592644",
  },
  chipText: {
    fontSize: 14,
    color: "#592644",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#fff",
  },
  alertasContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#eee",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  text: {
    color: "#333",
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "bold",
    color: '#592644',
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 16,
  },
  noAlert: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default AlertasScreen;