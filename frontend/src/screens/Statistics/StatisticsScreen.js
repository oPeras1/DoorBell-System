import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, Dimensions, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AuthContext } from '../../context/AuthContext';
import TopField from '../../components/TopField';
import BottomNavBar from '../../components/BottomNavBar';
import { getTimeBasedGreeting } from '../../constants/functions';
import { useColors } from '../../hooks/useColors';
import { shadows, borderRadius } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { format, subHours, subDays } from 'date-fns';
import { getEnvironmentData } from '../../services/statisticsService';
import { getDoorEnvironment } from '../../services/doorService';

const screenWidth = Dimensions.get('window').width;

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
};

const TimeSelector = ({ selectedRange, onSelectRange }) => {
    const colors = useColors();
    const ranges = [
        { label: '24h', value: '24h' },
        { label: '7d', value: '7d' },
        { label: '30d', value: '30d' },
    ];

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 15, gap: 10 }}>
            {ranges.map((range) => (
                <TouchableOpacity
                    key={range.value}
                    onPress={() => onSelectRange(range.value)}
                    style={{
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        backgroundColor: selectedRange === range.value ? colors.primary : colors.card,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: selectedRange === range.value ? colors.primary : colors.border,
                        ...shadows.light,
                    }}
                >
                    <Text style={{
                        color: selectedRange === range.value ? '#FFF' : colors.textPrimary,
                        fontWeight: '600',
                        fontSize: 14,
                    }}>
                        {range.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const MetricCard = ({ title, value, unit, icon, color, trend }) => {
    const colors = useColors();
    
    return (
        <View style={{
            backgroundColor: colors.card,
            borderRadius: borderRadius.large,
            padding: 15,
            marginBottom: 15,
            width: '48%', 
            ...shadows.medium,
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ 
                    backgroundColor: `${color}20`, 
                    padding: 8, 
                    borderRadius: 12 
                }}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                {trend && (
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                       <Ionicons 
                         name={trend > 0 ? "trending-up" : "trending-down"} 
                         size={16} 
                         color={trend > 0 ? colors.success : colors.danger} 
                       />
                       <Text style={{ 
                           fontSize: 12, 
                           fontWeight: 'bold',
                           color: trend > 0 ? colors.success : colors.danger,
                           marginLeft: 2
                       }}>
                           {Math.abs(trend)}%
                       </Text>
                   </View>
                )}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{title}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
                {value}<Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: 'normal' }}>{unit}</Text>
            </Text>
        </View>
    );
};

const Chart = ({ data, title, ySuffix, color }) => {
    const colors = useColors();
    const [containerWidth, setContainerWidth] = useState(0);

    if (!data || data.labels.length === 0) {
        return <Text style={{ color: colors.textPrimary, textAlign: 'center', padding: 20 }}>No data available for {title}</Text>;
    }

    const chartConfig = {
        backgroundColor: colors.card,
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        decimalPlaces: ySuffix?.includes('hPa') || ySuffix?.includes('ppm') ? 0 : 1,
        color: (opacity = 1) => color || `rgba(${hexToRgb(colors.primary)}, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(${hexToRgb(colors.textSecondary)}, ${opacity})`,
        
        // Remove individual padding here to let the component manage the grid
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: data && data.labels.length > 40 ? '0' : '4',
            strokeWidth: data && data.labels.length > 40 ? '0' : '2',
            stroke: colors.card
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: colors.border,
            strokeOpacity: 0.1
        },
        propsForLabels: {
            fontSize: 10,
            fontWeight: '600',
        }
    };

    return (
        <View 
            style={{ 
                marginTop: 20, 
                backgroundColor: colors.card, 
                borderRadius: borderRadius.large, 
                padding: 15,
                ...shadows.medium,
                // REMOVE overflow: 'hidden' as it clips the Y-axis labels
            }}
            onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                // Subtract only the horizontal padding of the container (15 * 2 = 30)
                setContainerWidth(width - 10); 
            }}
        >
            <Text style={{ 
                color: colors.textPrimary, 
                fontSize: 16, 
                fontWeight: 'bold', 
                marginBottom: 10 
            }}>
                {ySuffix ? `${title} (${ySuffix.trim()})` : title}
            </Text>

            <View style={{ alignItems: 'center' }}>
                {containerWidth > 0 && (
                    <LineChart
                        data={data}
                        width={containerWidth} // Use the full available width
                        height={220}
                        chartConfig={chartConfig}
                        yAxisSuffix={ySuffix}
                        bezier
                        withDots={true}
                        withInnerLines={true}
                        withOuterLines={false}
                        withVerticalLines={false}
                        transparent={true}
                        // Important: Adjusting chart padding and margin
                        style={{
                            marginVertical: 8,
                            borderRadius: 16,
                        }}
                        verticalLabelRotation={0} 
                        xLabelsOffset={-5}
                    />
                )}
            </View>
        </View>
    );
};

