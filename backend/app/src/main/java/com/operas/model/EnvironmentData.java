package com.operas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "environment_data")
public class EnvironmentData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double temperature;
    private Double humidity;
    private Double pressure;
    private Double altitude;

    @Column(name = "air_quality_index")
    private Integer airQualityIndex;

    @Column(name = "tvoc_ppb")
    private Integer tvocPpb;

    @Column(name = "eco2_ppm")
    private Integer eco2Ppm;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Double getPressure() {
        return pressure;
    }

    public void setPressure(Double pressure) {
        this.pressure = pressure;
    }

    public Double getAltitude() {
        return altitude;
    }

    public void setAltitude(Double altitude) {
        this.altitude = altitude;
    }

    public Integer getAirQualityIndex() {
        return airQualityIndex;
    }

    public void setAirQualityIndex(Integer airQualityIndex) {
        this.airQualityIndex = airQualityIndex;
    }

    public Integer getTvocPpb() {
        return tvocPpb;
    }

    public void setTvocPpb(Integer tvocPpb) {
        this.tvocPpb = tvocPpb;
    }

    public Integer getEco2Ppm() {
        return eco2Ppm;
    }

    public void setEco2Ppm(Integer eco2Ppm) {
        this.eco2Ppm = eco2Ppm;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}