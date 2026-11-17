package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.GalleryPublicationRequest;
import com.allegaeon.catworld.dto.GalleryPublicationSummary;
import com.allegaeon.catworld.dto.PublicGalleryEntry;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.GalleryCatKind;
import com.allegaeon.catworld.model.GalleryPublication;
import com.allegaeon.catworld.repository.GalleryPublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GalleryPublicationService {
    private final GalleryPublicationRepository publications;
    private final LibVipsCatPhotoNormalizer photoNormalizer;
    private final Clock clock;

    public List<GalleryPublicationSummary> draftsAndPublications() {
        return publications.findSummaries();
    }

    public List<PublicGalleryEntry> publishedEntries() {
        return publications.findPublishedEntries();
    }

    public Optional<byte[]> publishedPhoto(UUID id) {
        return publications.findPublishedById(id).map(GalleryPublication::getPhoto);
    }

    public byte[] previewPhoto(UUID id) {
        return publications.findById(id).orElseThrow(() -> new ResourceNotFoundException("Gallery publication", id)).getPhoto();
    }

    @Transactional
    public GalleryPublicationSummary create(GalleryPublicationRequest request, MultipartFile photo) {
        var normalized = normalize(photo);
        var publication = new GalleryPublication();
        applyText(publication, request);
        applyPhoto(publication, normalized);
        return summarize(publications.saveAndFlush(publication));
    }

    @Transactional
    public GalleryPublicationSummary update(UUID id, GalleryPublicationRequest request, MultipartFile photo) {
        var normalized = photo == null ? null : normalize(photo);
        var publication = findForUpdate(id);
        if (publication.getPublishedAt() != null) {
            throw new ConflictException("Hide the publication before editing it");
        }

        applyText(publication, request);
        if (normalized != null) applyPhoto(publication, normalized);
        publications.flush();
        return summarize(publication);
    }

    @Transactional
    public GalleryPublicationSummary publish(UUID id, long version, boolean guestPermissionConfirmed) {
        var publication = findForUpdate(id);
        if (publication.getVersion() != version) {
            throw new ConflictException("The publication changed. Open it again before publishing.");
        }
        if (publication.getPublishedAt() == null) {
            boolean guest = publication.getKind() == GalleryCatKind.GUEST;
            if (guest && !guestPermissionConfirmed) {
                throw new BadRequestException("Guest publication requires permission confirmation");
            }
            publication.setGuestPermissionConfirmed(guest);
            publication.setPublishedAt(clock.instant());
            publications.flush();
        }
        return summarize(publication);
    }

    @Transactional
    public GalleryPublicationSummary hide(UUID id) {
        var publication = findForUpdate(id);
        publication.setPublishedAt(null);
        publication.setGuestPermissionConfirmed(false);
        publications.flush();
        return summarize(publication);
    }

    private GalleryPublication findForUpdate(UUID id) {
        return publications.findForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Gallery publication", id));
    }

    private NormalizedCatPhoto normalize(MultipartFile photo) {
        if (photo == null || photo.isEmpty()) throw new BadRequestException("A gallery photo is required");
        return photoNormalizer.normalize(photo);
    }

    private static void applyText(GalleryPublication publication, GalleryPublicationRequest request) {
        publication.setName(request.name().strip());
        publication.setKind(request.kind());
        var description = request.description();
        publication.setDescription(description == null || description.isBlank() ? null : description.strip());
    }

    private static void applyPhoto(GalleryPublication publication, NormalizedCatPhoto photo) {
        publication.setPhoto(photo.bytes());
        publication.setWidth(photo.width());
        publication.setHeight(photo.height());
    }

    private static GalleryPublicationSummary summarize(GalleryPublication publication) {
        return new GalleryPublicationSummary(publication.getId(), publication.getName(), publication.getDescription(),
                publication.getKind(), publication.getPublishedAt(), publication.getVersion());
    }
}
