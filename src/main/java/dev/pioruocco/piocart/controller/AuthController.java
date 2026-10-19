package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.dto.UserDto;
import dev.pioruocco.piocart.model.User;
import dev.pioruocco.piocart.request.CreateUserRequest;
import dev.pioruocco.piocart.request.LoginRequest;
import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.response.AuthResponse;
import dev.pioruocco.piocart.security.JwtService;
import dev.pioruocco.piocart.security.ShopUserDetails;
import dev.pioruocco.piocart.service.user.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/auth")
public class AuthController {
    private final IUserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        String token = jwtService.generateToken(new ShopUserDetails(user));
        return ResponseEntity.ok(new ApiResponse("Registration success!",
                new AuthResponse(token, userService.convertUserToDto(user))));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        var authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.getEmail().trim().toLowerCase(), request.getPassword()));
        ShopUserDetails principal = (ShopUserDetails) authentication.getPrincipal();
        UserDto user = userService.convertUserToDto(userService.getUserById(principal.getId()));
        return ResponseEntity.ok(new ApiResponse("Login success!",
                new AuthResponse(jwtService.generateToken(principal), user)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> me(@AuthenticationPrincipal ShopUserDetails principal) {
        UserDto user = userService.convertUserToDto(userService.getUserById(principal.getId()));
        return ResponseEntity.ok(new ApiResponse("Success", user));
    }
}
