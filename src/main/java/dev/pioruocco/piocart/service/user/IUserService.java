package dev.pioruocco.piocart.service.user;

import dev.pioruocco.piocart.dto.UserDto;
import dev.pioruocco.piocart.model.User;
import dev.pioruocco.piocart.request.CreateUserRequest;
import dev.pioruocco.piocart.request.UserUpdateRequest;

public interface IUserService {

    User getUserById(Long userId);
    User createUser(CreateUserRequest request);
    User updateUser(UserUpdateRequest request, Long userId);
    void deleteUser(Long userId);

    UserDto convertUserToDto(User user);
}
