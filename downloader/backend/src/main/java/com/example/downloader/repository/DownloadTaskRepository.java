package com.example.downloader.repository;

import com.example.downloader.model.DownloadStatus;
import com.example.downloader.model.DownloadTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DownloadTaskRepository extends JpaRepository<DownloadTask, Long> {

    Optional<DownloadTask> findByGid(String gid);

    List<DownloadTask> findByStatusIn(List<DownloadStatus> statuses);

    List<DownloadTask> findAllByOrderByCreatedAtDesc();
}
