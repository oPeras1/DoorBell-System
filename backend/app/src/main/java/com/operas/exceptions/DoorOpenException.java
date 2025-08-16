package com.operas.exceptions;

public class DoorOpenException extends RuntimeException {
    public DoorOpenException(String message) {
        super(message);
    }
}
