package dev.pioruocco.piocart.exceptions;

/** The requested status change isn't allowed from the order's current status. */
public class InvalidOrderStatusException extends RuntimeException {
    public InvalidOrderStatusException(String message) {
        super(message);
    }
}
