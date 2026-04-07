import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import mobileAds, { AdEventType, InterstitialAd, MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';
import { HesaplamaSonucu, SiraciyyeMotoru, Varisler } from '../logic';

// --- UYGUNSUZ REKLAMLARI FİLTRELEME (SADECE GENEL İZLEYİCİ - G) ---
mobileAds().setRequestConfiguration({
  maxAdContentRating: MaxAdContentRating.G,
});

// --- VERSİYON VE PLAY STORE BİLGİLERİ ---
const APP_VERSION = '1.0.0'; // Uygulamanın şu anki sürümü
const PLAY_STORE_URL = 'market://details?id=com.mtahaoztrk.mirashesaplayici'; // Kendi Android Paket Adın (app.json içindeki android.package)
const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/mtahaoztrk/MirasHesaplayici/main/version.json';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-2172632283744022/5062435235';

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  keywords: ['finance', 'calculator', 'islamic', 'education'],
});

const COLORS = {
  bg: '#0F172A', card: '#1E293B', card_dark: '#141E33', primary: '#2DD4BF',
  gold: '#F59E0B', text: '#F1F5F9', subtext: '#94A3B8', border: '#334155',
  red: '#EF4444', secondary: '#334155', asilMeseleBg: 'rgba(245, 158, 11, 0.15)'
};

