package dev.pioruocco.piocart.response;

import dev.pioruocco.piocart.dto.UserDto;

public record AuthResponse(String token, UserDto user) {
}
