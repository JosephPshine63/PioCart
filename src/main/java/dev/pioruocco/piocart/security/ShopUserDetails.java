package dev.pioruocco.piocart.security;

import dev.pioruocco.piocart.enums.Role;
import dev.pioruocco.piocart.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Authenticated principal. Controllers receive it with {@code @AuthenticationPrincipal}.
 */
@Getter
public class ShopUserDetails implements UserDetails {
    private final Long id;
    private final String email;
    private final String password;
    private final Role role;

    public ShopUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        // users created before roles existed have none
        this.role = user.getRole() != null ? user.getRole() : Role.USER;
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }
}
