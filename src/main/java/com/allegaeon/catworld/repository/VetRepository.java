package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Vet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VetRepository extends JpaRepository<Vet, UUID> {
}
