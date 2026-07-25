package org.juns.moneylog.user.repository;

import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.user.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role,Long> {
    Optional<Role> findByName(RoleType name);
}
