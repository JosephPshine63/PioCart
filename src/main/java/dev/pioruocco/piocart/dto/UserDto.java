package dev.pioruocco.piocart.dto;

import dev.pioruocco.piocart.enums.Role;
import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
}
