package com.avenra.identity.application;

import com.avenra.identity.UserDirectory;
import com.avenra.identity.infrastructure.UserRecord;
import com.avenra.identity.infrastructure.UserRepository;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
class JdbcUserDirectory implements UserDirectory {

    private final UserRepository users;

    JdbcUserDirectory(UserRepository users) {
        this.users = users;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserSummary> find(UUID userId) {
        return users.findById(userId).map(JdbcUserDirectory::summary);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, UserSummary> findAll(Collection<UUID> userIds) {
        return users.findAll(userIds).stream()
                .map(JdbcUserDirectory::summary)
                .collect(Collectors.toUnmodifiableMap(UserSummary::id, Function.identity()));
    }

    private static UserSummary summary(UserRecord user) {
        return new UserSummary(
                user.id(), user.email(), user.emailNormalized(), user.displayName(), user.emailVerified());
    }
}
