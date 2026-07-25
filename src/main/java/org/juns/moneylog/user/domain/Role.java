package org.juns.moneylog.user.domain;

import jakarta.persistence.*;
import lombok.*;
import org.juns.moneylog.config.enums.RoleType;

@Entity
@Table(name = "roles")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private RoleType name;
}