const StatisticsScreen = ({ navigation }) => {
    const { user: currentUser, logout } = useContext(AuthContext);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRange, setSelectedRange] = useState('24h');
    const colors = useColors();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let hours = 24;
                if (selectedRange === '7d') hours = 7 * 24;
                if (selectedRange === '30d') hours = 30 * 24;

                const [statsResponse, currentEnv] = await Promise.all([
                    getEnvironmentData(hours),
                    getDoorEnvironment()
                ]);

                let rawData = statsResponse.data;

                // Handle case where data might be an object instead of array
                if (!Array.isArray(rawData) && typeof rawData === 'object' && rawData !== null) {
                    rawData = Object.values(rawData);
                }

                if (Array.isArray(rawData) && rawData.length > 0) {
                    // Sort by time ascending (Oldest -> Newest) so chart goes left -> right
                    rawData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    // Use all data points as requested
                    const sampledData = rawData;

                    // Generate X axis labels based on range
                    const labels = sampledData.map((d, index) => {
                        const date = new Date(d.createdAt);
                        if (selectedRange === '24h') {
                            return format(date, 'HH:mm');
                        } else if (selectedRange === '7d') {
                            return format(date, 'EEE');
                        } else {
                             return format(date, 'MMM d');
                        }
                    });

                    // Simplify label display logic for now to ensure visibility
                    // If too many points, blank out intermediate ones directly in labels array
                    // This is safer than relying on formatXLabel with index which can be flaky
                    const maxDesiredLabels = selectedRange === '24h' ? 6 : 5; // More labels for 24h view (every ~2h)
                    
                    if (labels.length > maxDesiredLabels) {
                        const labelStep = Math.ceil(labels.length / maxDesiredLabels);
                        labels.forEach((_, i) => {
                             if (i % labelStep !== 0 && i !== labels.length - 1) {
                                 labels[i] = ''; // Blank out directly
                             }
                        });
                    }

                    // Calculate averages for trends
                    const avgTemp = rawData.reduce((acc, curr) => acc + curr.temperature, 0) / rawData.length;
                    const avgHum = rawData.reduce((acc, curr) => acc + curr.humidity, 0) / rawData.length;
                    const avgAqi = rawData.reduce((acc, curr) => acc + curr.airQualityIndex, 0) / rawData.length;
                    const avgPressure = rawData.reduce((acc, curr) => acc + curr.pressure, 0) / rawData.length;
                    const avgTvoc = rawData.reduce((acc, curr) => acc + curr.tvocPpb, 0) / rawData.length;
                    const avgEco2 = rawData.reduce((acc, curr) => acc + curr.eco2Ppm, 0) / rawData.length;

                    // Calculate percentage difference from average
                    // (Current - Average) / Average * 100
                    const tempTrend = ((currentEnv.temperature - avgTemp) / avgTemp) * 100;
                    const humTrend = ((currentEnv.humidity - avgHum) / avgHum) * 100;
                    const aqiTrend = ((currentEnv.air_quality_index - avgAqi) / avgAqi) * 100;
                    const pressureTrend = ((currentEnv.pressure - avgPressure) / avgPressure) * 100;
                    const tvocTrend = ((currentEnv.tvoc_ppb - avgTvoc) / avgTvoc) * 100;
                    const eco2Trend = ((currentEnv.eco2_ppm - avgEco2) / avgEco2) * 100;

                    const formattedData = {
                        temperature: { 
                            labels, 
                            datasets: [{ data: sampledData.map(d => d.temperature) }] 
                        },
                        humidity: { 
                            labels, 
                            datasets: [{ data: sampledData.map(d => d.humidity * 100) }] 
                        },
                        pressure: { 
                            labels, 
                            datasets: [{ data: sampledData.map(d => d.pressure) }] 
                        },
                        airQuality: { 
                            labels, 
                            datasets: [{ data: sampledData.map(d => d.airQualityIndex) }] 
                        },
                        tvoc: { 
                            labels, 
                            datasets: [{ data: sampledData.map(d => d.tvocPpb) }] 
                        },
                        eco2: { 
                            labels, 
                            datasets: [{ data: sampledData.map(d => d.eco2Ppm) }] 
                        },
                        current: {
                            temp: currentEnv.temperature,
                            humidity: currentEnv.humidity * 100,
                            pressure: currentEnv.pressure,
                            airQuality: currentEnv.air_quality_index,
                            tvoc: currentEnv.tvoc_ppb,
                            eco2: currentEnv.eco2_ppm
                        },
                        trends: {
                            temp: tempTrend,
                            humidity: humTrend,
                            aqi: aqiTrend,
                            pressure: pressureTrend,
                            tvoc: tvocTrend,
                            eco2: eco2Trend
                        }
                    };
                    setChartData(formattedData);
                } else {
                    setChartData(null);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                setChartData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedRange]);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        contentContainer: {
            paddingBottom: 100, // Space for BottomNavBar
            paddingHorizontal: 20,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.textPrimary,
            marginTop: 20,
            marginBottom: 15,
        },
        metricsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        header: {
            marginVertical: 10,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.textPrimary,
        },
        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 4,
        }
    });

    return (
        <View style={styles.container}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle={colors.isDark ? "light-content" : "dark-content"}
            />
            
            <TopField 
                greeting={getTimeBasedGreeting()}
                userName={currentUser?.username}
                userType={currentUser?.type}
                isOnline={true}
                onProfilePress={() => {}}
                showDarkModeToggle={true}
                onLogout={logout}
                navigation={navigation}
            />

            <ScrollView 
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                     <Text style={styles.title}>Environment</Text>
                     <Text style={styles.subtitle}>Real-time home statistics</Text>
                </View>

                <TimeSelector 
                    selectedRange={selectedRange} 
                    onSelectRange={setSelectedRange} 
                />

                {loading ? (
                    <View style={{ height: 400, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : chartData ? (
                    <>
                        <View style={styles.metricsGrid}>
                            <MetricCard 
                                title="Temperature" 
                                value={chartData.current.temp.toFixed(1)} 
                                unit="°C" 
                                icon="thermometer-outline" 
                                color="#FF6B6B"
                                trend={chartData.trends.temp.toFixed(1)}
                            />
                            <MetricCard 
                                title="Humidity" 
                                value={chartData.current.humidity.toFixed(1)} 
                                unit="%" 
                                icon="water-outline" 
                                color="#4CC9F0"
                                trend={chartData.trends.humidity.toFixed(1)}
                            />
                            <MetricCard 
                                title="Air Quality" 
                                value={chartData.current.airQuality} 
                                unit=" AQI" 
                                icon="leaf-outline" 
                                color="#4ADE80"
                                trend={chartData.trends.aqi.toFixed(1)}
                            />
                             <MetricCard 
                                title="Pressure" 
                                value={chartData.current.pressure.toFixed(1)} 
                                unit=" hPa" 
                                icon="speedometer-outline" 
                                color="#FCD34D"
                                trend={chartData.trends.pressure.toFixed(1)}
                            />
                            <MetricCard 
                                title="TVOC" 
                                value={chartData.current.tvoc} 
                                unit=" ppb" 
                                icon="flask-outline" 
                                color="#A78BFA"
                                trend={chartData.trends.tvoc.toFixed(1)}
                            />
                            <MetricCard 
                                title="eCO2" 
                                value={chartData.current.eco2} 
                                unit=" ppm" 
                                icon="cloud-outline" 
                                color="#FB923C"
                                trend={chartData.trends.eco2.toFixed(1)}
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Trends</Text>

                        <Chart 
                            data={chartData.temperature} 
                            title="Temperature History" 
                            ySuffix="°C" 
                            color={`rgba(${hexToRgb('#FF6B6B')}, ${0.8})`}
                        />
                        <Chart 
                            data={chartData.humidity} 
                            title="Humidity History" 
                            ySuffix="%" 
                            color={`rgba(${hexToRgb('#4CC9F0')}, ${0.8})`}
                        />
                         <Chart 
                            data={chartData.airQuality} 
                            title="Air Quality (AQI)" 
                            ySuffix="" 
                            color={`rgba(${hexToRgb('#4ADE80')}, ${0.8})`}
                        />
                         <Chart 
                            data={chartData.eco2} 
                            title="CO2 Levels" 
                            ySuffix=" ppm" 
                            color={`rgba(${hexToRgb('#F472B6')}, ${0.8})`}
                        />
                         <Chart 
                            data={chartData.tvoc} 
                            title="TVOC Levels" 
                            ySuffix=" ppb" 
                            color={`rgba(${hexToRgb('#A78BFA')}, ${0.8})`}
                        />
                         <Chart 
                            data={chartData.pressure} 
                            title="Pressure History" 
                            ySuffix=" hPa" 
                            color={`rgba(${hexToRgb('#FCD34D')}, ${0.8})`}
                        />
                    </>
                ) : (
                    <View style={styles.centered}>
                        <Text style={{ color: colors.textPrimary }}>No environment data available.</Text>
                    </View>
                )}
            </ScrollView>
            
            <BottomNavBar navigation={navigation} active="Statistics" />
        </View>
    );
};

export default StatisticsScreen;
