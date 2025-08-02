package com.operas.controller;

import com.operas.model.User;
import com.operas.model.Log;
import com.operas.service.UserService;
import com.operas.service.LogService;
import com.operas.security.CustomUserDetails;

import com.fazecast.jSerialComm.SerialPort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/arduino")
public class ArduinoController {

    @Autowired
    private LogService logService;

    @PostMapping("/command")
    public ResponseEntity<?> sendCommand(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {

            // List available ports for debugging
            SerialPort[] ports = SerialPort.getCommPorts();
            for (SerialPort port : ports) {
                System.out.println("Available Port: " + port.getSystemPortName());
            }

            // Open the serial port
            SerialPort comPort = SerialPort.getCommPort("/dev/ttyUSB0");
            comPort.setComPortParameters(9600, 8, SerialPort.ONE_STOP_BIT, SerialPort.NO_PARITY);
            comPort.setComPortTimeouts(SerialPort.TIMEOUT_WRITE_BLOCKING | SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 1000, 1000);

            if (!comPort.openPort()) {
                return ResponseEntity.badRequest().body("Failed to open COM port");
            }

            try {
                // Wait for Arduino to initialize (some boards reset on port open)
                Thread.sleep(2000);
                System.out.println("Port opened");

                // Send the command with explicit UTF-8 encoding
                String command = "open\n";
                byte[] data = command.getBytes("UTF-8");
                comPort.writeBytes(data, data.length);
                System.out.println("Sent: " + command.trim());

                // Wait and read response from Arduino
                StringBuilder response = new StringBuilder();
                long startTime = System.currentTimeMillis();
                while (System.currentTimeMillis() - startTime < 5000) { // 5-second timeout
                    if (comPort.bytesAvailable() > 0) {
                        byte[] readBuffer = new byte[1024];
                        int numRead = comPort.readBytes(readBuffer, readBuffer.length);
                        response.append(new String(readBuffer, 0, numRead));
                        if (response.toString().contains("Relay deactivated!")) {
                            break; // Command was processed
                        }
                    }
                    Thread.sleep(100);
                }
                System.out.println("Received: " + response.toString());

                // Close the port
                comPort.closePort();
                if (response.toString().contains("Relay deactivated!")) {
                    // Log the command execution
                    User user = userDetails.getUser();
                    logService.createLog(user.getId(), new Log("Arduino command executed: " + command.trim(), user, "OPEN_DOOR"));

                    return ResponseEntity.ok("Command 'open' sent successfully");
                } else {
                    return ResponseEntity.badRequest().body("Arduino received command but didn’t process it: " + response);
                }
            } catch (Exception e) {
                comPort.closePort();
                return ResponseEntity.badRequest().body("Error during communication: " + e.getMessage());
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}