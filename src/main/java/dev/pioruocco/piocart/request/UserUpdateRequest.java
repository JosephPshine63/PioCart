package dev.pioruocco.piocart.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
}
