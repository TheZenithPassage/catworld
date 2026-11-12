package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.OperationsTask;
import com.allegaeon.catworld.model.OperationsTaskTransition;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OperationsTaskRepository extends JpaRepository<OperationsTask, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select task from OperationsTask task where task.id = :id")
    Optional<OperationsTask> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
            select task as task, transition as transition
            from OperationsTask task
            left join OperationsTaskTransition transition on transition.task = task and transition.revision = (
                select max(previous.revision) from OperationsTaskTransition previous where previous.task = task
            )
            order by task.dueDate, task.createdAt desc, task.id
            """)
    List<Snapshot> findCurrentTasks();

    interface Snapshot {
        OperationsTask getTask();
        OperationsTaskTransition getTransition();
    }
}
