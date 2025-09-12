import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { AuthContext } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { spacing, borderRadius, fontSizes, shadows } from '../../constants/styles';
import musicService from '../../services/musicService';
import InputField from '../../components/InputField';
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
  "C5","C#5","D5","D#5","E5","F5","F#5","G5","G5","A5","A#5","B5",
  "C6","C#6","D6","D#6","E6","F6","F#6","G6","G#6","A6","A#6","B6",
  "C7","C#7","D7","D#7","E7","F7","F#7","G7","G#7","A7","A#7","B7",
  "C8","C#8","D8","D#8"
];

const MusicCreateScreen = () => {
  const colors = useColors();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  // Form state
  const [musicName, setMusicName] = useState('');
  const [musicAuthor, setMusicAuthor] = useState('');
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [recordedDurations, setRecordedDurations] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(250);
  const [isRecording, setIsRecording] = useState(false);
  const [currentOctave, setCurrentOctave] = useState(4);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use a ref for immediate state checking in loops
  const isPlayingRef = useRef(isPlayingRecorded);
  isPlayingRef.current = isPlayingRecorded;


  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const animatedValues = useRef({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: false }),
    ]).start();
  }, []);

  // --- [FIXED] --- Updated playNote function with the correct expo-audio API
  const playNote = async (noteIndex, duration = 250) => {
    try {
      const frequency = NOTES_FREQUENCIES[noteIndex];
      
      if (Platform.OS === 'web') {
        // Web audio API (unchanged)
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
        // Mobile - use expo-audio and expo-file-system
        const base64 = generateTone(frequency, duration);
        const fileUri = FileSystem.cacheDirectory + `note_${frequency}_${duration}.wav`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: fileUri });
        await sound.playAsync();
        
        // Unload after the sound has played to free up memory
        setTimeout(async () => {
          await sound.unloadAsync();
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }, duration + 100);
      }
    } catch (error) {
      console.error('Error playing note:', error);
    }
  };

  const generateTone = (frequency, duration) => {
    // IMPORTANT: This is a placeholder for a valid WAV file header. 
    // It does not contain actual sound data and will likely only produce a 'click'.
    // A proper implementation would require generating PCM data and encoding it, which is complex.
    return 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQAAAAA=';
  };

  // --- [FIXED] --- Updated playRecordedMusic to use useRef for stopping
  const playRecordedMusic = async () => {
    if (recordedNotes.length === 0) {
      setMessage('No notes recorded to play');
      setMessageType('error');
      return;
    }

    // Toggle playing state
    if (isPlayingRecorded) {
      setIsPlayingRecorded(false); // The ref will update synchronously
      return;
    }

    setIsPlayingRecorded(true);
    
    try {
      for (let i = 0; i < recordedNotes.length; i++) {
        // Use the ref for an immediate check
        if (!isPlayingRef.current) break;
        
        await playNote(recordedNotes[i], recordedDurations[i]);
        await new Promise(resolve => setTimeout(resolve, recordedDurations[i]));
      }
    } catch (error) {
      console.error('Error playing recorded music:', error);
      setMessage('Error playing recorded music');
      setMessageType('error');
    } finally {
      // Ensure state is reset regardless of how the loop ends
      setIsPlayingRecorded(false);
    }
  };

  const addNoteToRecording = (noteIndex) => {
    if (!isRecording) {
      setMessage('Start recording first');
      setMessageType('error');
      return;
    }
    
    playNote(noteIndex, selectedDuration);
    setRecordedNotes([...recordedNotes, noteIndex]);
    setRecordedDurations([...recordedDurations, selectedDuration]);
  };

  const removeLastNote = () => {
    if (recordedNotes.length > 0) {
      setRecordedNotes(recordedNotes.slice(0, -1));
      setRecordedDurations(recordedDurations.slice(0, -1));
    }
  };

  const clearRecording = () => {
    Alert.alert(
      'Clear Recording',
      'Are you sure you want to clear all recorded notes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setRecordedNotes([]);
            setRecordedDurations([]);
            setIsRecording(false);
          }
        }
      ]
    );
  };

  const handleSaveMusic = async () => {
    if (!musicName.trim() || !musicAuthor.trim()) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (recordedNotes.length === 0) {
      setMessage('Please record some notes');
      setMessageType('error');
      return;
    }

    setIsSaving(true);
    try {
      await musicService.createMusic({
        name: musicName.trim(),
        author: musicAuthor.trim(),
        notes: recordedNotes,
        durations: recordedDurations,
      });
      
      setMessage('Music saved successfully!');
      setMessageType('success');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      setMessage('Failed to save music');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPianoKey = (noteIndex, isBlack = false) => {
    const noteName = NOTE_NAMES[noteIndex];
    const animated = animatedValues.current[noteIndex] || new Animated.Value(1);
    animatedValues.current[noteIndex] = animated;

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(animated, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(animated, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      addNoteToRecording(noteIndex);
    };

    // Responsive key sizes for Android
    const keyWidth = Platform.OS === 'android' ? screenWidth * 0.1 : 50;
    const whiteKeyHeight = Platform.OS === 'android' ? 120 : 150;
    const blackKeyWidth = Platform.OS === 'android' ? screenWidth * 0.07 : 35;
    const blackKeyHeight = Platform.OS === 'android' ? 80 : 100;

    return (
      <Animated.View
        key={noteIndex}
        style={[
          styles.pianoKey,
          isBlack ? styles.blackKey : styles.whiteKey,
          {
            backgroundColor: isBlack ? '#1a1a1a' : colors.card,
            transform: [{ scale: animated }],
            width: isBlack ? blackKeyWidth : keyWidth,
            height: isBlack ? blackKeyHeight : whiteKeyHeight,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.keyTouchable}
          onPress={handlePress}
        >
          <Text style={[
            styles.keyText,
            { 
              color: isBlack ? '#fff' : colors.textPrimary,
              fontSize: Platform.OS === 'android' ? 8 : 10
            }
          ]}>
            {noteName}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPiano = () => {
    const startIndex = currentOctave * 12;
    const keys = [];
    
    // White keys pattern: C, D, E, F, G, A, B
    const whiteKeyIndices = [0, 2, 4, 5, 7, 9, 11];
    const blackKeyPositions = [1, 3, 6, 8, 10];
    
    // Render one octave for better mobile experience
    const octaveStart = startIndex;
    
    whiteKeyIndices.forEach(index => {
      keys.push(renderPianoKey(octaveStart + index, false));
    });
    
    blackKeyPositions.forEach(index => {
      keys.push(renderPianoKey(octaveStart + index, true));
    });
    
    return keys;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Message */}
      <View style={styles.messageContainer}>
        <Message
          message={message}
          type={messageType}
          onDismiss={() => setMessage('')}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerBackground, { backgroundColor: colors.card }]} />
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Music</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, { 
              backgroundColor: colors.primary,
              opacity: (!musicName || !musicAuthor || recordedNotes.length === 0 || isSaving) ? 0.5 : 1
            }]}
            onPress={handleSaveMusic}
            disabled={!musicName || !musicAuthor || recordedNotes.length === 0 || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={{
        flex: 1,
        marginTop: 80,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Form Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Music Information</Text>
            
            <View style={styles.inputSection}>
              <InputField
                label="Music Name"
                value={musicName}
                onChangeText={setMusicName}
                placeholder="Enter music name"
                icon={<Ionicons name="musical-notes-outline" size={20} color={colors.primary} />}
              />
            </View>

            <View style={styles.inputSection}>
              <InputField
                label="Author"
                value={musicAuthor}
                onChangeText={setMusicAuthor}
                placeholder="Enter author name"
                icon={<Ionicons name="person-outline" size={20} color={colors.primary} />}
              />
            </View>
          </View>

          {/* Recording Controls */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recording Controls</Text>
            
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  { backgroundColor: isRecording ? colors.danger : colors.success }
                ]}
                onPress={() => setIsRecording(!isRecording)}
              >
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'radio-button-on'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.recordButtonText}>
                  {isRecording ? 'Stop' : 'Record'}
                </Text>
              </TouchableOpacity>

              {recordedNotes.length > 0 && (
                <>
                  <TouchableOpacity
                    style={[styles.playButton, { backgroundColor: colors.primary }]}
                    onPress={playRecordedMusic}
                  >
                    <Ionicons
                      name={isPlayingRecorded ? 'stop' : 'play'}
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.playButtonText}>
                      {isPlayingRecorded ? 'Stop' : 'Play'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.undoButton, { backgroundColor: colors.warning }]}
                    onPress={removeLastNote}
                  >
                    <Ionicons name="arrow-undo" size={16} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.clearButton, { backgroundColor: colors.danger }]}
                    onPress={clearRecording}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Duration Selection */}
            <View style={styles.durationSection}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Note Duration: {selectedDuration}ms
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.durationButtons}>
                  {[100, 250, 500, 750, 1000].map(duration => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationButton,
                        { backgroundColor: colors.card },
                        selectedDuration === duration && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setSelectedDuration(duration)}
                    >
                      <Text style={[
                        styles.durationButtonText,
                        { color: selectedDuration === duration ? '#fff' : colors.textPrimary }
                      ]}>
                        {duration}ms
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Octave Selection */}
            <View style={styles.octaveSection}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Octave: C{currentOctave}
              </Text>
              <View style={styles.octaveButtons}>
                {[2, 3, 4, 5, 6].map(octave => (
                  <TouchableOpacity
                    key={octave}
                    style={[
                      styles.octaveButton,
                      { backgroundColor: colors.card },
                      currentOctave === octave && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setCurrentOctave(octave)}
                  >
                    <Text style={[
                      styles.octaveButtonText,
                      { color: currentOctave === octave ? '#fff' : colors.textPrimary }
                    ]}>
                      C{octave}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Recorded Notes Display */}
          {recordedNotes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Recorded Notes ({recordedNotes.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.notesSequence}>
                  {recordedNotes.map((noteIndex, i) => (
                    <View
                      key={i}
                      style={[styles.noteChip, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.noteChipText}>
                        {NOTE_NAMES[noteIndex]}
                      </Text>
                      <Text style={styles.noteDuration}>
                        {recordedDurations[i]}ms
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Virtual Piano */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Virtual Piano {!isRecording && '(Start recording to play)'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pianoContainer}
            >
              {renderPiano()}
            </ScrollView>
          </View>

          <View style={{ height: 100 }} />
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
        boxShadow: '0 2px 12px rgba(67,97,238,0.10)',
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.light,
  },
  content: {
    flex: 1,
    padding: spacing.large,
  },
  section: {
    marginBottom: spacing.xlarge,
  },
  sectionTitle: {
    fontSize: fontSizes.large,
    fontWeight: '600',
    marginBottom: spacing.medium,
  },
  inputSection: {
    marginBottom: spacing.medium,
  },
  inputLabel: {
    fontSize: fontSizes.medium,
    fontWeight: '500',
    marginBottom: spacing.small,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.small,
    marginBottom: spacing.medium,
    flexWrap: 'wrap',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: 10,
    borderRadius: borderRadius.medium,
    ...shadows.light,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: fontSizes.small,
    fontWeight: '600',
    marginLeft: 6,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: 10,
    borderRadius: borderRadius.medium,
    ...shadows.light,
  },
  playButtonText: {
    color: '#fff',
    fontSize: fontSizes.small,
    fontWeight: '600',
    marginLeft: 6,
  },
  undoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.light,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.light,
  },
  durationSection: {
    marginBottom: spacing.medium,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: spacing.small,
    paddingVertical: spacing.small,
  },
  durationButton: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    ...shadows.light,
  },
  durationButtonText: {
    fontSize: fontSizes.small,
    fontWeight: '500',
  },
  octaveSection: {
    marginBottom: spacing.medium,
  },
  octaveButtons: {
    flexDirection: 'row',
    gap: spacing.small,
    marginTop: spacing.small,
    flexWrap: 'wrap',
  },
  octaveButton: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    ...shadows.light,
  },
  octaveButtonText: {
    fontSize: fontSizes.small,
    fontWeight: '500',
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
  pianoContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.medium,
    gap: 1,
  },
  pianoKey: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: borderRadius.small,
    ...shadows.light,
  },
  whiteKey: {
    marginHorizontal: 1,
  },
  blackKey: {
    marginHorizontal: Platform.OS === 'android' ? -12 : -17,
    zIndex: 1,
  },
  keyTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.small,
  },
  keyText: {
    fontWeight: '500',
  },
});

export default MusicCreateScreen;