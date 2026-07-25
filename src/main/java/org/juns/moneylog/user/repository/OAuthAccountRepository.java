package org.juns.moneylog.user.repository;

import org.juns.moneylog.config.enums.Provider;
import org.juns.moneylog.user.domain.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OAuthAccountRepository
        extends JpaRepository<OAuthAccount, Long> {

    Optional<OAuthAccount> findByProviderAndProviderUserId(
            Provider provider,
            String providerUserId
    );

    @Query("""
        select oa
        from OAuthAccount oa
        join fetch oa.user u
        left join fetch u.roles
        where oa.provider = :provider
          and oa.providerUserId = :providerUserId
        """)
    Optional<OAuthAccount> findWithUserByProviderAndProviderUserId(
            @Param("provider") Provider provider,
            @Param("providerUserId") String providerUserId
    );
}
