import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { AuthContext } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { spacing, borderRadius, fontSizes, shadows } from '../../constants/styles';
import musicService from '../../services/musicService';
import InputField from '../../components/InputField';
import PopUp from '../../components/PopUp';
import Message from '../../components/Message';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Note frequencies and names from backend
const NOTES_FREQUENCIES = [
  16,17,18,19,21,22,23,25,26,28,29,31,
  33,35,37,39,41,44,46,49,52,55,58,62,
  65,69,73,78,82,87,92,98,104,110,117,123,
  131,139,147,156,165,175,185,196,208,220,233,247,
  262,277,294,311,330,349,370,392,415,440,466,494,
  523,554,587,622,659,698,740,784,831,880,932,988,
  1047,1109,1175,1245,1319,1397,1480,1568,1661,1760,1865,1976,
  2093,2217,2349,2489,2637,2794,2960,3136,3322,3520,3729,3951,
  4186,4435,4699,4978
];

const NOTE_NAMES = [
  "C0","C#0","D0","D#0","E0","F0","F#0","G0","G#0","A0","A#0","B0",
  "C1","C#1","D1","D#1","E1","F1","F#1","G1","G#1","A1","A#1","B1",
  "C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2","A2","A#2","B2",
  "C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3",
  "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
  "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5",
  "C6","C#6","D6","D#6","E6","F6","F#6","G6","G#6","A6","A#6","B6",
  "C7","C#7","D7","D#7","E7","F7","F#7","G7","G#7","A7","A#7","B7",
  "C8","C#8","D8","D#8"
];

