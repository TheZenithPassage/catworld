package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.SensitiveStayContext;
import org.springframework.data.repository.Repository;

import java.util.UUID;

public interface SensitiveStayContextRepository
        extends Repository<SensitiveStayContext, UUID> {

    <S extends SensitiveStayContext> S saveAndFlush(S context);
}
