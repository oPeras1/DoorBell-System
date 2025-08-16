import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { spacing, borderRadius } from '../constants/styles';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const ROOM_MAPPING = {
  KITCHEN: 'Kitchen',
  WC1: 'WC 1',
  WC2: 'WC 2',
  FILIPE_B: "Filipe's Room",
  GUI_B: "Guilherme's Room",
  HUGO_B: "Hugo's Room",
  LEO_B: "Leo's Room",
  VIC_B: "Vic's Room",
  LIVING_ROOM: 'Living Room',
  BALCONY: 'Balcony',
};

const InteractiveHousePlan = ({ selectedRooms = [], onRoomSelect, multiSelect = false, viewOnly = false }) => {
  const colors = useColors();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(0);
  const savedPositionX = useSharedValue(0);
  const savedPositionY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = Math.max(0.5, Math.min(savedScale.value * e.scale, 3));
      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      positionX.value = savedPositionX.value + e.translationX;
      positionY.value = savedPositionY.value + e.translationY;
    })
    .onEnd(() => {
      savedPositionX.value = positionX.value;
      savedPositionY.value = positionY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionX.value },
      { translateY: positionY.value },
      { scale: scale.value },
    ],
  }));

  const Corridor = ({ x, y, width, height, hasBorder = false }) => (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={colors.border}
      stroke={hasBorder ? colors.textSecondary : 'none'}
      strokeWidth={hasBorder ? 1.5 : 0}
    />
  );
  
  const ClickableRoom = ({ id, x, y, width, height, label, labelX, labelY, isBathroom = false }) => {
    const isSelected = multiSelect ? selectedRooms.includes(id) : selectedRooms[0] === id;
    const [isHovered, setIsHovered] = useState(false);

    const handleRoomPress = () => {
      if (viewOnly) return; // Don't allow selection in view-only mode
      
      if (multiSelect) {
        const newSelection = isSelected 
          ? selectedRooms.filter(roomId => roomId !== id)
          : [...selectedRooms, id];
        onRoomSelect(newSelection);
      } else {
        onRoomSelect([id]);
      }
    };

    // Contraste direto com primary: branco no dark mode
    const getContrastColor = () => colors.textPrimary === '#F3F6FB' ? '#FFFFFF' : colors.card;

    const renderLabel = () => {
      if (id === 'VIC_B') {
        return (
          <>
            <SvgText
              x={labelX}
              y={labelY - 8}
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
              fontSize="13"
              fontWeight="500"
              fill={isSelected ? getContrastColor() : colors.textPrimary}
              textAnchor="middle"
              dominantBaseline="central"
              pointerEvents="none"
              style={{ ...(Platform.OS === 'web' && { userSelect: 'none' }) }}
            >
              Vic's
            </SvgText>
            <SvgText
              x={labelX}
              y={labelY + 8}
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
              fontSize="13"
              fontWeight="500"
              fill={isSelected ? getContrastColor() : colors.textPrimary}
              textAnchor="middle"
              dominantBaseline="central"
              pointerEvents="none"
              style={{ ...(Platform.OS === 'web' && { userSelect: 'none' }) }}
            >
              Room
            </SvgText>
          </>
        );
      }
      return (
        <SvgText
          x={labelX}
          y={labelY}
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontSize="13"
          fontWeight="500"
          fill={isSelected ? getContrastColor() : colors.textPrimary}
          textAnchor="middle"
          dominantBaseline="central"
          pointerEvents="none"
          style={{ ...(Platform.OS === 'web' && { userSelect: 'none' }) }}
        >
          {label}
        </SvgText>
      );
    };

    return (
      <G
        onPress={handleRoomPress}
        {...(Platform.OS === 'web' && !viewOnly && {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        })}
      >
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={
            isSelected
              ? colors.primary
              : (isHovered && Platform.OS === 'web' && !viewOnly)
              ? colors.accentLight
              : isBathroom
              ? colors.info + '20'
              : colors.card
          }
          stroke={isSelected ? colors.primary : colors.border}
          strokeWidth={isSelected ? 3 : 1.5}
          style={{
            ...(Platform.OS === 'web' && !viewOnly && {
              cursor: 'pointer',
              transition: 'fill 0.2s ease-in-out',
            })
          }}
        />
        {/* Selection indicator for multi-select - hide in view-only mode */}
        {multiSelect && isSelected && !viewOnly && (
          <G>
            <Rect
              x={x + width - 25}
              y={y + 5}
              width="20"
              height="20"
              rx="10"
              fill={colors.primary}
            />
            <SvgText
              x={x + width - 15}
              y={y + 15}
              fontFamily="system-ui"
              fontSize="12"
              fontWeight="bold"
              fill={getContrastColor()}
              textAnchor="middle"
              dominantBaseline="central"
            >
              ✓
            </SvgText>
          </G>
        )}
        {renderLabel()}
      </G>
    );
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.planSvgContainer, animatedStyle]}>
        <Svg width="752" height="430" viewBox="-0.5 -0.5 752 430">
          <G transform="translate(-15, -100)">
            {/* Corredores principais sem contorno */}
            <Corridor x="120" y="220" width="40" height="60" />
            <ClickableRoom id="KITCHEN" x="30" y="160" width="90" height="120" label="Kitchen" labelX={75} labelY={220} />
            <ClickableRoom id="WC1" x="120" y="160" width="90" height="60" label="WC 1" labelX={165} labelY={190} isBathroom />
            <ClickableRoom id="WC2" x="160" y="220" width="50" height="60" label="WC 2" labelX={185} labelY={250} isBathroom />
            <ClickableRoom id="FILIPE_B" x="210" y="160" width="110" height="160" label="Filipe's Room" labelX={265} labelY={220} />
            <ClickableRoom id="GUI_B" x="320" y="160" width="180" height="160" label="Guilherme's Room" labelX={410} labelY={220} />
            <Corridor x="30" y="280" width="470" height="30" />
            <ClickableRoom id="HUGO_B" x="30" y="310" width="270" height="140" label="Hugo's Room" labelX={165} labelY={380} />
            <ClickableRoom id="LEO_B" x="300" y="310" width="140" height="140" label="Leo's Room" labelX={370} labelY={380} />
            <ClickableRoom id="VIC_B" x="440" y="310" width="60" height="140" label="Vic's Room" labelX={470} labelY={380} />
            <ClickableRoom id="LIVING_ROOM" x="500" y="280" width="130" height="170" label="Living Room" labelX={565} labelY={365} />
            <ClickableRoom id="BALCONY" x="630" y="160" width="120" height="290" label="Balcony" labelX={690} labelY={305} />
            {/* Pequenas varandas com contorno */}
            <Corridor x="160" y="140" width="120" height="20" hasBorder />
            <Corridor x="500" y="160" width="130" height="120" hasBorder />
            <Corridor x="160" y="450" width="80" height="20" hasBorder />
            <Corridor x="330" y="450" width="80" height="20" hasBorder />
          </G>
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
};

