package dev.pioruocco.piocart.exceptions;

/** A resource can't be deleted because other data (orders, products) still refers to it. */
public class ResourceInUseException extends RuntimeException {
    public ResourceInUseException(String message) {
        super(message);
    }
}