const MusicScreen = () => {
  const colors = useColors();
  const { user } = useContext(AuthContext);
  const [musics, setMusics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [playingMusic, setPlayingMusic] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Message and PopUp states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});

  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const canEdit = user?.type === 'KNOWLEDGER' || user?.type === 'HOUSER';

  useEffect(() => {
    loadMusics();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: false }),
    ]).start();

    // Listen for navigation back from create screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadMusics(); // Refresh data when returning
    });

    return unsubscribe;
  }, [navigation]);

  const loadMusics = async () => {
    try {
      setLoading(true);
      const data = await musicService.getAllMusic();
      setMusics(data);
    } catch (error) {
      setMessage('Failed to load musics');
      setMessageType('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const playNote = async (noteIndex, duration = 250) => {
    try {
      const frequency = NOTES_FREQUENCIES[noteIndex];
      
      if (Platform.OS === 'web') {
        // Web audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
      } else {
        // Mobile - use Expo Audio (expo-audio)
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: `data:audio/wav;base64,${generateTone(frequency, duration)}` });
        await sound.playAsync();
        setTimeout(() => {
          sound.unloadAsync();
        }, duration);
      }
    } catch (error) {
      console.error('Error playing note:', error);
    }
  };

  const generateTone = (frequency, duration) => {
    // Simple tone generation for mobile (placeholder - would need actual implementation)
    return 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEB9AAACABAAZGF0YQAAAAA=';
  };

  const playMusic = async (music) => {
    if (playingMusic === music.id) {
      setPlayingMusic(null);
      return;
    }

    setPlayingMusic(music.id);
    
    try {
      for (let i = 0; i < music.notes.length; i++) {
        if (playingMusic !== music.id) break;
        
        await playNote(music.notes[i], music.durations[i]);
        await new Promise(resolve => setTimeout(resolve, music.durations[i]));
      }
    } catch (error) {
      console.error('Error playing music:', error);
    } finally {
      setPlayingMusic(null);
    }
  };

  const handleDeleteMusic = async (musicId) => {
    setPopupConfig({
      title: 'Delete Music',
      message: 'Are you sure you want to delete this music?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        setPopupVisible(false);
        try {
          await musicService.deleteMusic(musicId);
          setMusics(musics.filter(m => m.id !== musicId));
          setMessage('Music deleted successfully');
          setMessageType('success');
        } catch (error) {
          setMessage('Failed to delete music');
          setMessageType('error');
        }
      },
      onCancel: () => setPopupVisible(false)
    });
    setPopupVisible(true);
  };

  const navigateToCreateMusic = () => {
    navigation.navigate('MusicCreateScreen');
  };

  const renderMusicItem = ({ item }) => {
    const isPlaying = playingMusic === item.id;
    const isExpanded = selectedMusic === item.id;

    return (
      <TouchableOpacity
        style={[styles.musicCard, { backgroundColor: colors.card }]}
        onPress={() => setSelectedMusic(isExpanded ? null : item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.musicHeader}>
          <View style={styles.musicInfo}>
            <Text style={[styles.musicTitle, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
            <Text style={[styles.musicAuthor, { color: colors.textSecondary }]}>
              by {item.author}
            </Text>
            <Text style={[styles.musicDate, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.musicActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => playMusic(item)}
            >
              <Ionicons
                name={isPlaying ? 'stop' : 'play'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
            
            {canEdit && item.user?.id === user?.id && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.danger }]}
                onPress={() => handleDeleteMusic(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isExpanded && (
          <View style={[styles.musicDetails, { borderTopColor: colors.border }]}>
            <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>
              Notes Sequence:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.notesSequence}>
                {item.notes.map((noteIndex, i) => (
                  <View
                    key={i}
                    style={[styles.noteChip, { backgroundColor: colors.primaryDark }]}
                  >
                    <Text style={styles.noteChipText}>
                      {NOTE_NAMES[noteIndex]}
                    </Text>
                    <Text style={styles.noteDuration}>
                      {item.durations[i]}ms
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredMusics = musics.filter(music =>
    music.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    music.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      {/* Message acima do header */}
      <View style={styles.messageContainer}>
        <Message
          message={message}
          type={messageType}
          onDismiss={() => setMessage('')}
        />
      </View>

      {/* Header estático */}
      <View style={styles.header}>
        <View style={[styles.headerBackground, { backgroundColor: colors.card }, Platform.select({ web: { borderBottom: `1.5px solid ${colors.border}` } })]} />
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : null}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Music Library</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}> 
              {musics.length} {musics.length === 1 ? 'song' : 'songs'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.headerStatusBadge, { backgroundColor: colors.primary }] }>
              <Ionicons name="musical-notes-outline" size={14} color="#fff" />
              <Text style={styles.headerStatusText}>Songs</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 80 }} />

      {/* Conteúdo animado com ScrollView e RefreshControl */}
      <Animated.View style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMusics();
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressViewOffset={10}
            />
          }
        >
          <View style={{ marginBottom: spacing.small, marginTop: spacing.large, paddingHorizontal: spacing.large }}>
            <InputField
              placeholder="Search music or author..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={<Ionicons name="search" size={20} color={colors.primary} />}
              editable={true}
              showClearButton={true}
              onClear={() => setSearchQuery('')}
            />
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredMusics}
              renderItem={renderMusicItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
              nestedScrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="musical-notes-outline" size={64} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No music found</Text>
                  {canEdit && (
                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Create your first music!</Text>
                  )}
                </View>
              }
            />
          )}
          
          {canEdit && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: colors.primary }]}
              onPress={navigateToCreateMusic}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          
          {/* PopUp component */}
          <PopUp
            visible={popupVisible}
            title={popupConfig.title}
            message={popupConfig.message}
            confirmText={popupConfig.confirmText}
            cancelText={popupConfig.cancelText}
            onConfirm={popupConfig.onConfirm}
            onCancel={popupConfig.onCancel}
            type={popupConfig.type}
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 25 : 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    pointerEvents: 'box-none',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 12px rgba(67,97,238,0.10), 0 1.5px 0px rgba(67,97,238,0.08)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
  },
  headerBackButton: {
    padding: spacing.small,
    borderRadius: borderRadius.small,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.medium,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {},
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  headerStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: spacing.small,
    paddingHorizontal: spacing.medium,
    paddingBottom: 100,
  },
  musicCard: {
    marginBottom: spacing.medium,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    ...shadows.medium,
  },
  musicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  musicInfo: {
    flex: 1,
  },
  musicTitle: {
    fontSize: fontSizes.large,
    fontWeight: '600',
    marginBottom: 4,
  },
  musicAuthor: {
    fontSize: fontSizes.medium,
    marginBottom: 2,
  },
  musicDate: {
    fontSize: fontSizes.small,
  },
  musicActions: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.light,
  },
  musicDetails: {
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
  },
  detailsTitle: {
    fontSize: fontSizes.medium,
    fontWeight: '500',
    marginBottom: spacing.small,
  },
  notesSequence: {
    flexDirection: 'row',
    gap: spacing.small,
    paddingVertical: spacing.small,
  },
  noteChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  noteChipText: {
    color: '#fff',
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
  noteDuration: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 60,
    marginTop: 120,
  },
  emptyText: {
    fontSize: fontSizes.large,
    marginTop: spacing.medium,
  },
  emptySubtext: {
    fontSize: fontSizes.medium,
    marginTop: spacing.small,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.strong,
  },
});

export default MusicScreen;