const HousePlanSelector = ({ 
  visible, 
  selectedRooms = [],
  onRoomsSelect, 
  onClose, 
  multiSelect = false,
  viewOnly = false
}) => {
  const colors = useColors();
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);

  React.useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 15, stiffness: 120 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withSpring(0.9, { damping: 10 });
    }
  }, [visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const handleRoomToggle = (roomSelection) => {
    if (!viewOnly) {
      onRoomsSelect(roomSelection);
    }
  };

  const handleQuickSelect = (roomId) => {
    if (multiSelect) {
      const isSelected = selectedRooms.includes(roomId);
      const newSelection = isSelected 
        ? selectedRooms.filter(id => id !== roomId)
        : [...selectedRooms, roomId];
      onRoomsSelect(newSelection);
    } else {
      onRoomsSelect([roomId]);
    }
  };

  const handleConfirmAndClose = () => {
    if (selectedRooms.length > 0) {
      onClose();
    }
  };

  const formatSelectedCount = () => {
    if (selectedRooms.length === 0) return 'Select rooms';
    if (selectedRooms.length === 1) {
      const roomName = ROOM_MAPPING[selectedRooms[0]];
      return `Confirm ${roomName}`;
    }
    return `Confirm ${selectedRooms.length} rooms`;
  };

  // If viewOnly is true, render inline component instead of modal
  if (viewOnly) {
    return (
      <View style={styles.inlineContainer}>
        <GestureHandlerRootView style={styles.inlineGestureContainer}>
          <View style={styles.inlinePlanContainer}>
            <InteractiveHousePlan 
              selectedRooms={selectedRooms} 
              onRoomSelect={handleRoomToggle}
              multiSelect={multiSelect}
              viewOnly={viewOnly}
            />
          </View>
        </GestureHandlerRootView>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]} onPress={onClose}>
        <Animated.View style={[styles.modalContainer, animatedModalStyle, { backgroundColor: colors.card }]}>
          <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
            <GestureHandlerRootView style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {viewOnly 
                    ? 'Party Locations' 
                    : multiSelect 
                      ? 'Select Rooms' 
                      : 'Select a Room'
                  }
                  {!viewOnly && multiSelect && selectedRooms.length > 0 && (
                    <Text style={[styles.selectionCount, { color: colors.primary }]}> ({selectedRooms.length} selected)</Text>
                  )}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* House Plan Container */}
              <View style={[styles.planContainer, { backgroundColor: colors.background }]}>
                <InteractiveHousePlan 
                  selectedRooms={selectedRooms} 
                  onRoomSelect={handleRoomToggle}
                  multiSelect={multiSelect}
                  viewOnly={viewOnly}
                />
              </View>

              {/* Room Selection List - Hide in view-only mode */}
              {!viewOnly && (
                <View style={[styles.roomsList, { borderTopColor: colors.border }]}>
                  <View style={styles.roomsListHeader}>
                    {Platform.OS === 'web'
                      ? (multiSelect && selectedRooms.length > 0 && (
                          <TouchableOpacity 
                            style={styles.clearButton}
                            onPress={() => onRoomsSelect([])}
                          >
                            <Text style={[styles.clearButtonText, { color: colors.primary }]}>Clear All</Text>
                          </TouchableOpacity>
                        ))
                      : (
                        <>
                          <Text style={[styles.roomsListTitle, { color: colors.textPrimary }]}>Quick Selection:</Text>
                          {multiSelect && selectedRooms.length > 0 && (
                            <TouchableOpacity 
                              style={styles.clearButton}
                              onPress={() => onRoomsSelect([])}
                            >
                              <Text style={[styles.clearButtonText, { color: colors.primary }]}>Clear All</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )
                    }
                  </View>
                  {Platform.OS !== 'web' && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.roomChips}>
                        {Object.entries(ROOM_MAPPING).map(([roomId, roomName]) => {
                          const isSelected = selectedRooms.includes(roomId);
                          return (
                            <TouchableOpacity
                              key={roomId}
                              style={[
                                styles.roomChip, 
                                { backgroundColor: colors.background, borderColor: colors.border },
                                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                              ]}
                              onPress={() => handleQuickSelect(roomId)}
                            >
                              <Text style={[
                                styles.roomChipText, 
                                { color: colors.textPrimary },
                                isSelected && { color: '#FFF' }
                              ]}>
                                {roomName}
                              </Text>
                              {multiSelect && isSelected && (
                                <Ionicons name="checkmark" size={16} color={'#FFF'} style={styles.chipCheckmark} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* Footer - Hide confirm button in view-only mode */}
              {!viewOnly && (
                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  <TouchableOpacity 
                    style={[
                      styles.confirmButton, 
                      { backgroundColor: colors.primary },
                      selectedRooms.length === 0 && { backgroundColor: colors.border }
                    ]} 
                    onPress={handleConfirmAndClose}
                    disabled={selectedRooms.length === 0}
                  >
                    <Text style={[
                      styles.confirmButtonText,
                      { color: '#FFF' },
                      selectedRooms.length === 0 && { color: colors.textSecondary }
                    ]}>
                      {formatSelectedCount()}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </GestureHandlerRootView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? spacing.large : spacing.medium,
  },
  modalContainer: {
    borderRadius: borderRadius.large,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT * 0.85,
    maxHeight: 700,
    overflow: 'hidden',
    flexDirection: 'column',
    ...(Platform.OS === 'web' ? {
      boxShadow: `0px 8px 16px rgba(0, 0, 0, 0.25)`,
    } : {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.large,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.small,
  },
  planContainer: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        marginBottom: 0,
      },
      default: {
        marginBottom: spacing.large,
      }
    }),
  },
  planSvgContainer: {
    width: 752,
    height: 430,
  },
  roomsList: {
    padding: spacing.large,
    borderTopWidth: 1,
    ...Platform.select({
      web: {
        marginTop: 0,
        paddingTop: spacing.medium,
        paddingBottom: spacing.medium,
      }
    }),
  },
  roomsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.medium,
  },
  roomChips: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  roomChip: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
  },
  roomChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    padding: spacing.large,
    borderTopWidth: 1,
  },
  confirmButton: {
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '400',
  },
  roomsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: {
        marginBottom: 0,
      },
      default: {
        marginBottom: spacing.medium,
      }
    }),
  },
  clearButton: {
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipCheckmark: {
    marginLeft: spacing.small,
  },
  inlineContainer: {
    backgroundColor: 'transparent', 
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    height: 300,
  },
  inlineGestureContainer: {
    flex: 1,
  },
  inlinePlanContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HousePlanSelector;