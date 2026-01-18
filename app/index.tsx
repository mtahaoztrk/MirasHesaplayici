import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert, Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import { HesaplamaSonucu, SiraciyyeMotoru } from '../logic';

// --- TEMA RENKLERİ ---
const COLORS = {
  bg: '#121212',
  surface: '#1E1E1E',
  primary: '#00B894', 
  secondary: '#2D3436',
  text: '#DFE6E9',
  subtext: '#B2BEC3',
  danger: '#FF7675',
  accent: '#0984E3',
  gold: '#F1C40F' // Başlık ve vurgular için altın rengi
};

// --- EKRAN BOYUTLARI ---
const { width, height } = Dimensions.get('window');

// --- TİP TANIMLARI ---
interface InputItem { key: string; label: string; }
interface InputGroup { title: string; items: InputItem[]; }

const INPUT_GROUPS: InputGroup[] = [
  { title: "Eşler", items: [{ key: 'koca', label: 'Koca' }, { key: 'kari', label: 'Karı' }] },
  { title: "Çocuklar & Torunlar", items: [{ key: 'ogul', label: 'Oğul' }, { key: 'kiz', label: 'Kız' }, { key: 'ogul_oglu', label: 'Oğlun Oğlu' }, { key: 'ogul_kizi', label: 'Oğlun Kızı' }] },
  { title: "Üst Soy (Usûl)", items: [{ key: 'baba', label: 'Baba' }, { key: 'anne', label: 'Anne' }, { key: 'dede', label: 'Dede' }, { key: 'nine_anne', label: 'Nine (Anne)' }, { key: 'nine_baba', label: 'Nine (Baba)' }] },
  { title: "Kardeşler & Amcalar", items: [{ key: 'erkek_kardes_oz', label: 'Öz Erk. Kar.' }, { key: 'kiz_kardes_oz', label: 'Öz Kız Kar.' }, { key: 'amca', label: 'Amca' }] }
];

// --- BİLEŞENLER ---

// 1. Karşılama Ekranı Bileşeni
const WelcomeScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <SafeAreaView style={styles.welcomeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      {/* Arka Plan Filigranı */}
      <View style={styles.watermarkContainer}>
        <Ionicons name="book" size={width * 0.8} color={COLORS.surface} style={{ opacity: 0.3, transform: [{ rotate: '-15deg' }] }} />
      </View>

      <View style={styles.welcomeContent}>
        <View style={styles.logoContainer}>
          <Ionicons name="scale" size={80} color={COLORS.primary} />
          <Text style={styles.appTitleMain}>EL-FERÂİZÜ'S</Text>
          <Text style={styles.appTitleSub}>SİRÂCİYYE</Text>
        </View>

        <View style={styles.quoteContainer}>
          <Ionicons name="options-outline" size={24} color={COLORS.gold} style={{marginBottom: 10}} />
          <Text style={styles.hadithText}>
            "Ferâiz ilmini öğreniniz ve onu insanlara öğretiniz. Çünkü o, ilmin yarısıdır, unutulur ve ümmetimden ilk çekilip alınacak olan odur."
          </Text>
          <Text style={styles.hadithSource}>— Hz. Muhammed (s.a.v)</Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.btnStart} onPress={onStart}>
          <Text style={styles.btnStartText}>HESAPLAMAYA BAŞLA</Text>
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.footerText}>Hanefi Mezhebi esaslarına göre hesaplar.</Text>
      </View>
    </SafeAreaView>
  );
};

// 2. Sayaç Bileşeni
const Counter = ({ label, value, onIncrement, onDecrement }: { label: string, value: number, onIncrement: () => void, onDecrement: () => void }) => (
  <View style={styles.counterRow}>
    <Text style={styles.counterLabel}>{label}</Text>
    <View style={styles.counterControls}>
      <TouchableOpacity onPress={onDecrement} style={[styles.btnSmall, { backgroundColor: COLORS.secondary }]}>
        <Ionicons name="remove" size={20} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.counterValue}>{value}</Text>
      <TouchableOpacity onPress={onIncrement} style={[styles.btnSmall, { backgroundColor: COLORS.secondary }]}>
        <Ionicons name="add" size={20} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  </View>
);

