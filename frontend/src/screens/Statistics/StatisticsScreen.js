import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getEnvironmentData } from '../../services/statisticsService';
import useColors from '../../hooks/useColors';
import { format } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

const Chart = ({ data, title, ySuffix }) => {
    const colors = useColors();
    if (!data || data.labels.length === 0) {
        return <Text style={{ color: colors.text, textAlign: 'center', padding: 20 }}>No data available for {title}</Text>;
    }

    const chartConfig = {
        backgroundColor: colors.background,
        backgroundGradientFrom: colors.background,
        backgroundGradientTo: colors.background,
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(${colors.rgb.primary}, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(${colors.rgb.text}, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.primary,
        },
    };

    return (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>{title}</Text>
            <LineChart
                data={data}
                width={screenWidth * 0.95}
                height={220}
                yAxisSuffix={ySuffix}
                chartConfig={chartConfig}
                bezier
                style={{
                    marginVertical: 8,
                    borderRadius: 16,
                }}
            />
        </View>
    );
};

const StatisticsScreen = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const colors = useColors();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getEnvironmentData(24); // Fetch last 24 hours
                const data = response.data;

                if (data && data.length > 0) {
                    const labels = data.map(d => format(new Date(d.createdAt), 'HH:mm'));
                    
                    const formattedData = {
                        temperature: { labels, datasets: [{ data: data.map(d => d.temperature) }] },
                        humidity: { labels, datasets: [{ data: data.map(d => d.humidity) }] },
                        pressure: { labels, datasets: [{ data: data.map(d => d.pressure) }] },
                        airQuality: { labels, datasets: [{ data: data.map(d => d.airQualityIndex) }] },
                        tvoc: { labels, datasets: [{ data: data.map(d => d.tvocPpb) }] },
                        eco2: { labels, datasets: [{ data: data.map(d => d.eco2Ppm) }] },
                    };
                    setChartData(formattedData);
                } else {
                    setChartData(null); // No data
                }
            } catch (err) {
                setError('Failed to fetch data. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorText: {
            color: colors.danger,
            fontSize: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            padding: 20,
            textAlign: 'center',
        }
    });

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    if (error) {
        return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Environment Statistics (Last 24h)</Text>
            {chartData ? (
                <>
                    <Chart data={chartData.temperature} title="Temperature" ySuffix="°C" />
                    <Chart data={chartData.humidity} title="Humidity" ySuffix="%" />
                    <Chart data={chartData.pressure} title="Pressure" ySuffix=" hPa" />
                    <Chart data={chartData.airQuality} title="Air Quality Index" ySuffix="" />
                    <Chart data={chartData.tvoc} title="TVOC" ySuffix=" ppb" />
                    <Chart data={chartData.eco2} title="eCO2" ySuffix=" ppm" />
                </>
            ) : (
                <View style={styles.centered}>
                    <Text style={{ color: colors.text }}>No environment data recorded in the last 24 hours.</Text>
                </View>
            )}
        </ScrollView>
    );
};

export default StatisticsScreen;
