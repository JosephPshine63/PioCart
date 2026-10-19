package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.dto.UserDto;
import dev.pioruocco.piocart.model.User;
import dev.pioruocco.piocart.request.UserUpdateRequest;
import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.security.ShopUserDetails;
import dev.pioruocco.piocart.service.user.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/users")
public class UserController {
    private final IUserService userService;

    @PutMapping("/me")
    public ResponseEntity<ApiResponse> updateMe(@AuthenticationPrincipal ShopUserDetails principal,
                                                @Valid @RequestBody UserUpdateRequest request) {
        User user = userService.updateUser(request, principal.getId());
        return ResponseEntity.ok(new ApiResponse("Update User Success!", userService.convertUserToDto(user)));
    }

    @GetMapping("/{userId}/user")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        UserDto userDto = userService.convertUserToDto(user);
        return ResponseEntity.ok(new ApiResponse("Success", userDto));
    }

    @PutMapping("/{userId}/update")
    public ResponseEntity<ApiResponse> updateUser(@Valid @RequestBody UserUpdateRequest request, @PathVariable Long userId) {
        User user = userService.updateUser(request, userId);
        UserDto userDto = userService.convertUserToDto(user);
        return ResponseEntity.ok(new ApiResponse("Update User Success!", userDto));
    }

    @DeleteMapping("/{userId}/delete")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(new ApiResponse("Delete User Success!", null));
    }
}