const PIE_COLORS = ['#2DD4BF', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#6366F1', '#14B8A6'];

const HADISLER = [
  { arapca: "فَأَعْطُوا كُلَّ ذِي حَقٍّ حَقَّهُ", turkce: "Her hak sahibine hakkını verin.", kaynak: "(Buhârî, Ferâiz 3)" },
  { arapca: "أَلْحِقُوا الْفَرَائِضَ بِأَهْلِهَا فَمَا بَقِيَ فَهُوَ لِأَوْلَى رَجُلٍ ذَكَرٍ", turkce: "Miras paylarını sahiplerine verin. Kalan, en yakın erkek akrabaya aittir.", kaynak: "(Buhârî, Ferâiz 5)" },
  { arapca: "لَا يَرِثُ الْمُسْلِمُ الْكَافِرَ وَلَا الْكَافِرُ الْمُسْلِمَ", turkce: "Müslüman kâfire, kâfir de Müslümana mirasçı olamaz.", kaynak: "(Buhârî, Ferâiz 9)" }
];

const getLabel = (key: string) => {
  const labels: Record<string, string> = {
    'koca': 'Koca', 'kari': 'Karı', 'ogul': 'Oğul', 'kiz': 'Kız', 'ogul_oglu': 'Oğlun Oğlu', 'ogul_kizi': 'Oğlun Kızı', 'ogul_oglunun_oglu': 'O. Oğlunun Oğlu',
    'baba': 'Baba', 'anne': 'Anne', 'dede': 'Dede', 'nine_anne': 'Nine (Anne)', 'nine_baba': 'Nine (Baba)',
    'erkek_kardes_oz': 'Öz Erk. Kar.', 'kiz_kardes_oz': 'Öz Kız Kar.', 'erkek_kardes_baba': 'Baba Bir Erk. Kar.', 'kiz_kardes_baba': 'Baba Bir Kız Kar.',
    'kardes_anne': 'Anne Bir Kar.', 'erkek_kardes_oz_oglu': 'Öz Kar. Oğlu', 'erkek_kardes_baba_oglu': 'B.Bir Kar. Oğlu', 'amca': 'Amca', 'amca_oglu': 'Amca Oğlu'
  };
  return labels[key] || key;
};

interface InputItem { key: string; label: string; icon: any; iconLib: 'Ion' | 'FA' | 'MCI' }
interface InputGroup { title: string; items: InputItem[] }

const INPUT_GROUPS: InputGroup[] = [
  { title: "Eşler", items: [{ key: 'koca', label: 'Koca', icon: 'human-male', iconLib: 'MCI' }, { key: 'kari', label: 'Karı', icon: 'human-female', iconLib: 'MCI' }] },
  { title: "Çocuklar & Torunlar", items: [{ key: 'ogul', label: 'Oğul', icon: 'human-male-height-variant', iconLib: 'MCI' }, { key: 'kiz', label: 'Kız', icon: 'human-female-height-variant', iconLib: 'MCI' }, { key: 'ogul_oglu', label: 'Oğlun Oğlu', icon: 'child', iconLib: 'FA' }, { key: 'ogul_kizi', label: 'Oğlun Kızı', icon: 'child', iconLib: 'FA' }, { key: 'ogul_oglunun_oglu', label: 'O. Oğlunun Oğlu', icon: 'baby', iconLib: 'FA' }] },
  { title: "Üst Soy (Usûl)", items: [{ key: 'baba', label: 'Baba', icon: 'male', iconLib: 'FA' }, { key: 'anne', label: 'Anne', icon: 'female', iconLib: 'FA' }, { key: 'dede', label: 'Dede', icon: 'account-tie', iconLib: 'MCI' }, { key: 'nine_anne', label: 'Nine (A)', icon: 'account-tie-voice', iconLib: 'MCI' }, { key: 'nine_baba', label: 'Nine (B)', icon: 'account-tie-voice', iconLib: 'MCI' }] },
  { title: "Kardeşler & Amcalar", items: [{ key: 'erkek_kardes_oz', label: 'Öz Erk.', icon: 'account-multiple', iconLib: 'MCI' }, { key: 'kiz_kardes_oz', label: 'Öz Kız', icon: 'account-multiple-outline', iconLib: 'MCI' }, { key: 'erkek_kardes_baba', label: 'B. Erk.', icon: 'handshake', iconLib: 'FA' }, { key: 'kiz_kardes_baba', label: 'B. Kız', icon: 'handshake', iconLib: 'FA' }, { key: 'kardes_anne', label: 'A. Bir', icon: 'users', iconLib: 'FA' }, { key: 'erkek_kardes_oz_oglu', label: 'Öz Kar. Oğlu', icon: 'user-graduate', iconLib: 'FA' }, { key: 'erkek_kardes_baba_oglu', label: 'B.Bir Kar.Oğlu', icon: 'user-graduate', iconLib: 'FA' }, { key: 'amca', label: 'Amca', icon: 'star-of-david', iconLib: 'MCI' }, { key: 'amca_oglu', label: 'Amca Oğlu', icon: 'user-tie', iconLib: 'FA' }] }
];

const renderIcon = (lib: string, name: any, size: number, color: string) => {
    if (lib === 'MCI') return <MaterialCommunityIcons name={name} size={size} color={color} />;
    if (lib === 'FA') return <FontAwesome5 name={name} size={size} color={color} />;
    return <Ionicons name={name} size={size} color={color} />;
}

export default function MirasApp() {
  const [inputs, setInputs] = useState<Varisler>({});
  const [wealth, setWealth] = useState<string>('');
  const [result, setResult] = useState<HesaplamaSonucu | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hadisIndex, setHadisIndex] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Uygulama açılışında Zorunlu Güncelleme (Force Update) kontrolü
    const checkForUpdates = async () => {
      try {
        const response = await fetch(VERSION_CHECK_URL + '?t=' + new Date().getTime());
        const data = await response.json();
        
        if (data.latestVersion && data.latestVersion !== APP_VERSION) {
          Alert.alert(
            "Yeni Sürüm Mevcut!",
            "Miras Hesaplayıcı uygulamasının yeni kurallar ve düzeltmeler içeren güncel sürümü yayınlandı. Hatalı hesaplamaların önüne geçmek için lütfen uygulamayı güncelleyin.",
            [
              { text: "Şimdi Güncelle", onPress: () => Linking.openURL(PLAY_STORE_URL) }
            ],
            { cancelable: false } // Kullanıcı bu uyarıyı kapatamaz
          );
        }
      } catch (error) {
        console.log("Versiyon kontrolü yapılamadı (İnternet olmayabilir).");
      }
    };
    checkForUpdates();

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => setAdLoaded(true));
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false); interstitial.load(); setModalVisible(true);
    });
    interstitial.load();
    return () => { unsubscribeLoaded(); unsubscribeClosed(); };
  }, []);

  const updateInput = (key: string, delta: number) => {
    setInputs(prev => {
      const current = prev[key] || 0;
      let newValue = Math.max(0, current + delta);
      if (key === 'koca') {
        if (delta > 0 && (prev['kari'] || 0) > 0) return prev;
        newValue = Math.min(newValue, 1);
      } 
      else if (key === 'kari') {
        if (delta > 0 && (prev['koca'] || 0) > 0) return prev;
        newValue = Math.min(newValue, 4);
      }
      return { ...prev, [key]: newValue };
    });
  };

  const clear = () => { setInputs({}); setWealth(''); setResult(null); };

  const handleCalculate = () => {
    if (Object.keys(inputs).length === 0 || Object.values(inputs).every(v => v === 0)) {
        Alert.alert("Hata", "Lütfen en az bir varis giriniz.");
        return;
    }
    const motor = new SiraciyyeMotoru();
    motor.yukle(inputs); 
    setResult(motor.hesapla());

   if (adLoaded) interstitial.show();
    else { setModalVisible(true); interstitial.load(); }
   
  };

  const handleCloseModal = async () => {
    setModalVisible(false); // Önce sonucu kapat
    
    // Sonuç kapatıldıktan sonra Puanlama Modalı/Uyarı kontrolü yap
    try {
      const hasRated = await AsyncStorage.getItem('hasRatedApp');
      if (hasRated !== 'true') {
        // Modal kapandıktan hemen sonra uyarı çıkmasın diye ufak bir gecikme ekliyoruz
        setTimeout(() => {
          Alert.alert(
            "Bizi Değerlendirin ⭐",
            "Miras Hesaplayıcı uygulamasını faydalı buldunuz mu? Play Store'da bize 5 yıldız vererek daha fazla kişiye ulaşmamıza destek olabilirsiniz.",
            [
              { text: "Daha Sonra", style: "cancel" },
              { 
                text: "Puan Ver", 
                onPress: async () => {
                  await AsyncStorage.setItem('hasRatedApp', 'true'); // Bir daha sorma
                  Linking.openURL(PLAY_STORE_URL);
                } 
              }
            ]
          );
        }, 1000); // 1 saniye sonra sor
      }
    } catch (e) {
      console.log("Puanlama durumu okunamadı.");
    }
  };

  const getChartData = () => {
    if (!result) return [];
    const data: any[] = [];
    let colorIndex = 0;
    Object.entries(result.paylar).forEach(([key, fraction]) => {
      if (fraction.n > 0) {
        const adet = inputs[key] || 1;
        const yuzde = (fraction.n / fraction.d) * 100;
        data.push({
          name: `${getLabel(key)} ${adet > 1 ? `(${adet})` : ''}`,
          population: parseFloat(yuzde.toFixed(2)),
          color: PIE_COLORS[colorIndex % PIE_COLORS.length],
          legendFontColor: COLORS.text, legendFontSize: 11
        });
        colorIndex++;
      }
    });
    return data;
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/mtahaoztrk/MirasHesaplayici');
  };

  const formatMoney = (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
  const numericWealth = parseFloat(wealth.replace(/,/g, '.'));
  const isValidWealth = !isNaN(numericWealth) && numericWealth > 0;
  
  const chartData = getChartData();
  const screenWidth = Dimensions.get("window").width;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.header}>
        <Ionicons name="calculator" size={28} color={COLORS.primary} />
        <Text style={styles.headerTitle}>MİRÂS HESAPLAYICI</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hadisCard}>
          <Text style={styles.hadisArapca}>{HADISLER[hadisIndex].arapca}</Text>
          <Text style={styles.hadisTurkce}>{HADISLER[hadisIndex].turkce}</Text>
          <View style={styles.hadisBottomRow}>
            <Text style={styles.hadisKaynak}>{HADISLER[hadisIndex].kaynak}</Text>
            <TouchableOpacity onPress={() => setHadisIndex((i) => (i + 1) % HADISLER.length)} style={styles.hadisNextButton}>
              <MaterialCommunityIcons name="refresh" size={14} color={COLORS.gold} />
              <Text style={styles.hadisNextText}>Farklı bir Hadis</Text>
            </TouchableOpacity>
          </View>
        </View>

        {INPUT_GROUPS.map(group => (
          <View key={group.title} style={styles.groupCard}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.itemsGrid}>
              {group.items.map(item => (
                <View key={item.key} style={styles.itemRow}>
                  <View style={styles.itemLabelContainer}>
                     {renderIcon(item.iconLib, item.icon, 18, COLORS.subtext)}
                     <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.itemCounterContainer}>
                    <TouchableOpacity onPress={() => updateInput(item.key, -1)} style={styles.counterBtn}>
                      <Ionicons name="remove" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{inputs[item.key] || 0}</Text>
                    <TouchableOpacity onPress={() => updateInput(item.key, 1)} style={styles.counterBtn}>
                      <Ionicons name="add" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>Toplam Mal Varlığı (İsteğe Bağlı)</Text>
            <View style={styles.wealthInputWrapper}>
              <FontAwesome5 name="lira-sign" size={18} color={COLORS.subtext} style={{marginRight: 10}} />
              <TextInput
                style={styles.wealthInput}
                placeholder="Örn: 1500000"
                placeholderTextColor={COLORS.border}
                keyboardType="numeric"
                value={wealth}
                onChangeText={setWealth}
              />
            </View>
        </View>

        <TouchableOpacity style={styles.githubFooter} onPress={openGitHub}>
          <Ionicons name="logo-github" size={20} color={COLORS.subtext} />
          <Text style={styles.githubFooterText}>GitHub - mtahaoztrk/MirasHesaplayici</Text>
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={clear} style={[styles.mainBtn, { backgroundColor: COLORS.card, flex: 0.3 }]}>
           <Text style={[styles.mainBtnText, {color: COLORS.subtext}]}>Temizle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCalculate} style={[styles.mainBtn, styles.calcBtn]}>
           <Text style={styles.mainBtnText}>PAYLARI HESAPLA</Text>
           <FontAwesome5 name="percentage" size={16} color={COLORS.text} style={{marginLeft:8}} />
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Miras Paylaşım Sonucu</Text>
                {/* MODAL KAPATMA BUTONUNA PUANLAMA TETİKLEYİCİSİ EKLENDİ */}
                <TouchableOpacity onPress={handleCloseModal}>
                    <Ionicons name="close" size={26} color={COLORS.subtext} />
                </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalScroll}>
                
                {result && (
                  <View style={styles.asilMeseleBox}>
                    <Text style={styles.asilMeseleText}>
                      ASIL MESELE: <Text style={styles.asilMeseleValue}>{result.ortakPayda}</Text>
                    </Text>
                  </View>
                )}

                {chartData.length > 0 && (
                  <View style={styles.chartContainer}>
                    <PieChart data={chartData} width={screenWidth - 40} height={180} chartConfig={{ color: (o = 1) => `rgba(255,255,255,${o})` }} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"0"} absolute />
                  </View>
                )}

                <View style={styles.table}>
                  <View style={[styles.tableRow, { borderBottomColor: COLORS.secondary }]}>
                    <Text style={[styles.tableHead, { flex: 2.2 }]}>Varis</Text>
                    <Text style={[styles.tableHead, { flex: 0.7, textAlign: 'center'}]}>Adet</Text>
                    <Text style={[styles.tableHead, { flex: 1.5, textAlign: 'right'}]}>Eşitlenmiş Pay</Text>
                    <Text style={[styles.tableHead, {flex: 1, textAlign:'right'}]}>%</Text>
                  </View>

                  {result && Object.entries(result.paylar).map(([key, fraction]) => {
                    if (fraction.n === 0) return null;
                    const adet = inputs[key] || 1;
                    const ortakPayda = result.ortakPayda;
                    const bireyselPay = result.bireyselPaylar[key];
                    const yuzdelik = fraction.n / fraction.d;
                    const grupMoney = isValidWealth ? numericWealth * yuzdelik : 0;
                    const individualMoney = isValidWealth ? grupMoney / adet : 0;

                    return (
                      <React.Fragment key={key}>
                        <View style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2.2, color: COLORS.primary }]}>{getLabel(key)}</Text>
                          <Text style={[styles.tableCell, { flex: 0.7, textAlign: 'center' }]}>{adet}</Text>
                          <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>{`${(fraction.n * ortakPayda) / fraction.d}/${ortakPayda}`}</Text>
                          <Text style={[styles.tableCell, {textAlign:'right', flex: 1}]}>%{(yuzdelik * 100).toFixed(1)}</Text>
                        </View>
                        
                        {isValidWealth && (
                            <View style={[styles.tableRow, { borderBottomWidth: 0, paddingVertical: 4, backgroundColor: 'rgba(45, 212, 191, 0.05)' }]}>
                                <Text style={[styles.tableCell, { flex: 2.2, color: COLORS.primary, fontStyle: 'italic' }]}>  💰 Grup Toplamı</Text>
                                <Text style={[styles.tableCell, { flex: 0.7 }]}></Text>
                                <Text style={[styles.tableCell, { flex: 2.5, textAlign: 'right', color: COLORS.primary, fontWeight: 'bold' }]}>{formatMoney(grupMoney)}</Text>
                            </View>
                        )}

                        {adet > 1 && (
                          <View style={[styles.tableRow, { borderBottomWidth: 0, paddingVertical: 4, backgroundColor: COLORS.card_dark }]}>
                            <Text style={[styles.tableCell, styles.bireyselCell, { flex: 2.2 }]}>  ↳ 1 Kişi Payı</Text>
                            <Text style={[styles.tableCell, styles.bireyselCell, { flex: 0.7, textAlign: 'center' }]}>1</Text>
                            <Text style={[styles.tableCell, styles.bireyselCell, { flex: 1.5, textAlign: 'right' }]}>{`${(bireyselPay.n * ortakPayda) / bireyselPay.d}/${ortakPayda}`}</Text>
                            <Text style={[styles.tableCell, styles.bireyselCell, {textAlign:'right', flex: 1}]}>%{(bireyselPay.n / bireyselPay.d * 100).toFixed(1)}</Text>
                          </View>
                        )}

                        {isValidWealth && adet > 1 && (
                            <View style={[styles.tableRow, { borderBottomWidth: 0, paddingVertical: 4, backgroundColor: 'rgba(45, 212, 191, 0.05)' }]}>
                                <Text style={[styles.tableCell, { flex: 2.2, color: COLORS.primary, fontStyle: 'italic' }]}>  💰 1 Kişi Düşen</Text>
                                <Text style={[styles.tableCell, { flex: 0.7 }]}></Text>
                                <Text style={[styles.tableCell, { flex: 2.5, textAlign: 'right', color: COLORS.primary, fontWeight: 'bold' }]}>{formatMoney(individualMoney)}</Text>
                            </View>
                        )}
                      </React.Fragment>
                    );
                  })}
                  
                  <View style={styles.logsContainer}>
                    <Text style={styles.logsTitle}>Mantık ve Deliller:</Text>
                    {result && result.logs.map((log, i) => (
                       <Text key={i} style={[styles.logText, log.includes("AVL") && styles.avlLogText]}>• {log}</Text>
                    ))}
                  </View>
                </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginLeft: 12, letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 20 },
  hadisCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginVertical: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border },
  hadisArapca: { fontSize: 18, color: COLORS.gold, textAlign: 'right', fontWeight: 'bold', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'serif' },
  hadisTurkce: { fontSize: 14, color: COLORS.text, fontStyle: 'italic', textAlign: 'center', marginBottom: 12, lineHeight: 20 },
  hadisBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingTop: 10 },
  hadisKaynak: { fontSize: 11, color: COLORS.subtext },
  hadisNextButton: { flexDirection: 'row', alignItems: 'center' },
  hadisNextText: { fontSize: 11, color: COLORS.gold, marginLeft: 4, fontWeight: 'bold' },
  groupCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 15 },
  groupTitle: { fontSize: 16, fontWeight: '700', color: COLORS.subtext, marginBottom: 12 },
  wealthInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, paddingHorizontal: 15, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border, height: 50 },
  wealthInput: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  itemsGrid: { gap: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg, padding: 12, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border },
  itemLabelContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemLabel: { fontSize: 14, color: COLORS.text },
  itemCounterContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  counterBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 16, fontWeight: '700', color: COLORS.primary, width: 20, textAlign: 'center' },
  githubFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, marginTop: 10 },
  githubFooterText: { color: COLORS.subtext, fontSize: 13, marginLeft: 8, textDecorationLine: 'underline' },
  actionRow: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 15, backgroundColor: COLORS.bg, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  mainBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  calcBtn: { flex: 0.7, backgroundColor: COLORS.primary },
  mainBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '85%', padding: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10 },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalScroll: { paddingBottom: 30 },
  asilMeseleBox: { backgroundColor: COLORS.asilMeseleBg, padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.gold },
  asilMeseleText: { color: COLORS.gold, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  asilMeseleValue: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  chartContainer: { alignItems: 'center', marginBottom: 20 },
  table: { gap: 0 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tableHead: { fontWeight: '700', color: COLORS.subtext, fontSize: 13 },
  tableCell: { fontSize: 13, color: COLORS.text },
  bireyselCell: { fontSize: 11, color: COLORS.subtext, fontStyle: 'italic' },
  logsContainer: { marginTop: 30, padding: 15, backgroundColor: COLORS.card_dark, borderRadius: 10 },
  logsTitle: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  logText: { color: COLORS.subtext, marginBottom: 8, lineHeight: 20, fontSize: 13 },
  avlLogText: { color: COLORS.red, fontWeight: 'bold' }
});