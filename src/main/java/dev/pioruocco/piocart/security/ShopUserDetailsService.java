package dev.pioruocco.piocart.security;

import dev.pioruocco.piocart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ShopUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public ShopUserDetails loadUserByUsername(String email) {
        return userRepository.findByEmail(email)
                .map(ShopUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
