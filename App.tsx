import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

type Role = 'patient' | 'pharmacien' | 'livreur' | 'admin';
type AuthStep = 'role' | 'login' | 'register';
type StatusType = 'success' | 'warning' | 'error';

type AppUser = {
  role: Role;
  name: string;
  email: string;
  phone?: string;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  rating: number;
  reviews: number;
  discount?: number;
  packSizes: string[];
  category: 'medicament' | 'parapharmacie';
  price: number;
  available: boolean;
  image: string;
};

type OrderStatus = 'En attente' | 'Validee' | 'En livraison' | 'Livree' | 'Annulee';

type Order = {
  id: string;
  patientName: string;
  status: OrderStatus;
  eta: string;
  ordonnance: string;
  deliveryPrice: number;
  distance: string;
  courierName?: string;
  pickupConfirmed?: boolean;
  deliveredConfirmed?: boolean;
};

type AdminUser = {
  id: string;
  name: string;
  role: Role;
  status: 'Actif' | 'Suspendu';
  history: string[];
};

type PatientPrivateInfo = {
  patientName: string;
  socialNumber: string;
  mutuelle: string;
};

type CourierInfo = {
  name: string;
  distanceKm: number;
  status: 'Disponible' | 'En mission' | 'Suspendu';
};

type PersistedState = {
  user: AppUser | null;
  selectedRole: Role;
  cart: Array<{ productId: string; qty: number }>;
};

type NavTab = {
  key: string;
  label: string;
  icon: string;
};

type NotificationItem = {
  id: string;
  text: string;
  read: boolean;
  createdAt: number;
};

type PatientTab = 'home' | 'search' | 'cart' | 'orders' | 'profile' | 'detail';

const STORAGE_KEY = 'medimirville_ui_charter_v1';
const DEMO_ALL_FEATURES_ENABLED = true;

const TOKENS = {
  primary: '#0F9D8F',
  secondary: '#0F6CBD',
  background: '#EEF3F8',
  text: '#1B2430',
  border: '#D5DEE8',
  white: '#FFFFFF',
  success: '#1E9E5A',
  warning: '#E9A23B',
  error: '#D64545',
};

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Doliprane 1000mg',
    brand: 'Sanofi',
    rating: 4.8,
    reviews: 342,
    discount: 15,
    packSizes: ['Box 16', 'Box 32'],
    category: 'medicament',
    price: 4.9,
    available: true,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p2',
    name: 'Vitamine C',
    brand: 'NutriLife',
    rating: 4.6,
    reviews: 190,
    discount: 10,
    packSizes: ['30 caps', '60 caps', '90 caps'],
    category: 'medicament',
    price: 6.4,
    available: true,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p3',
    name: 'Gel Hydroalcoolique',
    brand: 'BioSafe',
    rating: 4.4,
    reviews: 121,
    discount: 12,
    packSizes: ['100ml', '250ml', '500ml'],
    category: 'parapharmacie',
    price: 2.8,
    available: true,
    image: 'https://images.unsplash.com/photo-1584483720412-ce931f4aefa8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p4',
    name: 'Masque FFP2',
    brand: 'Protect+',
    rating: 4.5,
    reviews: 88,
    discount: 20,
    packSizes: ['Pack 10', 'Pack 20'],
    category: 'parapharmacie',
    price: 9.2,
    available: false,
    image: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=600&q=80',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'CMD-201',
    patientName: 'Nadia R.',
    status: 'En attente',
    eta: '31 min',
    ordonnance: 'ordonnance-cmd-201.jpg',
    deliveryPrice: 4.5,
    distance: '3.2 km',
    courierName: 'Ahmed',
    pickupConfirmed: false,
    deliveredConfirmed: false,
  },
  {
    id: 'CMD-202',
    patientName: 'Leo M.',
    status: 'Livree',
    eta: '0 min',
    ordonnance: 'ordonnance-cmd-202.jpg',
    deliveryPrice: 5.1,
    distance: '4.7 km',
    courierName: 'Samir',
    pickupConfirmed: true,
    deliveredConfirmed: true,
  },
  {
    id: 'CMD-203',
    patientName: 'Karim A.',
    status: 'En livraison',
    eta: '14 min',
    ordonnance: 'ordonnance-cmd-203.jpg',
    deliveryPrice: 6.1,
    distance: '6.0 km',
    courierName: 'Youssef',
    pickupConfirmed: true,
    deliveredConfirmed: false,
  },
];

const ADMIN_USERS: AdminUser[] = [
  {
    id: 'u-201',
    name: 'Nadia R',
    role: 'patient',
    status: 'Actif',
    history: ['Commande CMD-201 creee', 'Ordonnance envoyee'],
  },
  {
    id: 'u-202',
    name: 'Pharmacie Centrale',
    role: 'pharmacien',
    status: 'Actif',
    history: ['RPPS verifie', '12 commandes validees'],
  },
  {
    id: 'u-203',
    name: 'Ahmed',
    role: 'livreur',
    status: 'Suspendu',
    history: ['Documents en attente', 'Formation terminee'],
  },
];

const PATIENT_PRIVATE_INFOS: PatientPrivateInfo[] = [
  { patientName: 'Nadia R.', socialNumber: '2860675123456', mutuelle: 'CNOPS' },
  { patientName: 'Leo M.', socialNumber: '1860475123499', mutuelle: 'AXA Sante' },
  { patientName: 'Karim A.', socialNumber: '1900375123488', mutuelle: 'Saham' },
];

const COURIERS: CourierInfo[] = [
  { name: 'Ahmed', distanceKm: 1.2, status: 'Disponible' },
  { name: 'Samir', distanceKm: 2.4, status: 'En mission' },
  { name: 'Youssef', distanceKm: 3.1, status: 'Disponible' },
];

const ROLE_LABELS: Record<Role, string> = {
  patient: 'Patient / Professionnel',
  pharmacien: 'Pharmacien',
  livreur: 'Livreur',
  admin: 'Admin',
};

const PATIENT_TABS: NavTab[] = [
  { key: 'home', label: 'Home', icon: 'H' },
  { key: 'search', label: 'Search', icon: 'Q' },
  { key: 'cart', label: 'Cart', icon: 'C' },
  { key: 'orders', label: 'Orders', icon: 'O' },
  { key: 'profile', label: 'Profile', icon: 'P' },
];

const PHARMACIEN_TABS: NavTab[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'D' },
  { key: 'commandes', label: 'Commandes', icon: 'C' },
  { key: 'stock', label: 'Stock', icon: 'S' },
  { key: 'profile', label: 'Profile', icon: 'P' },
];

const LIVREUR_TABS: NavTab[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'D' },
  { key: 'livraisons', label: 'Livraisons', icon: 'L' },
  { key: 'navigation', label: 'Navigation', icon: 'N' },
  { key: 'profile', label: 'Profile', icon: 'P' },
];

const ADMIN_TABS: NavTab[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'D' },
  { key: 'users', label: 'Users', icon: 'U' },
  { key: 'commandes', label: 'Commandes', icon: 'C' },
  { key: 'reports', label: 'Reports', icon: 'R' },
];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function money(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

function badgeType(status: OrderStatus): StatusType {
  if (status === 'Livree' || status === 'Validee') {
    return 'success';
  }
  if (status === 'Annulee') {
    return 'error';
  }
  return 'warning';
}

function InputField(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        secureTextEntry={props.secure}
        placeholderTextColor="#98A2B3"
        style={styles.input}
      />
    </View>
  );
}

function SearchBar(props: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.searchBarWrap}>
      <Text style={styles.searchIcon}>Q</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#9CA3AF"
        style={styles.searchInput}
      />
    </View>
  );
}

function AppButton(props: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  full?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.button,
        props.full !== false && styles.buttonFull,
        props.variant === 'secondary' && styles.buttonSecondary,
        props.variant === 'danger' && styles.buttonDanger,
        pressed && styles.buttonPressed,
        props.disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          props.variant === 'secondary' && styles.buttonTextSecondary,
        ]}
      >
        {props.title}
      </Text>
    </Pressable>
  );
}

function StatusBadge({ label, type }: { label: string; type: StatusType }) {
  return (
    <View
      style={[
        styles.statusBadge,
        type === 'success' && styles.statusSuccess,
        type === 'warning' && styles.statusWarning,
        type === 'error' && styles.statusError,
      ]}
    >
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

function ProductCard(props: { product: Product; onAdd: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.productCard, pressed && styles.cardPressed]}>
      <Image source={{ uri: props.product.image }} style={styles.productImage} />
      <Text style={styles.productName}>{props.product.name}</Text>
      <Text style={styles.productPrice}>{money(props.product.price)}</Text>
      <AppButton title="+" onPress={props.onAdd} full={false} disabled={!props.product.available} />
    </Pressable>
  );
}

function FakeMap(props: { eta: string; status: string }) {
  return (
    <View style={styles.fakeMap}>
      <View style={styles.mapTopOverlay}>
        <Text style={styles.mapTitle}>Map fake</Text>
      </View>
      <View style={styles.pinA}><Text style={styles.pinText}>P</Text></View>
      <View style={styles.pinB}><Text style={styles.pinText}>C</Text></View>
      <View style={styles.pinDriver}><Text style={styles.pinText}>A</Text></View>
      <View style={styles.mapBottomOverlay}>
        <StatusBadge label={props.status} type={props.status === 'Livree' ? 'success' : 'warning'} />
        <Text style={styles.mapEta}>ETA {props.eta}</Text>
      </View>
    </View>
  );
}

