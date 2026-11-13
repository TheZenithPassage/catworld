package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatInformationalPhotoSummary;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.CatInformationalPhoto;
import com.allegaeon.catworld.repository.CatInformationalPhotoRepository;
import com.allegaeon.catworld.repository.CatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatInformationalPhotoService {
    private final CatRepository cats;
    private final CatInformationalPhotoRepository photos;
    private final LibVipsCatPhotoNormalizer normalizer;
    private final Clock clock;

    public List<CatInformationalPhotoSummary> list(UUID catId) {
        if (!cats.existsById(catId)) throw new ResourceNotFoundException("Cat", catId);
        return photos.findGallery(catId);
    }

    public CatInformationalPhotoSummary add(UUID catId, MultipartFile upload) {
        var cat = cats.findById(catId).orElseThrow(() -> new ResourceNotFoundException("Cat", catId));
        var normalized = normalizer.normalize(upload);
        var photo = photos.save(new CatInformationalPhoto(cat, clock.instant(), normalized.bytes()));
        return new CatInformationalPhotoSummary(photo.getId(), photo.getCreatedAt());
    }

    public byte[] content(UUID catId, UUID photoId) {
        return photos.findContent(catId, photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Cat informational photo", photoId));
    }

    public void delete(UUID catId, UUID photoId) {
        if (photos.deletePhoto(catId, photoId) == 0) {
            throw new ResourceNotFoundException("Cat informational photo", photoId);
        }
    }
}
