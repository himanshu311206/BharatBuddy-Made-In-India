package com.bharatbuddy.backend.controller;

import com.bharatbuddy.backend.dto.ApiResponse;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
public class FileUploadController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    public FileUploadController() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            System.err.println("Failed to create uploads directory: " + e.getMessage());
        }
    }

    @PostMapping("/api/upload")
    public ResponseEntity<ApiResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Uploaded file is empty."));
        }

        try {
            String originalFileName = file.getOriginalFilename();
            String cleanFileName = originalFileName != null ? originalFileName.replaceAll("[^a-zA-Z0-9._-]", "_") : "file";
            String uniqueFileName = UUID.randomUUID().toString().substring(0, 8) + "_" + cleanFileName;

            Path targetPath = uploadDir.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetPath);

            String fileType = "DOCUMENT";
            String contentType = file.getContentType();
            if (contentType != null && contentType.startsWith("image/")) {
                fileType = "IMAGE";
            }

            String fileUrl = "http://localhost:8080/uploads/" + uniqueFileName;

            Map<String, Object> data = new HashMap<>();
            data.put("url", fileUrl);
            data.put("fileName", originalFileName);
            data.put("attachmentType", fileType);
            data.put("size", file.getSize());

            return ResponseEntity.ok(new ApiResponse(true, "File uploaded successfully", data));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(new ApiResponse(false, "Failed to upload file: " + e.getMessage()));
        }
    }

    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path filePath = uploadDir.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
