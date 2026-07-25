package org.juns.moneylog.user.repository;

import org.juns.moneylog.config.enums.Provider;
import org.juns.moneylog.user.domain.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OAuthAccountRepository
        extends JpaRepository<OAuthAccount, Long> {

    Optional<OAuthAccount> findByProviderAndProviderUserId(
            Provider provider,
            String providerUserId
    );
}
