package com.example.shop.service;

import com.example.shop.dto.request.LoginRequest;
import com.example.shop.dto.request.RegisterRequest;
import com.example.shop.dto.response.JwtResponse;
import com.example.shop.dto.response.MessageResponse;
import com.example.shop.model.Role;
import com.example.shop.model.User;
import com.example.shop.repository.RoleRepository;
import com.example.shop.repository.UserRepository;
import com.example.shop.security.JwtUtils;
import com.example.shop.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return new JwtResponse(jwt, userDetails.getId(),
                userDetails.getUsername(), userDetails.getEmail(), roles);
    }

    public MessageResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return new MessageResponse("Error: Username is already taken!");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return new MessageResponse("Error: Email is already in use!");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .build();

        Set<String> strRoles = registerRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null || strRoles.isEmpty()) {
            Role userRole = roleRepository.findByName(Role.ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Role ROLE_USER is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                if ("admin".equals(role)) {
                    Role adminRole = roleRepository.findByName(Role.ERole.ROLE_ADMIN)
                            .orElseThrow(() -> new RuntimeException("Error: Role ROLE_ADMIN is not found."));
                    roles.add(adminRole);
                } else {
                    Role userRole = roleRepository.findByName(Role.ERole.ROLE_USER)
                            .orElseThrow(() -> new RuntimeException("Error: Role ROLE_USER is not found."));
                    roles.add(userRole);
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);
        return new MessageResponse("User registered successfully!");
    }
}
