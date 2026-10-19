package dev.pioruocco.piocart.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Authenticates requests carrying a valid "Authorization: Bearer" token. Requests without one
 * continue anonymously, so public endpoints keep working and protected ones get a 401.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final ShopUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            jwtService.extractEmail(header.substring(BEARER_PREFIX.length())).ifPresent(email -> {
                try {
                    ShopUserDetails user = userDetailsService.loadUserByUsername(email);
                    var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (UsernameNotFoundException e) {
                    // token of a deleted user: stay anonymous
                }
            });
        }
        chain.doFilter(request, response);
    }
}