function Stepper({ status }: { status: OrderStatus }) {
  const steps: Array<{ key: string; label: string }> = [
    { key: 'En attente', label: 'Recue' },
    { key: 'Validee', label: 'Validee' },
    { key: 'En livraison', label: 'En livraison' },
    { key: 'Livree', label: 'Livree' },
  ];

  const index = steps.findIndex((s) => s.key === status);

  return (
    <View style={styles.stepperRow}>
      {steps.map((step, idx) => (
        <View key={step.key} style={styles.stepItem}>
          <View style={[styles.stepCircle, idx <= index && styles.stepCircleActive]} />
          <Text style={[styles.stepLabel, idx <= index && styles.stepLabelActive]}>{step.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const detailImageWidth = Math.max(250, Math.min(isDesktop ? 420 : width - 64, 520));

  const [booting, setBooting] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('role');
  const [showGoogle, setShowGoogle] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('patient');
  const [user, setUser] = useState<AppUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerData, setRegisterData] = useState<Record<string, string>>({});

  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cart, setCart] = useState<Array<{ productId: string; qty: number }>>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({
    p1: 42,
    p2: 18,
    p3: 30,
    p4: 0,
  });
  const [stockSearch, setStockSearch] = useState('');
  const [stockLowOnly, setStockLowOnly] = useState(false);
  const [stockCreateOpen, setStockCreateOpen] = useState(false);
  const [stockCreateData, setStockCreateData] = useState<{
    name: string;
    brand: string;
    price: string;
    qty: string;
    image: string;
    category: 'medicament' | 'parapharmacie';
  }>({
    name: '',
    brand: '',
    price: '',
    qty: '0',
    image: '',
    category: 'medicament',
  });

  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'medicines' | 'supplements' | 'devices' | 'care'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPackSize, setSelectedPackSize] = useState('');
  const [detailQty, setDetailQty] = useState(1);
  const [catalogPrice, setCatalogPrice] = useState('20');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [ordonnancePreview, setOrdonnancePreview] = useState('');
  const [secureCode, setSecureCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const [patientTab, setPatientTab] = useState<PatientTab>('home');
  const [pharmacienTab, setPharmacienTab] = useState('dashboard');
  const [livreurTab, setLivreurTab] = useState('dashboard');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CB' | 'Wallet'>('CB');
  const [rppsVerified, setRppsVerified] = useState(DEMO_ALL_FEATURES_ENABLED);
  const [consentGiven, setConsentGiven] = useState(DEMO_ALL_FEATURES_ENABLED);
  const [soundNotifEnabled, setSoundNotifEnabled] = useState(true);
  const [notifPushEnabled, setNotifPushEnabled] = useState(true);
  const [notifEmailEnabled, setNotifEmailEnabled] = useState(true);
  const [notifSmsEnabled, setNotifSmsEnabled] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'RGPD: journalisation active',
    'Securite: acces admin strictement controle',
  ]);
  const [incidents, setIncidents] = useState<Array<{ id: string; title: string; status: 'Ouvert' | 'Resolue' }>>([
    { id: 'INC-11', title: 'Retard livraison zone nord', status: 'Ouvert' },
    { id: 'INC-12', title: 'Ordonnance illisible', status: 'Ouvert' },
  ]);

  const [chatOpen, setChatOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<string[]>([
    'Assistant: Bonjour, je peux vous aider pour vos commandes.',
  ]);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const [saved] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY), wait(1200)]);
      if (!mounted) {
        return;
      }

      if (saved) {
        try {
          const parsed = JSON.parse(saved) as PersistedState;
          setUser(parsed.user ?? null);
          setCart(parsed.cart ?? []);
          setSelectedRole(parsed.selectedRole ?? 'patient');
        } catch {
          setUser(null);
        }
      }

      setBooting(false);
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const state: PersistedState = {
      user,
      selectedRole,
      cart,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // ignore in demo mode
    });
  }, [cart, selectedRole, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const t = setTimeout(() => {
      setNotifications((prev) => [
        {
          id: `n-${Date.now()}-${Math.random()}`,
          text: `Nouvelle notif pour ${ROLE_LABELS[user.role]}`,
          read: false,
          createdAt: Date.now(),
        },
        ...prev,
      ].slice(0, 24));
    }, 5000);

    return () => clearTimeout(t);
  }, [orders, user]);

  const filteredProducts = useMemo(() => {
    const categoryMap: Record<'all' | 'medicines' | 'supplements' | 'devices' | 'care', 'all' | 'medicament' | 'parapharmacie'> = {
      all: 'all',
      medicines: 'medicament',
      supplements: 'medicament',
      devices: 'parapharmacie',
      care: 'parapharmacie',
    };
    const mappedCategory = categoryMap[selectedCategory];
    const max = Number(catalogPrice);
    return products.filter((p) => {
      const searchOk = p.name.toLowerCase().includes(globalSearch.toLowerCase());
      const priceOk = Number.isNaN(max) ? true : p.price <= max;
      const availabilityOk = availableOnly ? p.available : true;
      const categoryOk = mappedCategory === 'all' ? true : p.category === mappedCategory;
      return searchOk && priceOk && availabilityOk && categoryOk;
    });
  }, [availableOnly, catalogPrice, globalSearch, products, selectedCategory]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const cartRows = useMemo(() => {
    return cart
      .map((row) => {
        const product = products.find((p) => p.id === row.productId);
        if (!product) {
          return null;
        }
        return {
          ...row,
          product,
          total: product.price * row.qty,
        };
      })
      .filter((x): x is { productId: string; qty: number; product: Product; total: number } => Boolean(x));
  }, [cart, products]);

  const cartTotal = useMemo(() => cartRows.reduce((sum, row) => sum + row.total, 0), [cartRows]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const selectedAdminUser = useMemo(
    () => ADMIN_USERS.find((u) => u.id === selectedAdminUserId) ?? null,
    [selectedAdminUserId]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'unread') {
      return notifications.filter((n) => !n.read);
    }
    if (notifFilter === 'read') {
      return notifications.filter((n) => n.read);
    }
    return notifications;
  }, [notifications, notifFilter]);

  const pushNotif = (text: string) => {
    const suffix = soundNotifEnabled ? ' | BIP' : '';
    setNotifications((prev) => [
      {
        id: `n-${Date.now()}-${Math.random()}`,
        text: `${text}${suffix}`,
        read: false,
        createdAt: Date.now(),
      },
      ...prev,
    ].slice(0, 24));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const adjustStock = (productId: string, delta: number) => {
    setStockLevels((prev) => {
      const current = prev[productId] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const createStockProduct = () => {
    const name = stockCreateData.name.trim();
    const brand = stockCreateData.brand.trim();
    const parsedPrice = Number(stockCreateData.price);
    const parsedQty = Math.max(0, Math.floor(Number(stockCreateData.qty)));

    if (!name || !brand || Number.isNaN(parsedPrice)) {
      Alert.alert('Produit invalide', 'Renseignez au minimum nom, marque et prix valides.');
      return;
    }

    const id = `p${Date.now()}`;
    const newProduct: Product = {
      id,
      name,
      brand,
      rating: 4.5,
      reviews: 0,
      packSizes: ['Standard'],
      category: stockCreateData.category,
      price: parsedPrice,
      available: parsedQty > 0,
      image: stockCreateData.image.trim() || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    };

    setProducts((prev) => [newProduct, ...prev]);
    setStockLevels((prev) => ({ ...prev, [id]: parsedQty }));
    setStockCreateOpen(false);
    setStockCreateData({
      name: '',
      brand: '',
      price: '',
      qty: '0',
      image: '',
      category: 'medicament',
    });
    pushNotif(`Nouveau produit ajoute au stock: ${name}`);
  };

  const pushAudit = (text: string) => {
    setAuditLogs((prev) => [`${new Date().toLocaleTimeString()} - ${text}`, ...prev].slice(0, 12));
  };

  const validateSocialNumber = (value: string): boolean => {
    return /^\d{13,15}$/.test(value.trim());
  };

  const generateSecureDeliveryCode = (orderId: string): string => {
    const seed = `${orderId}-${Date.now()}-${Math.random()}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 1000000;
    }
    return `${Math.abs(hash)}`.padStart(6, '0');
  };

  const assignNearestCourier = (orderId: string): string => {
    const available = COURIERS.filter((c) => c.status === 'Disponible').sort((a, b) => a.distanceKm - b.distanceKm);
    const courier = available[0] ?? COURIERS[0];

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, courierName: courier.name, status: 'En livraison', pickupConfirmed: false, deliveredConfirmed: false }
          : o
      )
    );

    pushAudit(`Dispatch auto: ${orderId} assignee a ${courier.name} (plus proche)`);
    pushNotif(`Commande ${orderId} envoyee automatiquement au livreur ${courier.name}`);
    return courier.name;
  };

  const addToCart = (productId: string, qtyToAdd = 1) => {
    const safeQty = Math.max(1, qtyToAdd);
    setCart((prev) => {
      const found = prev.find((x) => x.productId === productId);
      if (found) {
        return prev.map((x) => (x.productId === productId ? { ...x, qty: x.qty + safeQty } : x));
      }
      return [...prev, { productId, qty: safeQty }];
    });
    pushNotif('Produit ajoute au panier');
  };

  const openProductDetail = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedPackSize(product.packSizes[0] ?? 'Standard');
    setDetailQty(1);
    setPatientTab('detail');
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((x) => x.productId !== productId));
      return;
    }
    setCart((prev) => prev.map((x) => (x.productId === productId ? { ...x, qty } : x)));
  };

  const placeOrder = async () => {
    if (!cart.length) {
      Alert.alert('Panier vide', 'Ajoutez des produits avant de commander.');
      return;
    }

    await wait(700);
    const next: Order = {
      id: `CMD-${Math.floor(300 + Math.random() * 500)}`,
      patientName: user?.name ?? 'Patient',
      status: 'En attente',
      eta: '35 min',
      ordonnance: ordonnancePreview || 'ordonnance-a-transmettre.jpg',
      deliveryPrice: 4.8,
      distance: '4.2 km',
    };

    setOrders((prev) => [next, ...prev]);
    setCart([]);
    setPatientTab('orders');
    pushAudit(`Commande ${next.id} creee par ${user?.email ?? 'patient'}`);
    pushNotif('Commande envoyee au pharmacien');
  };

  const doLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Champs manquants', 'Renseignez email et mot de passe.');
      return;
    }

    setLoadingAuth(true);
    await wait(700);
    setUser({ role: selectedRole, name: loginEmail.split('@')[0], email: loginEmail });
    pushAudit(`Connexion ${selectedRole}: ${loginEmail}`);
    setLoadingAuth(false);
    pushNotif('Connexion reussie');
  };

  const doRegister = async () => {
    const fields = selectedRole === 'patient'
      ? ['name', 'email', 'phone', 'social', 'mutuelle', 'password']
      : selectedRole === 'pharmacien'
      ? ['pharmacy', 'rpps', 'address', 'email', 'password']
      : selectedRole === 'livreur'
      ? ['name', 'id', 'phone', 'email', 'status', 'docs', 'password']
      : ['name', 'email', 'password'];

    const missing = fields.some((k) => !registerData[k]);
    if (missing) {
      Alert.alert('Formulaire incomplet', 'Completez les champs requis.');
      return;
    }

    if (!consentGiven && !DEMO_ALL_FEATURES_ENABLED) {
      Alert.alert('Consentement RGPD requis', 'Vous devez accepter le stockage des donnees personnelles.');
      return;
    }

    if (selectedRole === 'patient' && !DEMO_ALL_FEATURES_ENABLED) {
      if (!validateSocialNumber(registerData.social ?? '')) {
        Alert.alert('Numero securite sociale invalide', 'Le numero doit contenir 13 a 15 chiffres.');
        return;
      }
      if ((registerData.mutuelle ?? '').trim().length < 2) {
        Alert.alert('Mutuelle invalide', 'La mutuelle est obligatoire pour creer le compte patient.');
        return;
      }
    }

    if (selectedRole === 'pharmacien' && !rppsVerified && !DEMO_ALL_FEATURES_ENABLED) {
      Alert.alert('RPPS non verifie', 'La verification RPPS est obligatoire pour activer le compte pharmacien.');
      return;
    }

    setLoadingAuth(true);
    await wait(900);
    setUser({
      role: selectedRole,
      name: registerData.name ?? registerData.pharmacy ?? 'Compte demo',
      email: registerData.email ?? 'demo@app.com',
      phone: registerData.phone,
    });
    pushAudit(`Creation compte ${selectedRole}: ${registerData.email ?? 'demo@app.com'}`);
    setLoadingAuth(false);
    pushNotif('Compte cree avec succes');
  };

  const googleLogin = async (name: string) => {
    setLoadingAuth(true);
    await wait(700);
    setUser({
      role: selectedRole,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@gmail.com`,
    });
    setShowGoogle(false);
    pushAudit(`Connexion Google ${selectedRole}: ${name}`);
    setLoadingAuth(false);
    pushNotif('Google login succes');
  };

  const logout = () => {
    pushAudit(`Deconnexion: ${user?.email ?? 'session'}`);
    setUser(null);
    setAuthStep('role');
    setLoginEmail('');
    setLoginPassword('');
  };

  const verifyCode = () => {
    if (!generatedCode) {
      if (DEMO_ALL_FEATURES_ENABLED) {
        const autoCode = generateSecureDeliveryCode(orders[0]?.id ?? 'CMD-DEMO');
        setGeneratedCode(autoCode);
        if (!secureCode) {
          setSecureCode(autoCode);
        }
        pushNotif('Code securise auto-genere (mode demo complet)');
        Alert.alert('Code active', `Code genere automatiquement: ${autoCode}`);
        return;
      }
      Alert.alert('Code indisponible', 'Le pharmacien doit generer un code.');
      return;
    }

    if (secureCode === generatedCode) {
      Alert.alert('Code valide', 'Commande remise avec succes.');
      return;
    }

    Alert.alert('Code incorrect', 'Veuillez verifier le code.');
  };

  const changeOrder = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) {
          return o;
        }

        if (status === 'En livraison') {
          return { ...o, status, pickupConfirmed: true };
        }

        if (status === 'Livree') {
          return { ...o, status, deliveredConfirmed: true, pickupConfirmed: true };
        }

        return { ...o, status };
      })
    );
    pushAudit(`Commande ${id} -> ${status}`);
    pushNotif(`Commande ${id} -> ${status}`);
  };

  const selectedTabs = user?.role === 'patient'
    ? PATIENT_TABS
    : user?.role === 'pharmacien'
    ? PHARMACIEN_TABS
    : user?.role === 'livreur'
    ? LIVREUR_TABS
    : ADMIN_TABS;

  const activeTab = user?.role === 'patient'
    ? patientTab
    : user?.role === 'pharmacien'
    ? pharmacienTab
    : user?.role === 'livreur'
    ? livreurTab
    : adminTab;

  const setActiveTab = (key: string) => {
    if (user?.role === 'patient') {
      setPatientTab(key);
      return;
    }
    if (user?.role === 'pharmacien') {
      setPharmacienTab(key);
      return;
    }
    if (user?.role === 'livreur') {
      setLivreurTab(key);
      return;
    }
    setAdminTab(key);
  };

  const sendChat = () => {
    if (!chatInput.trim()) {
      return;
    }
    const msg = chatInput.trim();
    setChatMessages((prev) => [...prev, `Vous: ${msg}`]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [...prev, 'Assistant: Votre demande est en cours de traitement.']);
    }, 600);
  };

  const renderRoleAuthFields = () => {
    if (selectedRole === 'patient') {
      return (
        <>
          <InputField label="Nom / prenom" value={registerData.name ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, name: v }))} />
          <InputField label="Email" value={registerData.email ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, email: v }))} />
          <InputField label="Telephone" value={registerData.phone ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, phone: v }))} />
          <InputField label="Num securite sociale" value={registerData.social ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, social: v }))} />
          <InputField label="Mutuelle" value={registerData.mutuelle ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, mutuelle: v }))} />
        </>
      );
    }

    if (selectedRole === 'pharmacien') {
      return (
        <>
          <InputField label="Nom pharmacie" value={registerData.pharmacy ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, pharmacy: v }))} />
          <InputField label="RPPS" value={registerData.rpps ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, rpps: v }))} />
          <View style={styles.rowWrap}>
            <AppButton
              title="Verifier RPPS"
              onPress={() => {
                const ok = /^\d{11}$/.test((registerData.rpps ?? '').trim());
                setRppsVerified(ok);
                Alert.alert('Verification RPPS', ok ? 'Numero RPPS valide.' : 'Numero RPPS invalide.');
              }}
              full={false}
            />
            <StatusBadge label={rppsVerified ? 'RPPS valide' : 'RPPS non verifie'} type={rppsVerified ? 'success' : 'warning'} />
          </View>
          <InputField label="Adresse" value={registerData.address ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, address: v }))} />
          <InputField label="Email" value={registerData.email ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, email: v }))} />
        </>
      );
    }

    if (selectedRole === 'livreur') {
      return (
        <>
          <InputField label="Nom" value={registerData.name ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, name: v }))} />
          <InputField label="CIN / ID" value={registerData.id ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, id: v }))} />
          <InputField label="Telephone" value={registerData.phone ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, phone: v }))} />
          <InputField label="Email" value={registerData.email ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, email: v }))} />
          <InputField label="Statut auto-entrepreneur" value={registerData.status ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, status: v }))} />
          <Pressable style={styles.uploadBox} onPress={() => setRegisterData((p) => ({ ...p, docs: 'documents.pdf' }))}>
            <Text style={styles.uploadText}>Upload documents (fake)</Text>
            <Text style={styles.uploadHint}>{registerData.docs ?? 'Aucun fichier'}</Text>
          </Pressable>
        </>
      );
    }

    return (
      <>
        <InputField label="Nom" value={registerData.name ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, name: v }))} />
        <InputField label="Email" value={registerData.email ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, email: v }))} />
      </>
    );
  };

  const AuthScreen = () => (
    <SafeAreaView style={styles.authScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.authContent}>
        <View style={styles.authBrandRow}>
          <View style={styles.brandBadge}><Text style={styles.brandBadgeText}>M</Text></View>
          <View>
            <Text style={styles.authBrandTitle}>MediMirville</Text>
            <Text style={styles.authBrandSub}>Livraison medicale securisee</Text>
          </View>
        </View>

        {authStep === 'role' && (
          <View style={styles.card}>
            <Text style={styles.h1}>Choix du role</Text>
            <Text style={styles.caption}>Login {'>'} Role {'>'} Dashboard {'>'} Action</Text>
            <View style={styles.roleSelectorWrap}>
              {(['patient', 'pharmacien', 'livreur', 'admin'] as Role[]).map((role) => (
                <Pressable
                  key={role}
                  onPress={() => setSelectedRole(role)}
                  style={({ pressed }) => [
                    styles.roleChoice,
                    selectedRole === role && styles.roleChoiceActive,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <Text style={[styles.roleChoiceText, selectedRole === role && styles.roleChoiceTextActive]}>
                    {ROLE_LABELS[role]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <AppButton title="Se connecter" onPress={() => setAuthStep('login')} />
            <AppButton title="Creer un compte" onPress={() => setAuthStep('register')} variant="secondary" />
          </View>
        )}

        {authStep === 'login' && (
          <View style={styles.card}>
            <Text style={styles.h1}>Connexion</Text>
            <Text style={styles.caption}>Role selectionne: {ROLE_LABELS[selectedRole]}</Text>
            <InputField label="Email" value={loginEmail} onChangeText={setLoginEmail} placeholder="exemple@email.com" />
            <InputField label="Mot de passe" value={loginPassword} onChangeText={setLoginPassword} secure placeholder="********" />
            <Pressable onPress={() => Alert.alert('Info', 'Lien de reset envoye (fake).')}>
              <Text style={styles.linkText}>Mot de passe oublie</Text>
            </Pressable>
            <AppButton title={loadingAuth ? 'Connexion...' : 'Se connecter'} onPress={() => void doLogin()} disabled={loadingAuth} />
            <AppButton title="Continuer avec Google" onPress={() => setShowGoogle(true)} variant="secondary" />
            <AppButton title="Retour" onPress={() => setAuthStep('role')} variant="secondary" />
          </View>
        )}

        {authStep === 'register' && (
          <View style={styles.card}>
            <Text style={styles.h1}>Inscription</Text>
            <Text style={styles.caption}>Champs dynamiques - {ROLE_LABELS[selectedRole]}</Text>
            {renderRoleAuthFields()}
            <Pressable style={styles.checkRow} onPress={() => setConsentGiven((v) => !v)}>
              <Text style={styles.body}>Consentement RGPD donnees personnelles</Text>
              <Text style={styles.checkOk}>{consentGiven ? 'OK' : 'Non'}</Text>
            </Pressable>
            <InputField label="Mot de passe" value={registerData.password ?? ''} onChangeText={(v) => setRegisterData((p) => ({ ...p, password: v }))} secure placeholder="********" />
            <AppButton title={loadingAuth ? 'Creation...' : 'Creer'} onPress={() => void doRegister()} disabled={loadingAuth} />
            <AppButton title="Retour" onPress={() => setAuthStep('role')} variant="secondary" />
          </View>
        )}
      </ScrollView>

      <Modal visible={showGoogle} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.h2}>Choisir un compte Google</Text>
            {['Amine B', 'Leila M', 'Ahmed K'].map((item) => (
              <Pressable key={item} style={styles.googleRow} onPress={() => void googleLogin(item)}>
                <Text style={styles.googleName}>{item}</Text>
                <Text style={styles.googleMail}>{item.toLowerCase().replace(' ', '.')}@gmail.com</Text>
              </Pressable>
            ))}
            <AppButton title="Annuler" variant="secondary" onPress={() => setShowGoogle(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <View style={styles.topLeftCompact}>
        <View style={styles.logoMini}><Text style={styles.logoMiniText}>M</Text></View>
      </View>
      <View style={styles.topCenterSearch}>
        {user?.role === 'patient' && patientTab !== 'detail' ? (
          <SearchBar value={globalSearch} onChangeText={setGlobalSearch} placeholder="Search products" />
        ) : (
          <Text style={styles.topTitle}>{user?.role === 'patient' && patientTab === 'detail' ? 'Product Detail' : ROLE_LABELS[user?.role ?? 'patient']}</Text>
        )}
      </View>
      <View style={styles.topRightIcons}>
        {user?.role === 'patient' && (
          <Pressable style={styles.topIconCircle} onPress={() => setPatientTab('cart')}>
            <Text style={styles.topIconText}>C</Text>
            <View style={styles.topCountBadge}><Text style={styles.topCountText}>{cart.reduce((sum, item) => sum + item.qty, 0)}</Text></View>
          </Pressable>
        )}
        <View style={styles.topIconCircle}>
          <Text style={styles.topIconText}>{(user?.name ?? 'U').slice(0, 1).toUpperCase()}</Text>
        </View>
        <Pressable style={styles.topIconCircle} onPress={() => setNotificationsOpen(true)}>
          <MaterialCommunityIcons name="bell-outline" size={16} color={TOKENS.secondary} />
          <View style={styles.topCountBadge}><Text style={styles.topCountText}>{unreadNotificationsCount}</Text></View>
        </Pressable>
        <Pressable style={styles.topLogoutBtn} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={14} color="#FFFFFF" />
          <Text style={styles.topLogoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderDesktopHeader = () => (
    <View style={styles.desktopHeader}>
      <View style={styles.desktopBrandWrap}>
        <View style={styles.desktopBrandIcon}><Text style={styles.desktopBrandIconText}>Px</Text></View>
        <Text style={styles.desktopBrandTitle}>PharmaLiv</Text>
      </View>
      <View style={styles.desktopHeaderRight}>
        <SearchBar value={globalSearch} onChangeText={setGlobalSearch} placeholder="Rechercher" />
        {user?.role === 'patient' && (
          <Pressable style={styles.headerCartPill} onPress={() => setPatientTab('cart')}>
            <Text style={styles.headerCartPillText}>Cart {cart.reduce((sum, item) => sum + item.qty, 0)}</Text>
          </Pressable>
        )}
        <Pressable style={styles.notificationBadge} onPress={() => setNotificationsOpen(true)}>
          <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
        </Pressable>
        <View style={styles.profilePill}>
          <Text style={styles.profilePillText}>{(user?.name ?? 'U').slice(0, 2).toUpperCase()}</Text>
        </View>
        <AppButton title="Logout" onPress={logout} variant="secondary" full={false} />
      </View>
    </View>
  );

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarLogo}>MediMirville</Text>
      <Text style={styles.sidebarRole}>{ROLE_LABELS[user?.role ?? 'patient']}</Text>
      <View style={styles.sidebarMenu}>
        {selectedTabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.sidebarItem, activeTab === tab.key && styles.sidebarItemActive]}
          >
            <Text style={[styles.sidebarItemText, activeTab === tab.key && styles.sidebarItemTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <AppButton title="Logout" onPress={logout} variant="secondary" />
    </View>
  );

  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      {selectedTabs.map((tab) => (
        <Pressable key={tab.key} style={styles.bottomItem} onPress={() => setActiveTab(tab.key)}>
          <View style={[styles.bottomIcon, activeTab === tab.key && styles.bottomIconActive]}>
            <Text style={[styles.bottomIconText, activeTab === tab.key && styles.bottomIconTextActive]}>{tab.icon}</Text>
          </View>
          <Text style={[styles.bottomLabel, activeTab === tab.key && styles.bottomLabelActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const patientScreen = () => {
    const categoryPills: Array<{ key: 'medicines' | 'supplements' | 'devices' | 'care'; label: string }> = [
      { key: 'medicines', label: 'Medicines' },
      { key: 'supplements', label: 'Supplements' },
      { key: 'devices', label: 'Health Devices' },
      { key: 'care', label: 'Personal Care' },
    ];

    if (patientTab === 'home') {
      return (
        <>
          <View style={styles.promoBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoBadge}>15% OFF</Text>
              <Text style={styles.promoTitle}>Health and supplements week</Text>
              <Text style={styles.promoSub}>Save on bestsellers and essentials for your daily wellness.</Text>
              <AppButton title="Shop Now" onPress={() => setPatientTab('search')} full={false} />
            </View>
            <View style={styles.promoArtWrap}>
              <Text style={styles.promoArtText}>+</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
              {categoryPills.map((pill) => (
                <Pressable
                  key={pill.key}
                  onPress={() => setSelectedCategory(pill.key)}
                  style={[styles.categoryPill, selectedCategory === pill.key && styles.categoryPillActive]}
                >
                  <Text style={[styles.categoryPillText, selectedCategory === pill.key && styles.categoryPillTextActive]}>
                    {pill.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Bestseller Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bestsellerRow}>
              {filteredProducts.slice(0, 6).map((p) => (
                <Pressable key={p.id} style={styles.bestsellerCard} onPress={() => openProductDetail(p)}>
                  <Image source={{ uri: p.image }} style={styles.bestsellerImage} />
                  {!!p.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>{p.discount}% OFF</Text>
                    </View>
                  )}
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.productMeta}>{p.brand}</Text>
                  <Text style={styles.productMeta}>* {p.rating.toFixed(1)} ({p.reviews})</Text>
                  <Text style={styles.productPrice}>{money(p.price)}</Text>
                  <AppButton title="Add to Cart" onPress={() => addToCart(p.id)} full={false} disabled={!p.available} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </>
      );
    }

    if (patientTab === 'search') {
      return (
        <View style={styles.card}>
          <Text style={styles.h2}>Catalogue</Text>
          <Text style={styles.caption}>Discover curated products from trusted brands.</Text>
          <SearchBar value={globalSearch} onChangeText={setGlobalSearch} placeholder="Trouver un produit" />
          <View style={styles.filterRow}>
            <InputField label="Prix max" value={catalogPrice} onChangeText={setCatalogPrice} placeholder="20" />
            <AppButton
              title={availableOnly ? 'Disponibles' : 'Tout'}
              variant="secondary"
              onPress={() => setAvailableOnly((v) => !v)}
              full={false}
            />
          </View>
          {filteredProducts.map((p) => (
            <View key={p.id} style={styles.catalogCard}>
              <Image source={{ uri: p.image }} style={styles.catalogImage} />
              <View style={styles.catalogContent}>
                <Text style={styles.orderTitle}>{p.name}</Text>
                <Text style={styles.caption}>{p.brand}</Text>
                <Text style={styles.body}>* {p.rating.toFixed(1)} ({p.reviews})</Text>
                <Text style={styles.productPrice}>{money(p.price)}</Text>
                <StatusBadge label={p.available ? 'Disponible' : 'Indisponible'} type={p.available ? 'success' : 'error'} />
              </View>
              <View style={styles.catalogActions}>
                <AppButton title="View" onPress={() => openProductDetail(p)} variant="secondary" full={false} />
                <AppButton title="Add" onPress={() => addToCart(p.id)} full={false} disabled={!p.available} />
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (patientTab === 'cart') {
      return (
        <View style={styles.card}>
          <Text style={styles.h2}>Panier</Text>
          {cartRows.length === 0 && <Text style={styles.body}>Panier vide</Text>}
          {cartRows.map((row) => (
            <View key={row.productId} style={styles.orderCard}>
              <Image source={{ uri: row.product.image }} style={styles.cartThumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>{row.product.name}</Text>
                <Text style={styles.caption}>{row.product.brand}</Text>
                <Text style={styles.productPrice}>{money(row.total)}</Text>
              </View>
              <View style={styles.qtyBox}>
                <Pressable style={styles.iconButton} onPress={() => updateQty(row.productId, row.qty - 1)}>
                  <Text style={styles.iconButtonText}>-</Text>
                </Pressable>
                <Text style={styles.qtyText}>{row.qty}</Text>
                <Pressable style={styles.iconButton} onPress={() => updateQty(row.productId, row.qty + 1)}>
                  <Text style={styles.iconButtonText}>+</Text>
                </Pressable>
              </View>
              <Pressable style={styles.removeIcon} onPress={() => updateQty(row.productId, 0)}>
                <Text style={styles.removeIconText}>X</Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.orderSummaryWrap}>
            <Text style={styles.h2}>Order Summary</Text>
            <View style={styles.summaryRow}><Text style={styles.caption}>Sub Total</Text><Text style={styles.body}>{money(cartTotal)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.caption}>Shipping & Tax</Text><Text style={styles.body}>{money(cartTotal * 0.1)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Total</Text><Text style={styles.summaryTotalValue}>{money(cartTotal * 1.1)}</Text></View>
          </View>
          <Text style={styles.caption}>Paiement securise</Text>
          <View style={styles.rowWrap}>
            <AppButton
              title="CB"
              onPress={() => setPaymentMethod('CB')}
              variant={paymentMethod === 'CB' ? 'primary' : 'secondary'}
              full={false}
            />
            <AppButton
              title="Wallet"
              onPress={() => setPaymentMethod('Wallet')}
              variant={paymentMethod === 'Wallet' ? 'primary' : 'secondary'}
              full={false}
            />
          </View>
          <Text style={styles.caption}>Methode: {paymentMethod}</Text>
          <AppButton title="Checkout" onPress={() => void placeOrder()} />
        </View>
      );
    }

    if (patientTab === 'orders') {
      const order = orders[0];
      return (
        <>
          <View style={styles.card}>
            <Text style={styles.h2}>Tracking commande</Text>
            <Stepper status={order?.status ?? 'En attente'} />
            <FakeMap eta={order?.eta ?? '30 min'} status={order?.status ?? 'En attente'} />
            <Text style={styles.caption}>Suivi GPS temps reel + photos</Text>
            <View style={styles.miniProductsRow}>
              {products.slice(0, 3).map((product) => (
                <Image key={`trk-${product.id}`} source={{ uri: product.image }} style={styles.miniProductThumb} />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Mes commandes</Text>
            {orders.slice(0, 4).map((o) => (
              <View key={`order-${o.id}`} style={styles.orderCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>{o.id}</Text>
                  <Text style={styles.caption}>ETA {o.eta} - Distance {o.distance}</Text>
                </View>
                <StatusBadge label={o.status} type={badgeType(o.status)} />
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Code securise</Text>
            <Text style={styles.caption}>Entrer code fourni par pharmacien</Text>
            <InputField label="Code" value={secureCode} onChangeText={setSecureCode} placeholder="******" />
            <AppButton title="Verifier code" onPress={verifyCode} />
          </View>
        </>
      );
    }

    if (patientTab === 'detail') {
      if (!selectedProduct) {
        return (
          <View style={styles.card}>
            <Text style={styles.h2}>Product Detail</Text>
            <Text style={styles.caption}>Select a product from Home or Catalogue.</Text>
          </View>
        );
      }

      const productGallery = [
        selectedProduct.image,
        products[(products.findIndex((p) => p.id === selectedProduct.id) + 1) % products.length].image,
        products[(products.findIndex((p) => p.id === selectedProduct.id) + 2) % products.length].image,
      ];

      return (
        <>
          <View style={styles.card}>
            <View style={styles.detailHeaderRow}>
              <Pressable style={styles.iconCircle} onPress={() => setPatientTab('home')}><Text style={styles.iconButtonText}>{'<'}</Text></Pressable>
              <Text style={styles.h2}>Product Detail</Text>
              <Pressable style={styles.iconCircle} onPress={() => pushNotif('Share link copied (demo)')}><Text style={styles.iconButtonText}>S</Text></Pressable>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const page = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, e.nativeEvent.layoutMeasurement.width));
                setOrdonnancePreview(String(page));
              }}
              scrollEventThrottle={16}
            >
              {productGallery.map((img) => (
                <Image key={img} source={{ uri: img }} style={[styles.detailHeroImage, { width: detailImageWidth }]} />
              ))}
            </ScrollView>
            <View style={styles.dotRow}>
              {productGallery.map((_, i) => (
                <View key={`dot-${i}`} style={[styles.dot, Number(ordonnancePreview || '0') === i && styles.dotActive]} />
              ))}
            </View>

            <Text style={styles.h2}>{selectedProduct.name}</Text>
            <Text style={styles.caption}>{selectedProduct.brand}</Text>
            <Text style={styles.body}>* {selectedProduct.rating.toFixed(1)} ({selectedProduct.reviews} reviews)</Text>
            <Text style={styles.detailPrice}>{money(selectedProduct.price)}</Text>

            <View style={styles.qtyPackRow}>
              <View style={styles.qtyBox}>
                <Pressable style={styles.iconButton} onPress={() => setDetailQty((v) => Math.max(1, v - 1))}>
                  <Text style={styles.iconButtonText}>-</Text>
                </Pressable>
                <Text style={styles.qtyText}>{detailQty}</Text>
                <Pressable style={styles.iconButton} onPress={() => setDetailQty((v) => v + 1)}>
                  <Text style={styles.iconButtonText}>+</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.packDropdown}
                onPress={() => {
                  const idx = selectedProduct.packSizes.findIndex((s) => s === selectedPackSize);
                  const next = selectedProduct.packSizes[(idx + 1) % selectedProduct.packSizes.length];
                  setSelectedPackSize(next);
                }}
              >
                <Text style={styles.packDropdownText}>{selectedPackSize || selectedProduct.packSizes[0]}</Text>
              </Pressable>
            </View>

            <AppButton
              title="Add to Cart"
              onPress={() => {
                addToCart(selectedProduct.id, detailQty);
                setPatientTab('cart');
              }}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Similar Supplements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bestsellerRow}>
              {products.filter((p) => p.id !== selectedProduct.id).map((p) => (
                <Pressable key={`sim-${p.id}`} style={styles.similarCard} onPress={() => openProductDetail(p)}>
                  <Image source={{ uri: p.image }} style={styles.similarImage} />
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.productMeta}>{p.brand}</Text>
                  <Text style={styles.productPrice}>{money(p.price)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </>
      );
    }

    return (
      <>
        <View style={styles.card}>
          <View style={styles.profileHero}>
            <View style={styles.profileAvatarLg}>
              <Text style={styles.profileAvatarLgText}>{(user?.name ?? 'U').slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h2}>Profil</Text>
              <Text style={styles.caption}>Patient / Professionnel</Text>
            </View>
            <StatusBadge label="Compte actif" type="success" />
          </View>

          <View style={styles.detailPanel}>
            <Text style={styles.body}>Nom: {user?.name}</Text>
            <Text style={styles.body}>Email: {user?.email}</Text>
            <Text style={styles.body}>Telephone: {user?.phone ?? 'Non renseigne'}</Text>
          </View>

          <View style={styles.quickOptionGrid}>
            <Pressable style={styles.quickOptionCard} onPress={() => Alert.alert('Adresses', 'Gestion des adresses (fake)')}>
              <View style={styles.quickOptionHead}>
                <View style={styles.quickOptionIconWrap}>
                  <MaterialCommunityIcons name="map-marker-outline" size={18} color={TOKENS.secondary} />
                </View>
                <Text style={styles.quickOptionTitle}>Mes adresses</Text>
              </View>
              <Text style={styles.caption}>2 adresses enregistrees</Text>
            </Pressable>
            <Pressable style={styles.quickOptionCard} onPress={() => Alert.alert('Paiement', 'Cartes et wallet (fake)')}>
              <View style={styles.quickOptionHead}>
                <View style={styles.quickOptionIconWrap}>
                  <MaterialCommunityIcons name="credit-card-outline" size={18} color={TOKENS.secondary} />
                </View>
                <Text style={styles.quickOptionTitle}>Paiement</Text>
              </View>
              <Text style={styles.caption}>CB + Wallet</Text>
            </Pressable>
            <Pressable style={styles.quickOptionCard} onPress={() => Alert.alert('Notifications', 'Parametres notifications (fake)')}>
              <View style={styles.quickOptionHead}>
                <View style={styles.quickOptionIconWrap}>
                  <MaterialCommunityIcons name="bell-outline" size={18} color={TOKENS.secondary} />
                </View>
                <Text style={styles.quickOptionTitle}>Notifications</Text>
              </View>
              <Text style={styles.caption}>Push, email, son</Text>
            </Pressable>
            <Pressable style={styles.quickOptionCard} onPress={() => Alert.alert('Securite', 'Mot de passe et biometrie (fake)')}>
              <View style={styles.quickOptionHead}>
                <View style={styles.quickOptionIconWrap}>
                  <MaterialCommunityIcons name="shield-check-outline" size={18} color={TOKENS.secondary} />
                </View>
                <Text style={styles.quickOptionTitle}>Securite</Text>
              </View>
              <Text style={styles.caption}>Biometrie activee</Text>
            </Pressable>
          </View>

          <View style={styles.detailPanel}>
            <Text style={styles.h2}>Parametres de notification</Text>

            <Pressable style={styles.switchRow} onPress={() => setNotifPushEnabled((v) => !v)}>
              <View style={styles.switchLabelWrap}>
                <MaterialCommunityIcons name="cellphone-message" size={18} color={TOKENS.secondary} />
                <Text style={styles.body}>Push</Text>
              </View>
              <View style={[styles.switchTrack, notifPushEnabled && styles.switchTrackOn]}>
                <View style={[styles.switchThumb, notifPushEnabled && styles.switchThumbOn]} />
              </View>
            </Pressable>

            <Pressable style={styles.switchRow} onPress={() => setNotifEmailEnabled((v) => !v)}>
              <View style={styles.switchLabelWrap}>
                <MaterialCommunityIcons name="email-outline" size={18} color={TOKENS.secondary} />
                <Text style={styles.body}>Email</Text>
              </View>
              <View style={[styles.switchTrack, notifEmailEnabled && styles.switchTrackOn]}>
                <View style={[styles.switchThumb, notifEmailEnabled && styles.switchThumbOn]} />
              </View>
            </Pressable>

            <Pressable style={styles.switchRow} onPress={() => setNotifSmsEnabled((v) => !v)}>
              <View style={styles.switchLabelWrap}>
                <MaterialCommunityIcons name="message-text-outline" size={18} color={TOKENS.secondary} />
                <Text style={styles.body}>SMS</Text>
              </View>
              <View style={[styles.switchTrack, notifSmsEnabled && styles.switchTrackOn]}>
                <View style={[styles.switchThumb, notifSmsEnabled && styles.switchThumbOn]} />
              </View>
            </Pressable>
          </View>

          <View style={styles.loyaltyCard}>
            <View style={styles.loyaltyTopRow}>
              <View>
                <Text style={styles.h2}>Fidelite</Text>
                <Text style={styles.caption}>Niveau Gold</Text>
              </View>
              <View style={styles.loyaltyBadge}>
                <MaterialCommunityIcons name="star-circle" size={18} color="#0B4EA2" />
                <Text style={styles.loyaltyBadgeText}>1,250 pts</Text>
              </View>
            </View>
            <View style={styles.loyaltyProgressBg}>
              <View style={styles.loyaltyProgressFill} />
            </View>
            <Text style={styles.caption}>750 pts restants pour niveau Platinum</Text>
            <View style={styles.rowWrap}>
              <StatusBadge label="Livraison offerte" type="success" />
              <StatusBadge label="Promo -10%" type="warning" />
              <StatusBadge label="Acces prioritaire" type="success" />
            </View>
          </View>

          <AppButton title="Modifier infos" onPress={() => Alert.alert('Info', 'Edition profil fake')} variant="secondary" />
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Assistance</Text>
          <View style={styles.rowWrap}>
            <AppButton
              title="Par AI"
              onPress={() => {
                setChatOpen(true);
                pushNotif('Assistance AI ouverte');
              }}
              full={false}
            />
            <AppButton
              title="Par email"
              onPress={() => Alert.alert('Support', 'support@medimirville.app (fake)')}
              variant="secondary"
              full={false}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Historique commandes</Text>
          {orders.slice(0, 3).map((o) => (
            <View key={o.id} style={styles.orderCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>{o.id}</Text>
                <Text style={styles.caption}>ETA {o.eta} - Distance {o.distance}</Text>
              </View>
              <StatusBadge label={o.status} type={badgeType(o.status)} />
              <AppButton title="Suivre" onPress={() => setPatientTab('orders')} variant="secondary" full={false} />
            </View>
          ))}
        </View>
      </>
    );
  };

  const pharmacienScreen = () => {
    if (pharmacienTab === 'dashboard') {
      return (
        <View style={styles.card}>
          <Text style={styles.h2}>Dashboard</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}><Text style={styles.statValue}>{orders.length}</Text><Text style={styles.caption}>Commandes recues</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{orders.filter((o) => o.status === 'Validee').length}</Text><Text style={styles.caption}>Validees</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{unreadNotificationsCount}</Text><Text style={styles.caption}>Notifications non lues</Text></View>
          </View>
          <View style={styles.detailPanel}>
            <Text style={styles.caption}>Notifications sonores et visuelles</Text>
            <View style={styles.rowWrap}>
              <StatusBadge label={soundNotifEnabled ? 'Son BIP active' : 'Son desactive'} type={soundNotifEnabled ? 'success' : 'warning'} />
              <AppButton
                title={soundNotifEnabled ? 'Couper son' : 'Activer son'}
                onPress={() => setSoundNotifEnabled((v) => !v)}
                variant="secondary"
                full={false}
              />
            </View>
          </View>
        </View>
      );
    }

    if (pharmacienTab === 'commandes') {
      return (
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={18} color={TOKENS.secondary} />
              <Text style={styles.h2}>Commandes</Text>
            </View>
            <StatusBadge label={`${orders.length} total`} type="success" />
          </View>

          {orders.map((o) => (
            <View key={o.id} style={styles.pharmOrderCard}>
              <View style={styles.pharmOrderTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>{o.id} - {o.patientName}</Text>
                  <View style={styles.pharmMetaRow}>
                    <MaterialCommunityIcons name="file-document-outline" size={14} color="#627283" />
                    <Text style={styles.caption}>Ordonnance: {o.ordonnance}</Text>
                  </View>
                  <View style={styles.pharmMetaRow}>
                    <MaterialCommunityIcons name="shield-check-outline" size={14} color="#627283" />
                    <Text style={styles.caption}>Verification documentaire requise</Text>
                  </View>
                </View>
                <StatusBadge label={o.status} type={badgeType(o.status)} />
              </View>

              <View style={styles.pharmActionsRow}>
                <AppButton
                  title="Valider"
                  onPress={() => {
                    changeOrder(o.id, 'Validee');
                    assignNearestCourier(o.id);
                  }}
                  full={false}
                />
                <AppButton title="Refuser" onPress={() => changeOrder(o.id, 'Annulee')} variant="danger" full={false} />
                <AppButton title="Detail" onPress={() => setSelectedOrderId(o.id)} variant="secondary" full={false} />
              </View>
            </View>
          ))}

          {selectedOrder && (
            <View style={styles.detailPanel}>
              <Text style={styles.h2}>Detail commande {selectedOrder.id}</Text>
              <Text style={styles.body}>Patient: {selectedOrder.patientName}</Text>
              <Text style={styles.body}>Ordonnance: {selectedOrder.ordonnance}</Text>
              <Text style={styles.body}>Livreur assigne: {selectedOrder.courierName ?? 'Aucun'}</Text>
              {(() => {
                const info = PATIENT_PRIVATE_INFOS.find((p) => p.patientName === selectedOrder.patientName);
                if (!info) {
                  return <Text style={styles.caption}>Infos patient privees indisponibles</Text>;
                }
                return (
                  <View style={styles.detailPanel}>
                    <Text style={styles.caption}>Acces rapide infos patient</Text>
                    <Text style={styles.body}>NSS: {info.socialNumber}</Text>
                    <Text style={styles.body}>Mutuelle: {info.mutuelle}</Text>
                  </View>
                );
              })()}
              <AppButton
                title="Generer code securise"
                onPress={() => {
                  const code = generateSecureDeliveryCode(selectedOrder.id);
                  setGeneratedCode(code);
                  pushAudit(`Code securise genere (algorithme) pour ${selectedOrder.id}`);
                }}
              />
              {!!generatedCode && <Text style={styles.generatedCode}>Code: {generatedCode}</Text>}
              <AppButton
                title="Assigner livreur"
                onPress={() => changeOrder(selectedOrder.id, 'En livraison')}
              />
              <View style={styles.rowWrap}>
                <StatusBadge
                  label={selectedOrder.pickupConfirmed ? 'Recuperation confirmee' : 'Recuperation en attente'}
                  type={selectedOrder.pickupConfirmed ? 'success' : 'warning'}
                />
                <StatusBadge
                  label={selectedOrder.deliveredConfirmed ? 'Livraison confirmee' : 'Livraison en cours'}
                  type={selectedOrder.deliveredConfirmed ? 'success' : 'warning'}
                />
              </View>
            </View>
          )}

          <View style={styles.trackingCard}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={18} color={TOKENS.secondary} />
              <Text style={styles.h2}>Tracking livraison</Text>
            </View>
            <FakeMap eta={selectedOrder?.eta ?? '20 min'} status={selectedOrder?.status ?? 'En attente'} />
          </View>
        </View>
      );
    }

    if (pharmacienTab === 'stock') {
      const stockRows = products
        .map((p) => ({
          product: p,
          qty: stockLevels[p.id] ?? 0,
        }))
        .filter((row) => row.product.name.toLowerCase().includes(stockSearch.toLowerCase()))
        .filter((row) => (stockLowOnly ? row.qty <= 10 : true));

      const totalUnits = Object.values(stockLevels).reduce((sum, qty) => sum + qty, 0);
      const lowCount = Object.values(stockLevels).filter((qty) => qty > 0 && qty <= 10).length;
      const ruptureCount = Object.values(stockLevels).filter((qty) => qty === 0).length;

      return (
        <>
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="warehouse" size={18} color={TOKENS.secondary} />
              <Text style={styles.h2}>Gestion de stock</Text>
            </View>
            <StatusBadge label={`${stockRows.length} produits`} type="success" />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}><Text style={styles.statValue}>{totalUnits}</Text><Text style={styles.caption}>Unites totales</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{lowCount}</Text><Text style={styles.caption}>Stock faible</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{ruptureCount}</Text><Text style={styles.caption}>Ruptures</Text></View>
          </View>

          <View style={styles.rowWrap}>
            <AppButton title="Ajouter produit" onPress={() => setStockCreateOpen(true)} full={false} />
            <StatusBadge label="Ajout manuel actif" type="warning" />
          </View>

          <SearchBar value={stockSearch} onChangeText={setStockSearch} placeholder="Rechercher un produit" />
          <View style={styles.rowWrap}>
            <AppButton
              title={stockLowOnly ? 'Stock faible: ON' : 'Stock faible: OFF'}
              onPress={() => setStockLowOnly((v) => !v)}
              variant={stockLowOnly ? 'primary' : 'secondary'}
              full={false}
            />
            <AppButton
              title="Reappro auto (+5)"
              onPress={() => {
                stockRows.forEach((row) => {
                  if (row.qty <= 5) {
                    adjustStock(row.product.id, 5);
                  }
                });
                pushNotif('Reapprovisionnement automatique effectue');
              }}
              full={false}
            />
          </View>

          {stockRows.map((row) => (
            <View key={row.product.id} style={styles.stockRowCard}>
              <Image source={{ uri: row.product.image }} style={styles.stockRowImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>{row.product.name}</Text>
                <Text style={styles.caption}>{row.product.brand}</Text>
                <View style={styles.rowWrap}>
                  <StatusBadge
                    label={row.qty > 0 ? 'Disponible' : 'Rupture'}
                    type={row.qty > 0 ? 'success' : 'error'}
                  />
                  {row.qty > 0 && row.qty <= 10 && <StatusBadge label="Stock faible" type="warning" />}
                </View>
              </View>

              <View style={styles.stockQtyWrap}>
                <Text style={styles.caption}>Quantite</Text>
                <Text style={styles.stockQtyText}>{row.qty}</Text>
                <View style={styles.stockActionsRow}>
                  <Pressable style={styles.stockActionBtn} onPress={() => adjustStock(row.product.id, -1)}>
                    <Text style={styles.stockActionText}>-</Text>
                  </Pressable>
                  <Pressable style={styles.stockActionBtn} onPress={() => adjustStock(row.product.id, 1)}>
                    <Text style={styles.stockActionText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
        <Modal visible={stockCreateOpen} transparent animationType="fade" onRequestClose={() => setStockCreateOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.stockCreatePanel}>
              <Text style={styles.h2}>Ajouter un produit</Text>
              <InputField label="Nom" value={stockCreateData.name} onChangeText={(v) => setStockCreateData((p) => ({ ...p, name: v }))} placeholder="Ex: Spray nasal" />
              <InputField label="Marque" value={stockCreateData.brand} onChangeText={(v) => setStockCreateData((p) => ({ ...p, brand: v }))} placeholder="Ex: HealthLab" />
              <View style={styles.rowWrap}>
                <View style={styles.stockCreateFieldHalf}>
                  <InputField label="Prix" value={stockCreateData.price} onChangeText={(v) => setStockCreateData((p) => ({ ...p, price: v }))} placeholder="0.00" />
                </View>
                <View style={styles.stockCreateFieldHalf}>
                  <InputField label="Quantite" value={stockCreateData.qty} onChangeText={(v) => setStockCreateData((p) => ({ ...p, qty: v }))} placeholder="0" />
                </View>
              </View>
              <InputField label="Image URL" value={stockCreateData.image} onChangeText={(v) => setStockCreateData((p) => ({ ...p, image: v }))} placeholder="https://..." />
              <View style={styles.rowWrap}>
                <AppButton
                  title={stockCreateData.category === 'medicament' ? 'Categorie: Medicament' : 'Categorie: Parapharmacie'}
                  onPress={() =>
                    setStockCreateData((p) => ({ ...p, category: p.category === 'medicament' ? 'parapharmacie' : 'medicament' }))
                  }
                  variant="secondary"
                  full={false}
                />
              </View>
              <View style={styles.rowWrap}>
                <AppButton title="Creer" onPress={createStockProduct} full={false} />
                <AppButton title="Annuler" onPress={() => setStockCreateOpen(false)} variant="secondary" full={false} />
              </View>
            </View>
          </View>
        </Modal>
        </>
      );
    }

    return (
      <>
        <View style={styles.card}>
          <View style={styles.pharmacyProfileHero}>
            <View style={styles.pharmacyAvatar}>
              <MaterialCommunityIcons name="pharmacy" size={22} color={TOKENS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h2}>Profil pharmacie</Text>
              <Text style={styles.caption}>Pharmacie Centrale</Text>
            </View>
            <StatusBadge label="Compte verifie" type="success" />
          </View>

          <View style={styles.pharmacyInfoGrid}>
            <View style={styles.pharmacyInfoCard}>
              <Text style={styles.caption}>Nom</Text>
              <Text style={styles.body}>Pharmacie Centrale</Text>
            </View>
            <View style={styles.pharmacyInfoCard}>
              <Text style={styles.caption}>RPPS</Text>
              <Text style={styles.body}>12345678901</Text>
            </View>
            <View style={styles.pharmacyInfoCard}>
              <Text style={styles.caption}>Adresse</Text>
              <Text style={styles.body}>12 Avenue Sante</Text>
            </View>
            <View style={styles.pharmacyInfoCard}>
              <Text style={styles.caption}>Contact</Text>
              <Text style={styles.body}>+212 5 22 11 22 33</Text>
            </View>
          </View>

          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={TOKENS.secondary} />
            <Text style={styles.h2}>Horaires</Text>
          </View>
          <View style={styles.detailPanel}>
            <View style={styles.checkRow}><Text style={styles.body}>Lun - Ven</Text><Text style={styles.checkOk}>08:30 - 20:00</Text></View>
            <View style={styles.checkRow}><Text style={styles.body}>Samedi</Text><Text style={styles.checkOk}>09:00 - 18:00</Text></View>
            <View style={styles.checkRow}><Text style={styles.body}>Dimanche</Text><Text style={styles.caption}>Garde / Ferme</Text></View>
          </View>

          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="toolbox-outline" size={18} color={TOKENS.secondary} />
            <Text style={styles.h2}>Services</Text>
          </View>
          <View style={styles.rowWrap}>
            <StatusBadge label="Ordonnances" type="success" />
            <StatusBadge label="Parapharmacie" type="warning" />
            <StatusBadge label="Livraison express" type="success" />
            <StatusBadge label="Conseil pharma" type="warning" />
          </View>

          <View style={styles.rowWrap}>
            <AppButton title="Modifier profil" onPress={() => Alert.alert('Profil', 'Edition profil pharmacie (fake)')} variant="secondary" full={false} />
            <AppButton title="Mettre a jour horaires" onPress={() => Alert.alert('Horaires', 'Mise a jour des horaires (fake)')} full={false} />
          </View>
        </View>

        <View style={styles.pharmacyComplianceCard}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color={TOKENS.secondary} />
            <Text style={styles.h2}>Securite et conformite</Text>
          </View>
          <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>RGPD: consentement explicite et traitement conforme</Text></View>
          <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>Chiffrement donnees sensibles (mode demo)</Text></View>
          <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>Authentification avec acces differencie par profil</Text></View>
          <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>Validation pharmacien obligatoire avant livraison</Text></View>
          <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>Code boitier a usage unique genere par algorithme</Text></View>
          <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>Acces admin journalise et strictement controle</Text></View>
        </View>
      </>
    );
  };

  const livreurScreen = () => {
    const currentCourierAccount = ADMIN_USERS.find((u) => u.role === 'livreur' && u.name === 'Ahmed');
    const isDriverAccountActive = currentCourierAccount?.status === 'Actif';
    const driverValidationSteps = [
      { label: 'Verification identite', done: true },
      { label: 'Entretien recrutement', done: true },
      { label: 'Formation pharma securite', done: true },
      { label: 'Documents', done: true },
      { label: 'Statut legal', done: true },
      { label: 'Validation admin finale', done: isDriverAccountActive },
    ];
    const driverCompletedSteps = driverValidationSteps.filter((s) => s.done).length;
    const driverProgress = Math.round((driverCompletedSteps / driverValidationSteps.length) * 100);
    const deliveryAvailableOrders = orders.filter(
      (o) => o.status === 'Validee' || (o.status === 'En attente' && !!o.courierName)
    );

    if (livreurTab === 'dashboard') {
      return (
        <View style={styles.card}>
          <Text style={styles.h2}>Dashboard livreur</Text>
          <Text style={styles.body}>Livreur: Ahmed</Text>
          <StatusBadge
            label={
              isDriverAccountActive
                ? 'Compte actif'
                : driverCompletedSteps === driverValidationSteps.length - 1
                ? 'Dossier complet - validation admin en attente'
                : 'Compte suspendu jusqu\'a validation'
            }
            type={isDriverAccountActive ? 'success' : 'warning'}
          />
          <Text style={styles.body}>Commandes disponibles: {isDriverAccountActive ? deliveryAvailableOrders.length : 0}</Text>

          <View style={styles.driverProgressWrap}>
            <View style={styles.driverProgressBarBg}>
              <View style={[styles.driverProgressBarFill, { width: `${driverProgress}%` }]} />
            </View>
            <Text style={styles.caption}>Progression validation: {driverCompletedSteps}/{driverValidationSteps.length} ({driverProgress}%)</Text>
          </View>

          <View style={styles.detailPanel}>
            <Text style={styles.caption}>Validation obligatoire</Text>
            {driverValidationSteps.map((step) => (
              <View key={`dash-${step.label}`} style={styles.checkRow}>
                <Text style={styles.body}>{step.label}</Text>
                <Text style={step.done ? styles.checkOk : styles.caption}>{step.done ? 'OK' : 'En attente'}</Text>
              </View>
            ))}
            {!isDriverAccountActive && (
              <View style={styles.rowWrap}>
                <AppButton title="Voir profil" onPress={() => setLivreurTab('profile')} variant="secondary" full={false} />
                <AppButton title="Demander activation" onPress={() => Alert.alert('Activation', 'Dossier transmis a l\'administration (mode demo).')} full={false} />
              </View>
            )}
          </View>
        </View>
      );
    }

    if (livreurTab === 'livraisons') {
      const deliveryRows = orders
        .filter((o) => o.status !== 'Annulee')
        .sort((a, b) => {
          const rank = (status: OrderStatus) =>
            status === 'En livraison' ? 0 : status === 'Validee' ? 1 : status === 'En attente' ? 2 : 3;
          return rank(a.status) - rank(b.status);
        });

      return (
        <View style={styles.card}>
          <Text style={styles.h2}>Liste commandes</Text>
          {!isDriverAccountActive && (
            <View style={styles.detailPanel}>
              <StatusBadge label="Actions bloquees: compte suspendu" type="warning" />
              <Text style={styles.caption}>Finalisez la validation du compte pour accepter et livrer des commandes.</Text>
              <View style={styles.rowWrap}>
                <AppButton title="Voir profil" onPress={() => setLivreurTab('profile')} variant="secondary" full={false} />
                <AppButton title="Demander activation" onPress={() => Alert.alert('Activation', 'Demande envoyee a l\'administration (mode demo).')} full={false} />
              </View>
            </View>
          )}

          {deliveryRows.length === 0 && (
            <View style={styles.detailPanel}>
              <Text style={styles.caption}>Aucune commande disponible actuellement.</Text>
            </View>
          )}

          {deliveryRows.map((o) => {
              const canPickup = isDriverAccountActive && (o.status === 'Validee' || (o.status === 'En attente' && !!o.courierName));
              const canDrop = isDriverAccountActive && o.status === 'En livraison';

              return (
            <View key={o.id} style={styles.orderCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>{o.id}</Text>
                <Text style={styles.caption}>Distance {o.distance}</Text>
                <Text style={styles.caption}>Prix livraison {money(o.deliveryPrice)}</Text>
                <Text style={styles.caption}>ETA {o.eta}</Text>
                <Text style={styles.caption}>Photos produits disponibles dans detail</Text>
                <View style={styles.rowWrap}>
                  <StatusBadge label={o.status} type={badgeType(o.status)} />
                  {!isDriverAccountActive && <StatusBadge label="Activation requise" type="warning" />}
                </View>
              </View>

              <View style={styles.pharmActionsRow}>
                <AppButton title="Detail" onPress={() => setSelectedOrderId(o.id)} variant="secondary" full={false} />
                <AppButton
                  title="Confirmer recuperation"
                  onPress={() => {
                    changeOrder(o.id, 'En livraison');
                    pushNotif(`Recuperation confirmee: ${o.id}`);
                  }}
                  disabled={!canPickup}
                  full={false}
                />
                <AppButton
                  title="Confirmer depot"
                  onPress={() => {
                    changeOrder(o.id, 'Livree');
                    pushNotif(`Depot confirme: ${o.id}`);
                  }}
                  disabled={!canDrop}
                  full={false}
                />
              </View>
            </View>
              );
            })}

          {selectedOrder && (
            <View style={styles.detailPanel}>
              <Text style={styles.h2}>Detail livraison {selectedOrder.id}</Text>
              <Text style={styles.body}>Pharmacie: Pharmacie Centrale, 12 Avenue Sante</Text>
              <Text style={styles.body}>Client: {selectedOrder.patientName}</Text>
              <Text style={styles.body}>Suivi temps reel partage avec pharmacien et patient</Text>
              <Text style={styles.body}>Produits a livrer</Text>
              <View style={styles.miniProductsRow}>
                {products.slice(0, 3).map((product) => (
                  <Image key={product.id} source={{ uri: product.image }} style={styles.miniProductThumb} />
                ))}
              </View>
            </View>
          )}
        </View>
      );
    }

    if (livreurTab === 'navigation') {
      const navOrder =
        selectedOrder ??
        orders.find((o) => o.status === 'En livraison') ??
        orders.find((o) => o.status === 'Validee') ??
        orders[0];

      const navCanPickup = isDriverAccountActive && !!navOrder && (navOrder.status === 'Validee' || (navOrder.status === 'En attente' && !!navOrder.courierName));
      const navCanDrop = isDriverAccountActive && !!navOrder && navOrder.status === 'En livraison';

      return (
        <>
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="navigation-variant-outline" size={18} color={TOKENS.secondary} />
                <Text style={styles.h2}>Navigation mission</Text>
              </View>
              {!!navOrder && <StatusBadge label={navOrder.status} type={badgeType(navOrder.status)} />}
            </View>

            {!navOrder && <Text style={styles.caption}>Aucune commande active pour la navigation.</Text>}

            {!!navOrder && (
              <>
                <View style={styles.driverNavMetaCard}>
                  <Text style={styles.orderTitle}>{navOrder.id} - {navOrder.patientName}</Text>
                  <Text style={styles.caption}>Pharmacie: Pharmacie Centrale, 12 Avenue Sante</Text>
                  <Text style={styles.caption}>Client: Adresse patient securisee (mode demo)</Text>
                  <View style={styles.rowWrap}>
                    <StatusBadge label={`ETA ${navOrder.eta}`} type="warning" />
                    <StatusBadge label={navOrder.distance} type="success" />
                    <StatusBadge label={money(navOrder.deliveryPrice)} type="success" />
                  </View>
                </View>

                <FakeMap eta={navOrder.eta} status={navOrder.status} />

                <View style={styles.driverNavStepsCard}>
                  <Text style={styles.caption}>Etapes de mission</Text>
                  <View style={styles.checkRow}>
                    <Text style={styles.body}>1. Aller a la pharmacie</Text>
                    <StatusBadge label={navOrder.pickupConfirmed ? 'Termine' : 'En cours'} type={navOrder.pickupConfirmed ? 'success' : 'warning'} />
                  </View>
                  <View style={styles.checkRow}>
                    <Text style={styles.body}>2. Recuperer le colis</Text>
                    <StatusBadge label={navOrder.pickupConfirmed ? 'Confirme' : 'A faire'} type={navOrder.pickupConfirmed ? 'success' : 'warning'} />
                  </View>
                  <View style={styles.checkRow}>
                    <Text style={styles.body}>3. Livrer le patient</Text>
                    <StatusBadge label={navOrder.deliveredConfirmed ? 'Confirme' : 'En attente'} type={navOrder.deliveredConfirmed ? 'success' : 'warning'} />
                  </View>
                </View>

                <View style={styles.rowWrap}>
                  <AppButton
                    title="Arrive pharmacie"
                    onPress={() => {
                      changeOrder(navOrder.id, 'En livraison');
                      setSelectedOrderId(navOrder.id);
                      pushNotif(`Arrivee pharmacie: ${navOrder.id}`);
                    }}
                    disabled={!navCanPickup}
                    full={false}
                  />
                  <AppButton
                    title="Confirmer livraison"
                    onPress={() => {
                      changeOrder(navOrder.id, 'Livree');
                      setSelectedOrderId(navOrder.id);
                      pushNotif(`Livraison confirmee: ${navOrder.id}`);
                    }}
                    disabled={!navCanDrop}
                    full={false}
                  />
                </View>
              </>
            )}
          </View>
        </>
      );
    }

    return (
      <>
        <View style={styles.card}>
          <View style={styles.driverProfileHero}>
            <View style={styles.driverAvatarLg}>
              <MaterialCommunityIcons name="motorbike" size={24} color={TOKENS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h2}>Profil livreur</Text>
              <Text style={styles.caption}>Ahmed - ⭐ 4.9 - 247 livraisons</Text>
            </View>
            <StatusBadge label={isDriverAccountActive ? 'Actif' : 'En attente validation'} type={isDriverAccountActive ? 'success' : 'warning'} />
          </View>

          <View style={styles.driverInfoGrid}>
            <View style={styles.driverInfoCard}>
              <Text style={styles.caption}>Nom</Text>
              <Text style={styles.body}>Ahmed</Text>
            </View>
            <View style={styles.driverInfoCard}>
              <Text style={styles.caption}>Telephone</Text>
              <Text style={styles.body}>+212 6 45 21 33 90</Text>
            </View>
            <View style={styles.driverInfoCard}>
              <Text style={styles.caption}>Vehicule</Text>
              <Text style={styles.body}>Scooter 125cc</Text>
            </View>
            <View style={styles.driverInfoCard}>
              <Text style={styles.caption}>Zone</Text>
              <Text style={styles.body}>Casablanca Centre</Text>
            </View>
          </View>

          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="file-document-check-outline" size={18} color={TOKENS.secondary} />
            <Text style={styles.h2}>Verification compte</Text>
          </View>
          <View style={styles.detailPanel}>
            {driverValidationSteps.map((step) => (
              <View key={`profile-${step.label}`} style={styles.checkRow}>
                <Text style={styles.body}>{step.label}</Text>
                <Text style={step.done ? styles.checkOk : styles.caption}>{step.done ? 'OK' : 'En attente'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="cash-multiple" size={18} color={TOKENS.secondary} />
            <Text style={styles.h2}>Gains</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}><Text style={styles.statValue}>47.50</Text><Text style={styles.caption}>Aujourd'hui (EUR)</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>312.00</Text><Text style={styles.caption}>Cette semaine (EUR)</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>91%</Text><Text style={styles.caption}>Taux de livraison</Text></View>
          </View>

          <View style={styles.rowWrap}>
            <AppButton title="Mettre a jour documents" onPress={() => Alert.alert('Documents', 'Upload documents (fake)')} variant="secondary" full={false} />
            <AppButton title="Contacter support" onPress={() => Alert.alert('Support', 'support@medimirville.app (fake)')} full={false} />
          </View>
        </View>
      </>
    );
  };

  const adminScreen = () => {
    if (adminTab === 'dashboard') {
      const openIncidents = incidents.filter((i) => i.status === 'Ouvert').length;
      const pendingOrders = orders.filter((o) => o.status === 'En attente' || o.status === 'Validee').length;

      return (
        <>
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="view-dashboard-outline" size={18} color={TOKENS.secondary} />
              <Text style={styles.h2}>Dashboard admin</Text>
            </View>
            <StatusBadge label={`Alertes ${openIncidents}`} type={openIncidents > 0 ? 'warning' : 'success'} />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}><Text style={styles.statValue}>2432</Text><Text style={styles.caption}>Utilisateurs</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{orders.length}</Text><Text style={styles.caption}>Commandes</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{orders.filter((o) => o.status === 'Livree').length}</Text><Text style={styles.caption}>Livraisons</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{pendingOrders}</Text><Text style={styles.caption}>En attente/validation</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{openIncidents}</Text><Text style={styles.caption}>Incidents ouverts</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{unreadNotificationsCount}</Text><Text style={styles.caption}>Notifications non lues</Text></View>
          </View>

          <View style={styles.adminOpsCard}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={18} color={TOKENS.secondary} />
              <Text style={styles.h2}>Operations du jour</Text>
            </View>
            <View style={styles.checkRow}><Text style={styles.body}>Commandes en verification</Text><Text style={styles.checkOk}>{pendingOrders}</Text></View>
            <View style={styles.checkRow}><Text style={styles.body}>Livreurs en mission</Text><Text style={styles.checkOk}>{COURIERS.filter((c) => c.status === 'En mission').length}</Text></View>
            <View style={styles.checkRow}><Text style={styles.body}>Incidents critiques</Text><Text style={openIncidents > 0 ? styles.caption : styles.checkOk}>{openIncidents > 0 ? `${openIncidents} a traiter` : 'Aucun'}</Text></View>
            <View style={styles.rowWrap}>
              <AppButton title="Voir incidents" onPress={() => setAdminTab('reports')} variant="secondary" full={false} />
              <AppButton title="Ouvrir notifications" onPress={() => setNotificationsOpen(true)} full={false} />
            </View>
          </View>

          <View style={styles.pharmacyComplianceCard}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={TOKENS.secondary} />
              <Text style={styles.h2}>Conformite et securite</Text>
            </View>
            <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>RGPD actif: consentement obligatoire + journalisation</Text></View>
            <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>Chiffrement donnees sensibles: ordonnances, patient, paiement (mode demo)</Text></View>
            <View style={styles.infoRow}><MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} /><Text style={styles.body}>Acces admin prive strictement controle et trace</Text></View>
          </View>
        </View>
        </>
      );
    }

    if (adminTab === 'users') {
      return (
        <View style={styles.card}>
          <Text style={styles.h2}>Gestion utilisateurs</Text>
          <View style={styles.rowWrap}>
            <AppButton title="Creer" onPress={() => pushNotif('Creation utilisateur (fake)')} full={false} />
            <AppButton title="Modifier" onPress={() => pushNotif('Modification utilisateur (fake)')} variant="secondary" full={false} />
          </View>
          <View style={styles.rowWrap}>
            <StatusBadge label="Patients" type="success" />
            <StatusBadge label="Pharmaciens" type="warning" />
            <StatusBadge label="Livreurs" type="error" />
          </View>
          {ADMIN_USERS.map((u) => (
            <View key={u.id} style={styles.orderCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>{u.name}</Text>
                <Text style={styles.caption}>{u.role}</Text>
                <StatusBadge label={u.status} type={u.status === 'Actif' ? 'success' : 'warning'} />
              </View>
              <AppButton title="Suspendre" onPress={() => pushNotif(`Suspendu ${u.name}`)} variant="danger" full={false} />
              <AppButton title="Supprimer" onPress={() => pushNotif(`Supprime ${u.name}`)} variant="secondary" full={false} />
              <AppButton title="Detail" onPress={() => setSelectedAdminUserId(u.id)} full={false} />
            </View>
          ))}

          {selectedAdminUser && (
            <View style={styles.detailPanel}>
              <Text style={styles.h2}>Detail utilisateur</Text>
              <Text style={styles.body}>Nom: {selectedAdminUser.name}</Text>
              <Text style={styles.body}>Role: {selectedAdminUser.role}</Text>
              <Text style={styles.body}>Statut: {selectedAdminUser.status}</Text>
              {(() => {
                const info = PATIENT_PRIVATE_INFOS.find((p) => p.patientName.startsWith(selectedAdminUser.name.split(' ')[0]));
                if (!info) {
                  return null;
                }
                return (
                  <>
                    <Text style={styles.caption}>Acces complet donnees privees (controle legal)</Text>
                    <Text style={styles.body}>Ordonnance: ordonnance-dossier-{selectedAdminUser.id}.jpg</Text>
                    <Text style={styles.body}>NSS: {info.socialNumber}</Text>
                    <Text style={styles.body}>Mutuelle: {info.mutuelle}</Text>
                  </>
                );
              })()}
              <Text style={styles.caption}>Historique</Text>
              {selectedAdminUser.history.map((entry) => (
                <Text key={entry} style={styles.body}>- {entry}</Text>
              ))}
            </View>
          )}
        </View>
      );
    }

    if (adminTab === 'commandes') {
      return (
        <View style={styles.card}>
          <Text style={styles.h2}>Gestion commandes</Text>
          <Text style={styles.caption}>En cours</Text>
          {orders.filter((o) => o.status === 'En attente' || o.status === 'Validee' || o.status === 'En livraison').map((o) => (
            <View key={`${o.id}-ongoing`} style={styles.orderCard}>
              <Text style={styles.orderTitle}>{o.id}</Text>
              <StatusBadge label={o.status} type={badgeType(o.status)} />
            </View>
          ))}

          <Text style={styles.caption}>Livrees</Text>
          {orders.filter((o) => o.status === 'Livree').map((o) => (
            <View key={`${o.id}-done`} style={styles.orderCard}>
              <Text style={styles.orderTitle}>{o.id}</Text>
              <StatusBadge label={o.status} type="success" />
            </View>
          ))}

          <Text style={styles.caption}>Annulees</Text>
          {orders.filter((o) => o.status === 'Annulee').map((o) => (
            <View key={`${o.id}-cancel`} style={styles.orderCard}>
              <Text style={styles.orderTitle}>{o.id}</Text>
              <StatusBadge label={o.status} type="error" />
            </View>
          ))}

          <View style={styles.detailPanel}>
            <Text style={styles.caption}>Suivi livreurs en temps reel</Text>
            {COURIERS.map((courier) => (
              <View key={courier.name} style={styles.checkRow}>
                <Text style={styles.body}>{courier.name}</Text>
                <StatusBadge
                  label={`${courier.status} - ${courier.distanceKm.toFixed(1)} km`}
                  type={courier.status === 'Disponible' ? 'success' : courier.status === 'En mission' ? 'warning' : 'error'}
                />
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.h2}>Reports</Text>
        <View style={styles.chartWrap}>
          <View style={[styles.chartBar, { height: 64 }]} />
          <View style={[styles.chartBar, { height: 92 }]} />
          <View style={[styles.chartBar, { height: 78 }]} />
          <View style={[styles.chartBar, { height: 108 }]} />
        </View>
        <View style={styles.detailPanel}>
          <Text style={styles.caption}>Audit RGPD et tracabilite</Text>
          {auditLogs.map((log) => (
            <Text key={log} style={styles.body}>- {log}</Text>
          ))}
        </View>
        <View style={styles.detailPanel}>
          <Text style={styles.caption}>Incidents / Litiges</Text>
          {incidents.map((incident) => (
            <View key={incident.id} style={styles.orderCard}>
              <Text style={styles.orderTitle}>{incident.id} - {incident.title}</Text>
              <StatusBadge label={incident.status} type={incident.status === 'Resolue' ? 'success' : 'warning'} />
              {incident.status === 'Ouvert' && (
                <AppButton
                  title="Resoudre"
                  full={false}
                  onPress={() => {
                    setIncidents((prev) =>
                      prev.map((it) => (it.id === incident.id ? { ...it, status: 'Resolue' } : it))
                    );
                    pushAudit(`Incident ${incident.id} resolu par admin`);
                  }}
                />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (user?.role === 'patient') {
      return patientScreen();
    }
    if (user?.role === 'pharmacien') {
      return pharmacienScreen();
    }
    if (user?.role === 'livreur') {
      return livreurScreen();
    }
    return adminScreen();
  };

  const securityRules = [
    'RGPD: consentement explicite et traitement conforme',
    'Chiffrement donnees sensibles (mode demo)',
    'Authentification avec acces differencie par profil',
    'Validation pharmacien obligatoire avant livraison',
    'Code boitier a usage unique genere par algorithme',
    'Acces admin journalise et strictement controle',
  ];

  const securityCard = (
    <View style={styles.card}>
      <View style={styles.sectionHeaderLeft}>
        <MaterialCommunityIcons name="shield-check-outline" size={18} color={TOKENS.secondary} />
        <Text style={styles.h2}>Securite et conformite</Text>
      </View>
      {securityRules.map((rule) => (
        <View key={rule} style={styles.infoRow}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={TOKENS.success} />
          <Text style={styles.body}>{rule}</Text>
        </View>
      ))}
    </View>
  );

  const chatPanel = (
    <View style={styles.chatPanel}>
      <Text style={styles.h2}>Fake AI chat</Text>
      <ScrollView style={styles.chatScroll}>
        {chatMessages.map((m, i) => (
          <Text key={`${m}-${i}`} style={styles.chatLine}>{m}</Text>
        ))}
      </ScrollView>
      <View style={styles.chatInputRow}>
        <TextInput
          value={chatInput}
          onChangeText={setChatInput}
          placeholder="Posez une question"
          placeholderTextColor="#9CA3AF"
          style={styles.chatInput}
        />
        <AppButton title="Envoyer" onPress={sendChat} full={false} />
      </View>
    </View>
  );

  const notificationsSpace = (
    <Modal visible={notificationsOpen} transparent animationType="fade" onRequestClose={() => setNotificationsOpen(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.notificationsPanel}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="bell-ring-outline" size={18} color={TOKENS.secondary} />
              <Text style={styles.h2}>Espace notifications</Text>
            </View>
            <AppButton title="Fermer" onPress={() => setNotificationsOpen(false)} variant="secondary" full={false} />
          </View>

          <View style={styles.notificationsToolbar}>
            <View style={styles.notificationsFilterRow}>
              <Pressable style={[styles.notifFilterPill, notifFilter === 'all' && styles.notifFilterPillActive]} onPress={() => setNotifFilter('all')}>
                <Text style={[styles.notifFilterText, notifFilter === 'all' && styles.notifFilterTextActive]}>Toutes</Text>
              </Pressable>
              <Pressable style={[styles.notifFilterPill, notifFilter === 'unread' && styles.notifFilterPillActive]} onPress={() => setNotifFilter('unread')}>
                <Text style={[styles.notifFilterText, notifFilter === 'unread' && styles.notifFilterTextActive]}>Non lues</Text>
              </Pressable>
              <Pressable style={[styles.notifFilterPill, notifFilter === 'read' && styles.notifFilterPillActive]} onPress={() => setNotifFilter('read')}>
                <Text style={[styles.notifFilterText, notifFilter === 'read' && styles.notifFilterTextActive]}>Lues</Text>
              </Pressable>
            </View>
            <View style={styles.notificationsActionsRow}>
              <AppButton title="Tout lu" onPress={markAllNotificationsRead} variant="secondary" full={false} />
              <AppButton title="Vider" onPress={() => setNotifications([])} variant="danger" full={false} />
            </View>
          </View>

          <Text style={styles.caption}>{filteredNotifications.length} notification(s) - {unreadNotificationsCount} non lue(s)</Text>
          <ScrollView style={styles.notificationsScroll}>
            {filteredNotifications.length === 0 && <Text style={styles.body}>Aucune notification pour le moment.</Text>}
            {filteredNotifications.map((n) => (
              <View key={`notif-panel-${n.id}`} style={styles.notificationItem}>
                <MaterialCommunityIcons name="circle-small" size={18} color={TOKENS.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.body}>{n.text}</Text>
                  <Text style={styles.caption}>{new Date(n.createdAt).toLocaleTimeString()}</Text>
                </View>
                {!n.read && <StatusBadge label="Nouveau" type="warning" />}
                {!n.read && <AppButton title="Lu" onPress={() => markNotificationRead(n.id)} variant="secondary" full={false} />}
                <AppButton title="X" onPress={() => removeNotification(n.id)} variant="danger" full={false} />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const showSystemCards = user?.role === 'pharmacien' || user?.role === 'livreur';
  const isPatientDetailView = user?.role === 'patient' && patientTab === 'detail';
  const showMobileCheckoutBar = user?.role === 'patient' && patientTab === 'cart' && cartRows.length > 0;

  if (booting) {
    return (
      <SafeAreaView style={styles.splashScreen}>
        <StatusBar style="light" />
        <View style={styles.splashLogo}><Text style={styles.splashLogoText}>M</Text></View>
        <Text style={styles.splashTitle}>MediMirville</Text>
        <Text style={styles.splashSub}>Livraison medicale securisee</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (isDesktop) {
    return (
      <SafeAreaView style={styles.appDesktop}>
        <StatusBar style="dark" />
        <View style={styles.desktopLayout}>
          {renderSidebar()}
          <View style={styles.desktopMain}>
            {renderDesktopHeader()}
            <ScrollView contentContainerStyle={styles.desktopContent}>
              {renderContent()}
              {showSystemCards && securityCard}
            </ScrollView>
          </View>
        </View>
        <Pressable style={styles.chatFab} onPress={() => setChatOpen((v) => !v)}>
          <Text style={styles.chatFabText}>{chatOpen ? 'X' : 'AI'}</Text>
        </Pressable>
        {chatOpen && chatPanel}
        {notificationsSpace}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appMobile}>
      <StatusBar style="dark" />
      {renderTopBar()}
      <ScrollView contentContainerStyle={[styles.mobileContent, isPatientDetailView && styles.mobileContentDetail]}>
        {renderContent()}
        {showSystemCards && securityCard}
      </ScrollView>
      {showMobileCheckoutBar && (
        <View style={styles.checkoutBarFixed}>
          <View>
            <Text style={styles.checkoutBarLabel}>Total</Text>
            <Text style={styles.checkoutBarValue}>{money(cartTotal * 1.1)}</Text>
          </View>
          <AppButton title="Checkout" onPress={() => void placeOrder()} full={false} />
        </View>
      )}
      {!isPatientDetailView && renderBottomNav()}
      <Pressable style={styles.chatFabMobile} onPress={() => setChatOpen((v) => !v)}>
        <Text style={styles.chatFabText}>{chatOpen ? 'X' : 'AI'}</Text>
      </Pressable>
      {chatOpen && <View style={styles.chatPanelMobile}>{chatPanel}</View>}
      {notificationsSpace}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashScreen: {
    flex: 1,
    backgroundColor: '#10233A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  splashTitle: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
  },
  splashSub: {
    color: '#D1D5DB',
    marginTop: 8,
    fontSize: 16,
  },
  authScreen: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  authContent: {
    padding: 18,
    gap: 18,
    paddingBottom: 36,
  },
  authBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  authBrandTitle: {
    color: TOKENS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  authBrandSub: {
    color: '#6B7280',
    fontSize: 13,
  },
  card: {
    backgroundColor: TOKENS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    padding: 16,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  h1: {
    color: TOKENS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  h2: {
    color: TOKENS.text,
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    color: TOKENS.text,
    fontSize: 16,
  },
  caption: {
    color: '#6A7686',
    fontSize: 13,
  },
  roleSelectorWrap: {
    gap: 8,
  },
  roleChoice: {
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  roleChoiceActive: {
    borderColor: TOKENS.primary,
    backgroundColor: '#ECFDF3',
  },
  roleChoiceText: {
    color: TOKENS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  roleChoiceTextActive: {
    color: '#0F5132',
  },
  inputWrap: {
    gap: 6,
  },
  label: {
    color: TOKENS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    color: TOKENS.text,
    backgroundColor: '#FAFCFF',
    fontSize: 16,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 999,
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: '#F7FAFD',
  },
  searchIcon: {
    color: '#9CA3AF',
    fontWeight: '700',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: TOKENS.text,
    fontSize: 16,
  },
  linkText: {
    color: TOKENS.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  button: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TOKENS.primary,
    paddingHorizontal: 18,
    shadowColor: '#0E766B',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  buttonFull: {
    width: '100%',
  },
  buttonSecondary: {
    backgroundColor: '#F5F9FD',
    borderWidth: 1,
    borderColor: TOKENS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDanger: {
    backgroundColor: TOKENS.error,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: TOKENS.text,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: TOKENS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  uploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: TOKENS.border,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  uploadText: {
    color: TOKENS.text,
    fontWeight: '600',
  },
  uploadHint: {
    color: '#6B7280',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  googleRow: {
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    padding: 12,
    gap: 3,
  },
  googleName: {
    color: TOKENS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  googleMail: {
    color: '#6B7280',
    fontSize: 13,
  },
  appMobile: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  topBar: {
    height: 62,
    backgroundColor: '#F8FBFF',
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#113355',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topLeftCompact: {
    width: 42,
    alignItems: 'flex-start',
  },
  topCenterSearch: {
    flex: 1,
    paddingHorizontal: 8,
  },
  topRightIcons: {
    width: 172,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  topIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F0FB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topIconText: {
    color: TOKENS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  topCountBadge: {
    position: 'absolute',
    right: -5,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TOKENS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  topCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  topLogoutBtn: {
    height: 30,
    borderRadius: 999,
    backgroundColor: TOKENS.secondary,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topLogoutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  topLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topRight: {
    width: 60,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  logoMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TOKENS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMiniText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  topTitle: {
    color: TOKENS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TOKENS.error,
    marginTop: 4,
  },
  topNotif: {
    color: TOKENS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  mobileContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 130,
    backgroundColor: TOKENS.background,
  },
  mobileContentDetail: {
    paddingBottom: 26,
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 22,
    height: 70,
    flexDirection: 'row',
    paddingHorizontal: 10,
    shadowColor: '#1F2A37',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  bottomItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  bottomIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIconActive: {
    backgroundColor: '#E9F9EF',
  },
  bottomIconText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomIconTextActive: {
    color: TOKENS.primary,
  },
  bottomLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  bottomLabelActive: {
    color: TOKENS.primary,
    fontWeight: '700',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  promoBanner: {
    borderRadius: 16,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#D6E5FF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0E3A75',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D3E4FF',
    color: TOKENS.secondary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  promoTitle: {
    color: TOKENS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  promoSub: {
    color: '#617387',
    fontSize: 13,
    marginBottom: 10,
  },
  promoArtWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#D7E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoArtText: {
    color: TOKENS.secondary,
    fontSize: 36,
    fontWeight: '800',
  },
  categoryPillsRow: {
    gap: 8,
    paddingRight: 8,
  },
  categoryPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6DFEA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  categoryPillText: {
    color: '#546274',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: TOKENS.secondary,
  },
  bestsellerRow: {
    gap: 12,
    paddingRight: 6,
  },
  bestsellerCard: {
    width: 220,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 12,
    gap: 6,
  },
  bestsellerImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#16A34A',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  productMeta: {
    color: '#7A8797',
    fontSize: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 12,
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  productImage: {
    width: '100%',
    height: 90,
    borderRadius: 12,
  },
  productName: {
    color: TOKENS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    color: TOKENS.secondary,
    fontWeight: '700',
    fontSize: 16,
  },
  filterRow: {
    gap: 8,
  },
  catalogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE4EC',
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  catalogImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  catalogContent: {
    flex: 1,
    gap: 3,
  },
  catalogActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE4EC',
    borderLeftWidth: 4,
    borderLeftColor: '#0F9D8F',
    padding: 12,
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  orderTitle: {
    color: TOKENS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cartThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  removeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIconText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  orderSummaryWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#F8FBFF',
    padding: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    color: TOKENS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryTotalValue: {
    color: TOKENS.secondary,
    fontSize: 18,
    fontWeight: '800',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconButtonText: {
    color: TOKENS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  qtyText: {
    color: TOKENS.text,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  statusBadge: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusSuccess: {
    backgroundColor: '#EAF8EE',
  },
  statusWarning: {
    backgroundColor: '#FFF6E0',
  },
  statusError: {
    backgroundColor: '#FDEBEC',
  },
  statusText: {
    color: TOKENS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  fakeMap: {
    height: 190,
    borderRadius: 16,
    backgroundColor: '#EAF4FF',
    borderWidth: 1,
    borderColor: TOKENS.border,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 10,
  },
  mapTopOverlay: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapTitle: {
    color: TOKENS.text,
    fontWeight: '600',
    fontSize: 13,
  },
  pinA: {
    position: 'absolute',
    top: 36,
    left: 26,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TOKENS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinB: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TOKENS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDriver: {
    position: 'absolute',
    top: 90,
    left: 140,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: TOKENS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mapBottomOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapEta: {
    color: TOKENS.text,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  stepCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D1D5DB',
  },
  stepCircleActive: {
    backgroundColor: TOKENS.primary,
  },
  stepLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: TOKENS.text,
    fontWeight: '600',
  },
  generatedCode: {
    color: TOKENS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeroImage: {
    width: 310,
    height: 220,
    borderRadius: 14,
    marginRight: 10,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    borderRadius: 6,
    backgroundColor: TOKENS.secondary,
  },
  detailPrice: {
    color: TOKENS.secondary,
    fontSize: 28,
    fontWeight: '800',
  },
  qtyPackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  packDropdown: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  packDropdownText: {
    color: TOKENS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  similarCard: {
    width: 156,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 4,
  },
  similarImage: {
    width: '100%',
    height: 88,
    borderRadius: 10,
    marginBottom: 4,
  },
  detailPanel: {
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    padding: 12,
    gap: 10,
  },
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatarLg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCEBFF',
    borderWidth: 1,
    borderColor: '#BBD7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLgText: {
    color: TOKENS.secondary,
    fontSize: 16,
    fontWeight: '800',
  },
  quickOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickOptionCard: {
    width: '48%',
    minHeight: 82,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#F8FBFF',
    padding: 10,
    gap: 4,
  },
  quickOptionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickOptionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#CFE0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickOptionTitle: {
    color: TOKENS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  switchLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4DCE6',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchTrackOn: {
    backgroundColor: '#9AC2F3',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  loyaltyCard: {
    borderWidth: 1,
    borderColor: '#CFE0FF',
    borderRadius: 14,
    backgroundColor: '#F2F8FF',
    padding: 12,
    gap: 8,
  },
  loyaltyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFD6F8',
    backgroundColor: '#E1EEFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  loyaltyBadgeText: {
    color: '#0B4EA2',
    fontSize: 13,
    fontWeight: '700',
  },
  loyaltyProgressBg: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#DCE8F8',
    overflow: 'hidden',
  },
  loyaltyProgressFill: {
    width: '62%',
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  miniProductsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniProductThumb: {
    width: 62,
    height: 62,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FBFDFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE4EC',
    padding: 12,
    minWidth: 108,
    minHeight: 96,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  statValue: {
    color: TOKENS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 10,
  },
  checkOk: {
    color: TOKENS.success,
    fontWeight: '700',
  },
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    height: 140,
  },
  chartBar: {
    flex: 1,
    backgroundColor: TOKENS.secondary,
    borderRadius: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pharmOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E4EF',
    borderLeftWidth: 4,
    borderLeftColor: '#0F9D8F',
    padding: 12,
    gap: 10,
  },
  pharmOrderTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  pharmMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  pharmActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trackingCard: {
    borderWidth: 1,
    borderColor: '#D4E0EC',
    borderRadius: 14,
    backgroundColor: '#F7FBFF',
    padding: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  driverProfileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverAvatarLg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#BBD7FF',
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  driverInfoCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 4,
  },
  driverProgressWrap: {
    gap: 6,
  },
  driverProgressBarBg: {
    width: '100%',
    height: 9,
    borderRadius: 999,
    backgroundColor: '#DCE8F8',
    overflow: 'hidden',
  },
  driverProgressBarFill: {
    height: '100%',
    backgroundColor: TOKENS.secondary,
  },
  driverNavMetaCard: {
    borderWidth: 1,
    borderColor: '#D9E4EF',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 6,
  },
  driverNavStepsCard: {
    borderWidth: 1,
    borderColor: '#D8E3EF',
    borderRadius: 14,
    backgroundColor: '#F7FBFF',
    padding: 10,
    gap: 8,
  },
  stockRowCard: {
    borderWidth: 1,
    borderColor: '#D8E2ED',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stockRowImage: {
    width: 62,
    height: 62,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  stockQtyWrap: {
    minWidth: 78,
    alignItems: 'center',
    gap: 4,
  },
  stockQtyText: {
    color: TOKENS.secondary,
    fontSize: 22,
    fontWeight: '800',
  },
  stockActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stockActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#F6FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockActionText: {
    color: TOKENS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  stockCreatePanel: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 14,
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  stockCreateFieldHalf: {
    width: '48%',
  },
  pharmacyProfileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pharmacyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#BFD6F8',
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pharmacyInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pharmacyInfoCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 4,
  },
  pharmacyComplianceCard: {
    borderWidth: 1,
    borderColor: '#CFE0FF',
    borderRadius: 14,
    backgroundColor: '#F3F8FF',
    padding: 12,
    gap: 8,
  },
  adminOpsCard: {
    borderWidth: 1,
    borderColor: '#D7E4F2',
    borderRadius: 14,
    backgroundColor: '#F9FCFF',
    padding: 12,
    gap: 8,
  },
  appDesktop: {
    flex: 1,
    backgroundColor: '#EAF1F8',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#F4F8FD',
    borderRightWidth: 1,
    borderRightColor: '#D8E0EA',
    padding: 16,
    gap: 14,
  },
  sidebarLogo: {
    color: TOKENS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sidebarRole: {
    color: '#6B7280',
    fontSize: 13,
  },
  sidebarMenu: {
    gap: 6,
    flex: 1,
  },
  sidebarItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8D3DF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sidebarItemActive: {
    backgroundColor: '#E5FAF0',
    borderColor: '#84CDAE',
  },
  sidebarItemText: {
    color: TOKENS.text,
    fontSize: 16,
  },
  sidebarItemTextActive: {
    color: '#065F46',
    fontWeight: '600',
  },
  desktopMain: {
    flex: 1,
    padding: 14,
  },
  desktopHeader: {
    minHeight: 74,
    borderWidth: 1,
    borderColor: '#D8E1EA',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#132B44',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  desktopBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  desktopBrandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0A9D84',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopBrandIconText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  desktopBrandTitle: {
    color: '#1F2937',
    fontSize: 28,
    fontWeight: '700',
  },
  desktopHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 360,
  },
  headerCartPill: {
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerCartPillText: {
    color: TOKENS.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  notificationBadge: {
    backgroundColor: TOKENS.error,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  profilePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D8EEE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePillText: {
    color: '#0A7E56',
    fontSize: 12,
    fontWeight: '800',
  },
  desktopContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    padding: 22,
    gap: 18,
  },
  chatFab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: TOKENS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  chatFabMobile: {
    position: 'absolute',
    right: 16,
    bottom: 86,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: TOKENS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  chatFabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  chatPanelMobile: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 148,
  },
  checkoutBarFixed: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 84,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1F2A37',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  checkoutBarLabel: {
    color: '#6A7686',
    fontSize: 12,
  },
  checkoutBarValue: {
    color: TOKENS.secondary,
    fontSize: 18,
    fontWeight: '800',
  },
  chatPanel: {
    position: 'absolute',
    right: 18,
    bottom: 78,
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 12,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  notificationsPanel: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 12,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  notificationsScroll: {
    maxHeight: 320,
  },
  notificationsToolbar: {
    gap: 8,
  },
  notificationsFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  notifFilterPill: {
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  notifFilterPillActive: {
    borderColor: '#8AB8F0',
    backgroundColor: '#EAF3FF',
  },
  notifFilterText: {
    color: '#526273',
    fontSize: 12,
    fontWeight: '600',
  },
  notifFilterTextActive: {
    color: TOKENS.secondary,
  },
  notificationsActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: TOKENS.border,
    backgroundColor: '#F8FBFF',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  chatScroll: {
    maxHeight: 180,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
  },
  chatLine: {
    color: TOKENS.text,
    fontSize: 13,
    marginBottom: 5,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: TOKENS.text,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
});