// --- ANA UYGULAMA ---
export default function MirasApp() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'calculator'>('welcome');
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<HesaplamaSonucu | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const updateInput = (key: string, delta: number) => {
    setInputs(prev => {
      const current = prev[key] || 0;
      return { ...prev, [key]: Math.max(0, current + delta) };
    });
  };

  const handleCalculate = () => {
    if ((inputs['koca'] || 0) > 0 && (inputs['kari'] || 0) > 0) {
      Alert.alert("Mantık Hatası", "Hem koca hem karı aynı anda mirasçı olamaz.");
      return;
    }
    const motor = new SiraciyyeMotoru();
    motor.yukle(inputs);
    setResult(motor.hesapla());
    setModalVisible(true);
  };

  const handleReset = () => {
    setInputs({});
    setResult(null);
  };

  const getLabel = (key: string) => {
    for (const g of INPUT_GROUPS) {
      const found = g.items.find(i => i.key === key);
      if (found) return found.label;
    }
    return key;
  };

  // EĞER KARŞILAMA EKRANI İSE
  if (currentScreen === 'welcome') {
    return <WelcomeScreen onStart={() => setCurrentScreen('calculator')} />;
  }

  // HESAP MAKİNESİ EKRANI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('welcome')}>
           <Ionicons name="arrow-back" size={24} color={COLORS.subtext} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sirâciyye Hesaplayıcı</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Temizle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {INPUT_GROUPS.map((group, idx) => (
          <View key={idx} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map((item) => (
              <Counter 
                key={item.key} 
                label={item.label} 
                value={inputs[item.key] || 0}
                onIncrement={() => updateInput(item.key, 1)}
                onDecrement={() => updateInput(item.key, -1)}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnCalc} onPress={handleCalculate}>
          <Text style={styles.btnCalcText}>HESAPLA</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)} presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hesaplama Sonucu</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle" size={30} color={COLORS.subtext} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.table}>
              <View style={[styles.tableRow, { borderBottomColor: COLORS.secondary }]}>
                <Text style={[styles.tableHead, { flex: 2 }]}>Varis</Text>
                <Text style={styles.tableHead}>Adet</Text>
                <Text style={styles.tableHead}>Pay</Text>
                <Text style={[styles.tableHead, {textAlign:'right'}]}>%</Text>
              </View>
              {result && Object.entries(result.paylar).map(([key, fraction]) => {
                if (fraction.n === 0) return null;
                const adet = inputs[key] || 1;
                const yuzde = (fraction.n / fraction.d) * 100;
                return (
                  <View key={key} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2, color: COLORS.primary }]}>{getLabel(key)}</Text>
                    <Text style={styles.tableCell}>{adet}</Text>
                    <Text style={styles.tableCell}>{fraction.toString()}</Text>
                    <Text style={[styles.tableCell, {textAlign:'right'}]}>%{yuzde.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.logsContainer}>
              <Text style={styles.logsTitle}>Mantık ve Deliller:</Text>
              {result && result.logs.map((log, i) => <Text key={i} style={styles.logText}>• {log}</Text>)}
            </View>
            <View style={{height: 50}} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  // --- WELCOME SCREEN STYLES ---
  welcomeContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: -1 },
  welcomeContent: { flex: 1, width: '100%', padding: 30, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  appTitleMain: { fontSize: 28, color: COLORS.text, fontWeight: '300', letterSpacing: 2, marginTop: 10 },
  appTitleSub: { fontSize: 36, color: COLORS.primary, fontWeight: 'bold', letterSpacing: 4 },
  quoteContainer: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 15, borderLeftWidth: 3, borderLeftColor: COLORS.gold, width: '100%' },
  hadithText: { color: COLORS.text, fontSize: 16, fontStyle: 'italic', lineHeight: 24, textAlign: 'center' },
  hadithSource: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginTop: 10 },
  spacer: { flex: 1 },
  btnStart: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginBottom: 20, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  btnStartText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  footerText: { color: COLORS.subtext, fontSize: 12, opacity: 0.6 },

  // --- CALCULATOR STYLES ---
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  resetText: { color: COLORS.danger, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  groupContainer: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 15, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  groupTitle: { color: COLORS.subtext, fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  counterLabel: { color: COLORS.text, fontSize: 16 },
  counterControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#252525', borderRadius: 8 },
  btnSmall: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  counterValue: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', width: 40, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.surface },
  btnCalc: { backgroundColor: COLORS.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10 },
  btnCalcText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  
  // --- MODAL STYLES ---
  modalContainer: { flex: 1, backgroundColor: COLORS.surface },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth:1, borderColor: '#333' },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  modalContent: { padding: 20 },
  table: { backgroundColor: '#252525', borderRadius: 12, padding: 10, marginBottom: 20 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  tableHead: { color: COLORS.subtext, fontSize: 12, fontWeight: 'bold', flex: 1 },
  tableCell: { color: COLORS.text, fontSize: 14, flex: 1 },
  logsContainer: { marginBottom: 40 },
  logsTitle: { color: COLORS.accent, fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  logText: { color: COLORS.subtext, marginBottom: 6, lineHeight: 20 }
});